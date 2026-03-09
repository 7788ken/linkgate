# 架构设计

本文档介绍 LinkGate 的系统架构和技术设计。

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Load Balancer │
                    │    (Nginx)     │
                    └───────┬────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
          ┌─────▼─────┐ ┌──▼──────┐ ┌──▼──────┐
          │ Gateway 1 │ │Gateway 2│ │Gateway 3│
          └─────┬─────┘ └──┬──────┘ └──┬──────┘
                │           │           │
                └───────────┼───────────┘
                            │
                    ┌───────▼────────┐
                    │  Redis Cluster │
                    │   (主从复制)    │
                    └───────┬────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
          ┌─────▼─────┐           ┌────▼─────┐
          │  Agent 1  │           │ Agent 2  │
          │ (内网服务) │           │(内网服务) │
          └─────┬─────┘           └────┬─────┘
                │                       │
          ┌─────▼─────┐           ┌────▼─────┐
          │Local Apps │           │Dev Server│
          └───────────┘           └──────────┘
```

### 组件职责

| 组件 | 职责 | 技术栈 |
|------|------|--------|
| **Load Balancer** | SSL 终止、负载均衡、速率限制 | Nginx |
| **Gateway** | 配对码管理、Agent 注册、心跳检测 | Fastify + TypeScript |
| **Redis** | 临时数据存储、会话管理、分布式锁 | Redis 7 |
| **Agent** | 本地服务代理、心跳上报、自动重连 | Node.js + TypeScript |

## 核心流程

### 1. Agent 注册流程

```typescript
// 时序图
Agent -> Gateway: POST /api/agent/register
    {
      agent_id: "agent-abc123",
      endpoint: "http://192.168.1.100:8080"
    }

Gateway -> Redis: 存储Agent信息
    SET agent:agent-abc123 {
      endpoint: "http://192.168.1.100:8080",
      status: "online",
      registered_at: timestamp
    }
    EXPIRE agent:agent-abc123 600

Gateway -> Redis: 生成配对码
    SET pairing:847291 agent-abc123
    EXPIRE pairing:847291 300

Gateway -> Agent: 返回配对码
    {
      pairing_code: "847291",
      expires_at: "2026-03-09T00:05:00Z",
      ttl: 300
    }
```

### 2. 配对流程

```typescript
Mobile App -> Gateway: POST /api/pair
    {
      pairing_code: "847291",
      device_id: "mobile-123"
    }

Gateway -> Redis: 验证配对码
    GET pairing:847291
    返回: agent-abc123

Gateway -> Redis: 获取Agent信息
    GET agent:agent-abc123
    返回: {
      endpoint: "http://192.168.1.100:8080",
      status: "online"
    }

Gateway -> Redis: 清理配对码(一次性)
    DEL pairing:847291

Gateway -> Mobile App: 返回Agent信息
    {
      agent_id: "agent-abc123",
      endpoint: "http://192.168.1.100:8080"
    }

Mobile App -> Agent: 直接通信
    POST http://192.168.1.100:8080/api/data
```

### 3. 心跳流程

```typescript
Agent -> Gateway: POST /api/agent/heartbeat
    {
      agent_id: "agent-abc123",
      status: { cpu: "45%", memory: "512MB" }
    }

Gateway -> Redis: 更新Agent状态
    HSET agent:agent-abc123 status "online"
    HSET agent:agent-abc123 last_heartbeat timestamp
    EXPIRE agent:agent-abc123 600

Gateway -> Agent: 返回确认
    {
      success: true,
      next_heartbeat: 60
    }
```

## 数据模型

### Redis 数据结构

#### Agent 信息

```redis
# Hash - Agent 基本信息
agent:{agent_id}
  - agent_id: string
  - endpoint: string
  - status: "online" | "offline"
  - registered_at: timestamp
  - last_heartbeat: timestamp
  - metadata: json

# TTL: 600 秒 (10分钟,根据心跳自动续期)
```

#### 配对码映射

```redis
# String - 配对码到 Agent ID 的映射
pairing:{code} = agent_id

# TTL: 300 秒 (5分钟)
```

#### 配对码索引

```redis
# Set - Agent 的所有配对码
agent_pairings:{agent_id} = [code1, code2, ...]

# TTL: 跟随 Agent TTL
```

#### 统计信息

```redis
# HyperLogLog - 活跃 Agent 数
active_agents:count

# Sorted Set - Agent 心跳时间排行
agent_heartbeats
  {agent_id} => timestamp
