# 技术选型

本文档详细说明 LinkGate 的技术选型理由。

## 核心技术栈

### 运行时: Node.js 18+

**选择理由**:

1. **成熟的异步 I/O**: 天然适合 I/O 密集型应用
2. **丰富的生态**: npm 生态系统,快速开发
3. **跨平台**: 支持 Linux、macOS、Windows
4. **LTS 支持**: 长期维护,安全更新

**为什么不是其他选项?**

- **Go**: 学习曲线陡峭,生态不如 Node.js 成熟
- **Rust**: 开发效率较低,不适合快速迭代
- **Python**: 性能不如 Node.js,并发模型不够优雅

**版本选择**:

- Node.js 18 LTS (支持到 2025 年 4 月)
- V8 引擎优化,性能提升 20%

### 语言: TypeScript 5+

**选择理由**:

1. **类型安全**: 编译时类型检查,减少运行时错误
2. **IDE 支持**: VSCode 原生支持,智能提示
3. **重构友好**: 大型项目重构更容易
4. **文档即代码**: 类型定义即文档

**类型覆盖率**:

```bash
# 当前类型覆盖率: 95%+
npm run type-coverage
```

### Web 框架: Fastify 4+

**对比分析**:

| 框架 | 性能 (req/sec) | TypeScript | 插件生态 | 学习曲线 |
|------|---------------|------------|----------|---------|
| Fastify | 76,835 | ✅ 原生 | 丰富 | 低 |
| Express | 38,289 | ⚠️ 需要 @types | 非常丰富 | 很低 |
| Koa | 50,433 | ⚠️ 需要 @types | 中等 | 中 |
| NestJS | 35,112 | ✅ 原生 | 丰富 | 高 |

**选择 Fastify 的原因**:

1. **性能**: 比 Express 快 2 倍
2. **Schema 验证**: 内置 JSON Schema 验证
3. **插件系统**: 模块化设计
4. **TypeScript**: 原生支持,无需额外配置

**Fastify 插件使用**:

```typescript
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyCompress from '@fastify/compress'

app
  .register(fastifyCors)
  .register(fastifyRateLimit, { max: 100, timeWindow: '1 minute' })
  .register(fastifyCompress)
```

### 数据库: Redis 7+

**选择理由**:

1. **内存存储**: 配对码需要快速访问 (< 1ms)
2. **TTL 支持**: 原生支持过期时间
3. **数据结构**: String, Hash, Set 等
4. **原子操作**: 配对码验证的原子性
5. **持久化**: RDB + AOF 双重保障

**为什么不用其他数据库?**

| 数据库 | 优点 | 缺点 | 适用性 |
|--------|------|------|--------|
| **PostgreSQL** | 关系型,ACID | TTL 不友好,性能较低 | ❌ 不适合 |
| **MongoDB** | 文档型,灵活 | TTL 索引性能不如 Redis | ⚠️ 可用但非最优 |
| **Memcached** | 高性能 | 不支持持久化,数据结构简单 | ❌ 不适合 |
| **Etcd** | 分布式一致性 | 性能较低,复杂度高 | ❌ 不适合 |

**Redis 配置**:

```bash
# redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

### 包管理: pnpm

**对比 npm/yarn**:

| 特性 | npm | yarn | pnpm |
|------|-----|------|------|
| 安装速度 | 慢 | 快 | 最快 |
| 磁盘空间 | 多 | 多 | 少 (硬链接) |
| 幽灵依赖 | ❌ 有 | ❌ 有 | ✅ 无 |
| Monorepo | ⚠️ Workspaces | ⚠️ Workspaces | ✅ 原生支持 |

**选择 pnpm 的原因**:

1. **磁盘效率**: 硬链接,节省 70% 空间
2. **安装速度**: 比 npm 快 2-3 倍
3. **严格依赖**: 避免幽灵依赖问题
4. **Monorepo**: 原生支持 workspace

**Workspace 配置**:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

## 开发工具

### 测试框架: Jest + Supertest

**选择理由**:

1. **零配置**: 开箱即用
2. **快照测试**: API 响应快照
3. **覆盖率**: 内置覆盖率报告
4. **生态**: 丰富的断言库

**测试结构**:

```
packages/gateway/
├── src/
│   └── routes/
│       └── agent.test.ts
└── __tests__/
    ├── integration/
    └── e2e/
