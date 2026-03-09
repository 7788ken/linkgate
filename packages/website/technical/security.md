# 安全设计

本文档详细介绍 LinkGate 的安全机制和最佳实践。

## 安全模型

### 核心原则

1. **最小权限**: 组件只拥有完成任务所需的最小权限
2. **纵深防御**: 多层安全防护,单点失效不影响整体
3. **零信任**: 不信任任何输入,所有数据都需验证
4. **隐私优先**: 不持久化敏感数据,配对即焚

### 威胁模型

```
┌─────────────────────────────────────────────────┐
│                 威胁分类                         │
├─────────────────────────────────────────────────┤
│ 1. 网络威胁                                      │
│    - 中间人攻击 (MITM)                          │
│    - 重放攻击                                    │
│    - DDoS 攻击                                   │
│                                                  │
│ 2. 应用层威胁                                    │
│    - 注入攻击 (SQL/NoSQL/Command)               │
│    - XSS (跨站脚本)                             │
│    - CSRF (跨站请求伪造)                        │
│                                                  │
│ 3. 数据威胁                                      │
│    - 配对码泄露                                  │
│    - 敏感数据暴露                                │
│    - 未授权访问                                  │
│                                                  │
│ 4. 基础设施威胁                                  │
│    - Redis 未授权访问                           │
│    - 容器逃逸                                    │
│    - 供应链攻击                                  │
└─────────────────────────────────────────────────┘
```

## 配对码安全

### 生成算法

**加密安全随机数**:

```typescript
import crypto from 'crypto'

function generatePairingCode(length = 6): string {
  // 使用 crypto.randomBytes (CSPRNG)
  const bytes = crypto.randomBytes(Math.ceil(length / 2))
  const code = parseInt(bytes.toString('hex'), 16)

  // 限制在指定长度
  return (code % Math.pow(10, length))
    .toString()
    .padStart(length, '0')
}
```

**为什么不用 Math.random()?**

```typescript
// ❌ 不安全
const code = Math.floor(Math.random() * 1000000)

// Math.random() 是伪随机数生成器 (PRNG)
// 可预测,不适合安全场景
```

### 熵分析

**6 位数字配对码**:

- 可能性: 10^6 = 1,000,000
- 熵: log2(10^6) ≈ 19.9 bits

**安全性评估**:

- 在线暴力破解: 5 分钟内最多尝试 100 次
  - 成功概率: 100 / 1,000,000 = 0.01%
- 离线暴力破解: 不可行(一次性使用)

### 一次性使用

**实现机制**:

```typescript
async function pairDevice(pairingCode: string, deviceId: string) {
  // 1. 验证配对码(原子操作)
  const agentId = await redis.get(`pairing:${pairingCode}`)

  if (!agentId) {
    throw new Error('INVALID_PAIRING_CODE')
  }

  // 2. 立即删除配对码(一次性使用)
  const deleted = await redis.del(`pairing:${pairingCode}`)

  if (deleted === 0) {
    // 配对码已被使用(竞态条件)
    throw new Error('PAIRING_CODE_ALREADY_USED')
  }

  // 3. 返回 Agent 信息
  const agent = await redis.hgetall(`agent:${agentId}`)
  return agent
}
```

**为什么需要原子操作?**

```
时间线:
T1: 设备 A 验证配对码 -> 成功
T2: 设备 B 验证配对码 -> 成功 (竞态条件!)
T3: 设备 A 删除配对码
T4: 设备 B 删除配对码 (失败,已删除)

结果: 两个设备都配对成功 ❌

解决: 使用 Redis 事务或 Lua 脚本
```

### 过期机制

**TTL 配置**:

```typescript
// 设置 5 分钟过期
await redis.setex(`pairing:${code}`, 300, agentId)
```

**过期策略**:

- 默认: 5 分钟 (300 秒)
- 最小: 1 分钟 (60 秒)
- 最大: 30 分钟 (1800 秒)

**权衡**:

- 过短: 用户体验差,可能来不及输入
- 过长: 增加攻击窗口

## 传输安全

### HTTPS 强制

**配置**:

```typescript
import fastify from 'fastify'
import fastifySsl from '@fastify/https-redirect'

const app = fastify()

// 生产环境强制 HTTPS
if (process.env.NODE_ENV === 'production') {
  app.register(fastifySsl, {
    httpPort: 80,
    httpsPort: 443
  })
}
```

**证书配置**:

```nginx
server {
    listen 443 ssl http2;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SSL 优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 证书固定 (Certificate Pinning)

**移动端实现**:

```typescript
// iOS (Swift)
let cert = "your-cert-hash"
session.configuration.urlCredentialStorage = nil

// Android (Kotlin)
val certPinner = CertificatePinner.Builder()
    .add("gateway.example.com", "sha256/your-cert-hash")
    .build()
```

## 输入验证

### Schema 验证

**使用 Zod**:

```typescript
import { z } from 'zod'

// 注册请求验证
const registerSchema = z.object({
  agent_id: z.string()
    .min(1, 'Agent ID 不能为空')
    .max(100, 'Agent ID 过长')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Agent ID 格式无效'),

  endpoint: z.string()
    .url('Endpoint 格式无效')
    .refine(url => {
      // 只允许 HTTP/HTTPS
      return url.startsWith('http://') || url.startsWith('https://')
    }, '只允许 HTTP/HTTPS 协议'),

  metadata: z.record(z.any())
    .optional()
    .refine(meta => {
      // 限制元数据大小
      return JSON.stringify(meta).length <= 1024
    }, '元数据过大')
})

// 配对请求验证
const pairSchema = z.object({
  pairing_code: z.string()
    .length(6, '配对码必须是 6 位')
    .regex(/^\d{6}$/, '配对码格式无效'),

  device_id: z.string()
    .min(1)
    .max(100),

  metadata: z.record(z.any()).optional()
})
```

### 防注入

**NoSQL 注入防护**:

```typescript
// ❌ 危险: 直接使用用户输入
const agent = await redis.get(`agent:${userInput}`)

// ✅ 安全: 验证和清理
const sanitizedId = validateAndSanitize(userInput)
const agent = await redis.get(`agent:${sanitizedId}`)
```

**命令注入防护**:

```typescript
// ❌ 危险: 拼接命令
exec(`redis-cli GET ${userInput}`)

// ✅ 安全: 使用库函数
await redis.get(userInput)
```

### XSS 防护

**内容安全策略 (CSP)**:

```typescript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self' https://gateway.example.com"
  ].join('; '))
  next()
})
```

**输入清理**:

```typescript
import sanitizeHtml from 'sanitize-html'

function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  })
}
```

## 速率限制

### 多层限流

**Nginx 层**:

```nginx
# 限制配对请求
limit_req_zone $binary_remote_addr zone=pairing:10m rate=10r/m;

location /api/pair {
    limit_req zone=pairing burst=20 nodelay;
    limit_req_status 429;
}
```

**应用层**:

```typescript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'

// 配对接口限流
const pairingLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:pairing:'
  }),
  windowMs: 60 * 1000, // 1 分钟
  max: 20, // 最多 20 次
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: '配对请求过于频繁,请稍后再试'
    })
  }
})

app.post('/api/pair', pairingLimiter, pairHandler)
```

**分布式限流**:

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible'

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100, // 100 次请求
  duration: 60, // 每 60 秒
})

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch {
    res.status(429).json({ error: 'Too many requests' })
  }
})
```

## 认证和授权

### 当前方案 (MVP)

**配对码认证**:

- 无需传统认证
- 配对码即令牌
- 一次性使用,自动失效

### 未来方案 (企业版)

**JWT 认证**:

```typescript
import jwt from 'jsonwebtoken'

// 生成 Token
const token = jwt.sign(
  { agentId: 'agent-abc123' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
)

// 验证 Token
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.agentId = decoded.agentId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})
```

## 数据安全

### Redis 安全

**访问控制**:

```bash
# redis.conf
requirepass <strong-password>
bind 127.0.0.1
protected-mode yes
```

**TLS 加密**:

```bash
# redis.conf
tls-port 6379
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
tls-ca-cert-file /path/to/ca.crt
```

**连接字符串**:

```env
REDIS_URL=rediss://:password@localhost:6379
```