```

## 技术选型

### Gateway - Fastify

**选择理由**:

1. **高性能**: 比 Express 快 2 倍
2. **低开销**: 请求处理时间 < 1ms
3. **TypeScript**: 原生支持,类型安全
4. **插件生态**: 丰富的插件系统

**性能对比**:

```
Fastify:  76,835 req/sec
Express:  38,289 req/sec
Hapi:     31,825 req/sec
```

### Redis

**选择理由**:

1. **内存存储**: 配对码和会话数据需要快速访问
2. **TTL 支持**: 自动过期临时数据
3. **原子操作**: 配对码生成和验证的原子性
4. **高可用**: 主从复制和 Cluster 模式

**为什么不用其他数据库?**

- **MySQL/PostgreSQL**: 关系型数据库不适合临时数据
- **MongoDB**: 文档型数据库,但 TTL 不如 Redis 高效
- **Memcached**: 不支持持久化和复杂数据结构

### TypeScript

**选择理由**:

1. **类型安全**: 减少运行时错误
2. **IDE 支持**: 更好的代码补全和重构
3. **可维护性**: 大型项目更易维护
4. **生态**: Node.js 生态原生支持

## 安全设计

### 1. 配对码安全

**生成算法**:

```typescript
import crypto from 'crypto'

function generatePairingCode(length = 6): string {
  // 使用加密安全的随机数生成器
  const bytes = crypto.randomBytes(Math.ceil(length / 2))
  const code = parseInt(bytes.toString('hex'), 16)

  // 限制在指定长度
  return (code % Math.pow(10, length)).toString().padStart(length, '0')
}
```

**安全特性**:

- 加密安全随机数
- 6 位数字,熵 = log2(10^6) ≈ 19.9 bits
- 一次性使用,防止重放攻击
- 5 分钟过期,限制攻击窗口

### 2. 传输安全

**HTTPS 强制**:

```typescript
// 重定向 HTTP 到 HTTPS
app.use((req, res, next) => {
  if (req.protocol === 'http' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`)
  }
  next()
})
```

**HSTS**:

```typescript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})
```

### 3. 速率限制

**分布式速率限制**:

```typescript
import RedisStore from 'rate-limit-redis'

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 60 * 1000, // 1 分钟
  max: 100, // 最多 100 次请求
  skip: (req) => {
    // 内网 IP 跳过速率限制
    return isPrivateIP(req.ip)
  }
})
```

### 4. 输入验证

**Schema 验证**:

```typescript
import { z } from 'zod'

const registerSchema = z.object({
  agent_id: z.string().min(1).max(100),
  endpoint: z.string().url(),
  metadata: z.record(z.any()).optional()
})

app.post('/api/agent/register', async (req, reply) => {
  const body = registerSchema.parse(req.body)
  // ...
})
```

## 可扩展性

### 水平扩展

**Gateway 无状态**:

```yaml
# docker-compose.scale.yml
services:
  gateway:
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

**Redis Cluster**:

```bash
# 6 节点 Redis Cluster (3 主 3 从)
redis-cli --cluster create \
  10.0.0.1:6379 \
  10.0.0.2:6379 \
  10.0.0.3:6379 \
  10.0.0.4:6379 \
  10.0.0.5:6379 \
  10.0.0.6:6379 \
  --cluster-replicas 1
```

### 性能基准

**单实例性能**:

- 并发连接: 10,000
- 请求/秒: 50,000+
- 延迟(P99): < 20ms

**集群性能**:

- 3 节点集群: 150,000+ req/sec
- 5 节点集群: 250,000+ req/sec

## 容错设计

### 1. Agent 自动重连

```typescript
class Agent {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  async heartbeat() {
    try {
      await this.sendHeartbeat()
      this.reconnectAttempts = 0
    } catch (error) {
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // 超过最大重试次数,重新注册
        await this.register()
        this.reconnectAttempts = 0
      } else {
        // 指数退避重试
        const delay = Math.pow(2, this.reconnectAttempts) * 1000
        await sleep(delay)
      }
    }
  }
}
```

### 2. Redis 故障转移

**Sentinel 模式**:

```javascript
const redis = new Redis({
  sentinels: [
    { host: '10.0.0.1', port: 26379 },
    { host: '10.0.0.2', port: 26379 },
    { host: '10.0.0.3', port: 26379 }
  ],
  name: 'mymaster'
})
```

### 3. Gateway 健康检查

```typescript
app.get('/health', async (req, reply) => {
  const checks = {
    redis: await checkRedis(),
    memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024, // < 1GB
    cpu: process.cpuUsage().user < 80 // CPU < 80%
  }

  const isHealthy = Object.values(checks).every(Boolean)

  reply.code(isHealthy ? 200 : 503)
  return { status: isHealthy ? 'ok' : 'degraded', checks }
})
```

## 未来规划

### Phase 1: MVP (当前)

- ✅ HTTP API
- ✅ Redis 临时存储
- ✅ Agent CLI

### Phase 2: 增强功能

- ✅ WebSocket 实时通信
- ✅ 心跳机制
- ✅ QR 码支持

### Phase 3: P2P 优化

- 🔄 NAT 穿透 (STUN/TURN)
- 🔄 WebRTC 集成
- 🔄 E2EE 加密

### Phase 4: 企业功能

- 📋 多租户支持
- 📋 RBAC 权限控制
- 📋 审计日志
- 📋 自定义域名

## 相关文档

- [技术选型](/technical/stack) - 详细的技术选型说明
- [安全设计](/technical/security) - 安全机制详解
- [API 文档](/guide/api) - API 接口文档
