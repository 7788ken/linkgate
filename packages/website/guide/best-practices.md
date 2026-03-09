# 最佳实践

本文档提供 LinkGate 在生产环境中的最佳实践建议。

## 架构设计

### 1. 网络拓扑

**推荐架构**:

```
Internet
    │
    ├─ Nginx (反向代理 + SSL)
    │   │
    │   ├─ Gateway (集群)
    │   │   ├─ Instance 1
    │   │   ├─ Instance 2
    │   │   └─ Instance 3
    │   │
    │   └─ Redis (主从复制)
    │       ├─ Master
    │       └─ Slave
    │
    └─ Agents (内网)
        ├─ Agent 1
        └─ Agent 2
```

### 2. 高可用部署

**Gateway 集群**:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'linkgate-gateway',
    script: 'npm',
    args: 'run start',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
```

**Redis 主从**:

```bash
# Master
redis-server --port 6379

# Slave
redis-server --port 6380 --slaveof 127.0.0.1 6379
```

## 安全实践

### 1. 传输安全

**始终使用 HTTPS**:

```nginx
server {
    listen 443 ssl http2;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 2. Redis 安全

**启用认证和加密**:

```bash
# redis.conf
requirepass <strong-password>
tls-port 6379
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt
```

**连接字符串**:

```env
REDIS_URL=rediss://:password@localhost:6379
```

### 3. 网络隔离

**防火墙规则**:

```bash
# 仅允许 Nginx 访问 Gateway
sudo ufw allow from 127.0.0.1 to any port 3000

# 仅允许 Gateway 访问 Redis
sudo ufw allow from 127.0.0.1 to any port 6379
```

**VPC 隔离**:

```yaml
# AWS/GCP/Azure VPC 配置
Gateway: 公网子网
Redis: 私有子网
Agents: 私有子网
```

### 4. 速率限制

**Nginx 层**:

```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=pairing:10m rate=10r/m;

location /api/pair {
    limit_req zone=pairing burst=20 nodelay;
    proxy_pass http://gateway;
}
```

**应用层**:

```typescript
// gateway/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit'

export const pairingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 20, // 最多 20 次请求
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: '配对请求过于频繁,请稍后再试'
  }
})
```

## 性能优化

### 1. Redis 优化

**配置优化**:

```bash
# redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru

# 持久化
appendonly yes
appendfsync everysec

# 网络优化
tcp-backlog 511
tcp-keepalive 300
```

**连接池**:

```typescript
import { createPool } from 'generic-pool'
import { createClient } from 'redis'

const redisPool = createPool({
  create: () => createClient({ url: process.env.REDIS_URL }),
  destroy: (client) => client.quit()
}, {
  min: 5,
  max: 20
})
```

### 2. Gateway 优化

**启用压缩**:

```typescript
import fastifyCompress from '@fastify/compress'

app.register(fastifyCompress, {
  global: true,
  encodings: ['gzip', 'deflate']
})
```

**缓存策略**:

```typescript
// 静态资源缓存
app.get('/static/*', (req, reply) => {
  reply.header('Cache-Control', 'public, max-age=31536000')
})
```

**连接复用**:

```typescript
// 使用 HTTP/2
import { createSecureServer } from 'http2'

const server = createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app)
```

### 3. Agent 优化

**批量心跳**:

```typescript
// 批量发送心跳(多个 Agent)
const agents = [agent1, agent2, agent3]

setInterval(async () => {
  await Promise.all(agents.map(agent => agent.heartbeat()))
}, 60000)
```

**本地缓存**:

```typescript
// 缓存配对信息
const pairingCache = new Map()

agent.on('paired', (data) => {
  pairingCache.set(data.deviceId, data)
  // 5 分钟后清理
  setTimeout(() => pairingCache.delete(data.deviceId), 300000)
})
```

## 可观测性

### 1. 日志规范

**结构化日志**:

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'app.log' })
  ]
})

// 使用
logger.info('Agent registered', {
  agentId: 'agent-abc123',
  pairingCode: '847291',
  ip: req.ip
})
```

**日志级别**:

- `error`: 错误和异常
- `warn`: 警告信息
- `info`: 重要业务事件(注册、配对等)
- `debug`: 调试信息

### 2. 监控指标

**关键指标**:

```typescript
// Prometheus 指标
import client from 'prom-client'

const register = new client.Registry()

// 配对成功数
const pairingTotal = new client.Counter({
  name: 'linkgate_pairing_total',
  help: 'Total number of successful pairings',
  registers: [register]
})

// 活跃 Agent 数
const activeAgents = new client.Gauge({
  name: 'linkgate_active_agents',
  help: 'Number of active agents',
  registers: [register]
})