### 敏感数据处理

**不持久化敏感数据**:

```typescript
// ❌ 不安全: 持久化敏感数据
await redis.set('user:token', sensitiveToken)

// ✅ 安全: 使用 TTL 自动过期
await redis.setex('user:token', 3600, sensitiveToken)
```

**日志脱敏**:

```typescript
function sanitizeLog(data: any): any {
  const sanitized = { ...data }

  // 脱敏敏感字段
  const sensitiveFields = ['password', 'token', 'secret', 'pairing_code']

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***'
    }
  }

  return sanitized
}

logger.info('User action', sanitizeLog(userData))
```

## 网络安全

### 防火墙配置

**UFW 规则**:

```bash
# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 限制 Redis 访问(仅本地)
sudo ufw deny 6379/tcp

# 启用防火墙
sudo ufw enable
```

**安全组 (云平台)**:

```json
{
  "Rules": [
    {
      "Port": 443,
      "Protocol": "HTTPS",
      "Source": "0.0.0.0/0"
    },
    {
      "Port": 6379,
      "Protocol": "TCP",
      "Source": "10.0.0.0/8"  // 仅内网
    }
  ]
}
```

### 网络隔离

**VPC 设计**:

```
┌─────────────────────────────────────────┐
│              VPC (10.0.0.0/16)          │
├─────────────────────────────────────────┤
│                                          │
│  公网子网 (10.0.1.0/24)                 │
│  ├─ Load Balancer                       │
│  └─ Gateway                             │
│                                          │
│  私有子网 (10.0.2.0/24)                 │
│  ├─ Redis                               │
│  └─ Agents                              │
│                                          │
└─────────────────────────────────────────┘
```

## 容器安全

### Docker 安全配置

**Dockerfile**:

```dockerfile
# 使用非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 只读文件系统
VOLUME ["/app/data"]
```

**Docker Compose**:

```yaml
services:
  gateway:
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
```

## 供应链安全

### 依赖审计

**自动化检查**:

```yaml
# .github/workflows/audit.yml
name: Security Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm audit --audit-level=moderate
      - run: pnpm audit --json | snyk
```

**Dependabot**:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
```

### 代码签名

**GPG 签名**:

```bash
# 配置 Git 签名
git config --global commit.gpgsign true
git config --global gpg.program gpg

# 签名提交
git commit -S -m "Secure commit"
```

## 监控和审计

### 审计日志

```typescript
interface AuditLog {
  timestamp: Date
  action: string
  userId?: string
  ip: string
  userAgent: string
  resource: string
  status: 'success' | 'failure'
  details: Record<string, any>
}

function logAudit(event: AuditLog) {
  logger.info('AUDIT', event)
}

// 使用
logAudit({
  timestamp: new Date(),
  action: 'PAIRING_SUCCESS',
  ip: req.ip,
  resource: 'agent:abc123',
  status: 'success',
  details: { deviceId: 'mobile-123' }
})
```

### 入侵检测

**异常检测规则**:

```typescript
// 检测暴力破解
async function detectBruteForce(ip: string): Promise<boolean> {
  const key = `bf:${ip}`
  const attempts = await redis.incr(key)

  if (attempts === 1) {
    await redis.expire(key, 300) // 5 分钟窗口
  }

  if (attempts > 50) {
    logger.warn('Brute force detected', { ip, attempts })
    return true
  }

  return false
}
```

## 安全检查清单

### 部署前检查

- [ ] 启用 HTTPS
- [ ] 配置 HSTS
- [ ] Redis 启用认证
- [ ] 配置防火墙规则
- [ ] 设置速率限制
- [ ] 审计日志启用
- [ ] 依赖漏洞扫描
- [ ] 敏感数据加密
- [ ] 错误信息脱敏
- [ ] 定期备份配置

### 定期审计

- [ ] 每周依赖审计
- [ ] 每月安全扫描
- [ ] 每季度渗透测试
- [ ] 年度安全培训

## 相关文档

- [架构设计](/technical/architecture) - 系统架构说明
- [技术选型](/technical/stack) - 技术选型理由
- [最佳实践](/guide/best-practices) - 生产环境最佳实践