```

**测试命令**:

```bash
# 单元测试
pnpm test

# 覆盖率
pnpm test --coverage

# 监听模式
pnpm test --watch
```

### 代码规范: ESLint + Prettier

**ESLint 配置**:

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error'
  }
}
```

**Prettier 配置**:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none"
}
```

### 构建工具: tsx / tsup

**开发环境**:

```bash
# tsx - TypeScript 执行器
tsx watch src/index.ts
```

**生产构建**:

```bash
# tsup - 零配置打包器
tsup src/index.ts --format cjs,esm --dts
```

## 部署工具

### 容器化: Docker

**多阶段构建**:

```dockerfile
# Builder
FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install && pnpm build

# Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 进程管理: PM2

**集群模式**:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'linkgate-gateway',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster'
  }]
}
```

## 监控工具

### 日志: Winston

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

### 指标: Prometheus

```typescript
import client from 'prom-client'

const register = new client.Registry()

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
})
```

### 追踪: OpenTelemetry

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'

const provider = new NodeTracerProvider()
provider.register()
```

## 辅助库

### 验证: Zod

```typescript
import { z } from 'zod'

const registerSchema = z.object({
  agent_id: z.string().min(1).max(100),
  endpoint: z.string().url(),
  metadata: z.record(z.any()).optional()
})

type RegisterRequest = z.infer<typeof registerSchema>
```

### HTTP 客户端: Axios

```typescript
import axios from 'axios'

const client = axios.create({
  baseURL: process.env.GATEWAY_URL,
  timeout: 30000
})
```

### UUID: nanoid

```typescript
import { nanoid } from 'nanoid'

const agentId = `agent-${nanoid(12)}`
```

## 云服务选型

### 托管 Redis

| 服务商 | 产品 | 价格 | 性能 |
|--------|------|------|------|
| **Railway** | Redis | $5/月 | 好 |
| **Upstash** | Redis | 按使用计费 | 好 |
| **Redis Cloud** | Redis | 有免费层 | 优秀 |
| **AWS** | ElastiCache | $15+/月 | 优秀 |

**推荐**: Railway Redis (开发) / Redis Cloud (生产)

### 托管 Node.js

| 服务商 | 特点 | 价格 |
|--------|------|------|
| **Railway** | 简单易用,快速部署 | $5/月起 |
| **Fly.io** | 边缘部署,低延迟 | $3/月起 |
| **Vercel** | Serverless,自动扩缩 | 免费层可用 |
| **Render** | 免费 SSL,自动部署 | $7/月起 |

**推荐**: Railway (开发) / Fly.io (生产)

## 性能优化工具

### 负载测试: autocannon

```bash
# 安装
npm install -g autocannon

# 测试
autocannon -c 100 -d 30 http://localhost:3000/health
```

### 内存分析: clinic

```bash
# 安装
npm install -g clinic

# 分析
clinic doctor -- node dist/index.js
```

### 火焰图: 0x

```bash
# 安装
npm install -g 0x

# 生成火焰图
0x -o dist/index.js
```

## 安全工具

### 依赖审计: npm audit

```bash
# 检查漏洞
pnpm audit

# 自动修复
pnpm audit fix
```

### 密钥扫描: git-secrets

```bash
# 安装
brew install git-secrets

# 扫描
git secrets --scan
```

## 相关文档

- [架构设计](/technical/architecture) - 系统架构说明
- [安全设计](/technical/security) - 安全机制详解
- [部署指南](/guide/deployment) - 生产环境部署