// 配对码生成耗时
const pairingCodeDuration = new client.Histogram({
  name: 'linkgate_pairing_code_duration_seconds',
  help: 'Duration of pairing code generation',
  registers: [register]
})
```

**健康检查**:

```typescript
app.get('/health', async (req, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      redis: await checkRedis(),
      memory: checkMemory(),
      cpu: checkCPU()
    }
  }

  const isHealthy = Object.values(health.checks)
    .every(check => check.status === 'ok')

  reply.code(isHealthy ? 200 : 503)
  return health
})
```

### 3. 告警规则

**Prometheus 告警**:

```yaml
# alert.rules.yml
groups:
- name: linkgate
  rules:
  - alert: HighPairingFailureRate
    expr: rate(linkgate_pairing_failures_total[5m]) > 0.1
    for: 5m
    annotations:
      summary: "配对失败率过高"

  - alert: RedisDown
    expr: linkgate_redis_up == 0
    for: 1m
    annotations:
      summary: "Redis 连接失败"

  - alert: HighMemoryUsage
    expr: linkgate_memory_usage_bytes > 1073741824  # 1GB
    for: 5m
    annotations:
      summary: "内存使用过高"
```

## 错误处理

### 1. 优雅降级

**Redis 故障降级**:

```typescript
let redisAvailable = true

async function getAgent(agentId: string) {
  if (redisAvailable) {
    try {
      return await redis.get(`agent:${agentId}`)
    } catch (error) {
      logger.error('Redis error, switching to memory cache', error)
      redisAvailable = false
    }
  }

  // 降级到内存缓存
  return memoryCache.get(agentId)
}
```

### 2. 重试机制

**指数退避重试**:

```typescript
async function registerWithRetry(options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await register(options)
    } catch (error) {
      if (i === maxRetries - 1) throw error

      const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
      await sleep(delay)
    }
  }
}
```

### 3. 熔断器

```typescript
import CircuitBreaker from 'opossum'

const breaker = new CircuitBreaker(register, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
})

breaker.fallback(() => ({
  error: 'SERVICE_UNAVAILABLE',
  message: '服务暂时不可用,请稍后再试'
}))
```

## 备份和恢复

### 1. Redis 备份

**定时备份脚本**:

```bash
#!/bin/bash
# backup-redis.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/redis"
REDIS_PASS="your-password"

# 触发 RDB 快照
redis-cli -a $REDIS_PASS BGSAVE

# 等待快照完成
sleep 5

# 复制备份文件
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# 保留最近 7 天的备份
find $BACKUP_DIR -name "dump_*.rdb" -mtime +7 -delete

echo "Redis backup completed: dump_$DATE.rdb"
```

**Cron 任务**:

```bash
# 每天凌晨 2 点备份
0 2 * * * /opt/scripts/backup-redis.sh >> /var/log/redis-backup.log 2>&1
```

### 2. 配置管理

**版本控制**:

```bash
# 将配置文件纳入 Git 管理
git add .env.example nginx.conf redis.conf
git commit -m "Update production configs"
```

**配置同步**:

```bash
# 同步到生产服务器
rsync -avz configs/ production:/opt/linkgate/configs/
```

## 容量规划

### 1. 资源估算

**Gateway**:
- CPU: 2 核
- 内存: 1-2 GB
- 网络: 100 Mbps

**Redis**:
- CPU: 2 核
- 内存: 2-4 GB (根据配对数调整)
- 存储: 10 GB (AOF + RDB)

**容量计算**:

```
每个配对 ≈ 1 KB (Redis 存储)
1 万个配对 ≈ 10 MB
10 万个配对 ≈ 100 MB
```

### 2. 扩展策略

**水平扩展**:

```yaml
# docker-compose.scale.yml
services:
  gateway:
    deploy:
      replicas: 3
```

**Redis 分片**:

```bash
# 使用 Redis Cluster
redis-cli --cluster create \
  127.0.0.1:7000 \
  127.0.0.1:7001 \
  127.0.0.1:7002 \
  127.0.0.1:7003 \
  127.0.0.1:7004 \
  127.0.0.1:7005 \
  --cluster-replicas 1
```

## 故障恢复

### 1. 故障演练

**定期测试**:

- Redis 故障恢复
- Gateway 重启
- 网络分区
- 磁盘满

### 2. 灾难恢复

**RPO/RTO**:

- RPO (Recovery Point Objective): 5 分钟
- RTO (Recovery Time Objective): 15 分钟

**恢复步骤**:

```bash
# 1. 停止服务
pm2 stop all

# 2. 恢复 Redis 数据
redis-cli SHUTDOWN NOSAVE
cp /backup/redis/dump_latest.rdb /var/lib/redis/dump.rdb
redis-server /etc/redis/redis.conf

# 3. 重启 Gateway
pm2 restart all

# 4. 验证服务
curl http://localhost:3000/health
```

## 合规性

### 1. 数据保护

**隐私保护**:

- 不持久化敏感数据
- 配对码一次性使用
- 定期清理过期数据

**GDPR 合规**:

```typescript
// 用户请求删除数据
app.delete('/api/user/data', async (req, reply) => {
  const deviceId = req.body.device_id

  // 删除所有相关数据
  await redis.del(`device:${deviceId}`)
  await redis.del(`pairings:${deviceId}`)

  return { message: '数据已删除' }
})
```

### 2. 审计日志

```typescript
// 记录关键操作
const auditLog = (action, userId, details) => {
  logger.info('AUDIT', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ip: req.ip
  })
}

// 使用
auditLog('PAIRING_SUCCESS', deviceId, { agentId, pairingCode })
```

## 下一步

- [部署指南](/guide/deployment) - 生产环境部署
- [技术架构](/technical/architecture) - 了解系统架构
- [FAQ](/faq) - 常见问题
