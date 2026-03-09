# Tech Stack

This document explains the technical choices behind LinkGate.

## Core Tech Stack

### Runtime: Node.js 18+

**Why Node.js?**

1. **Mature Async I/O**: Naturally suited for I/O-intensive applications
2. **Rich Ecosystem**: npm ecosystem for rapid development
3. **Cross-Platform**: Support for Linux, macOS, Windows
4. **LTS Support**: Long-term maintenance and security updates

**Why not other options?**

- **Go**: Steeper learning curve, less mature ecosystem than Node.js
- **Rust**: Lower development efficiency, not suitable for rapid iteration
- **Python**: Lower performance than Node.js, less elegant concurrency model

**Version Choice:**

- Node.js 18 LTS (supported until April 2025)
- V8 engine optimizations, 20% performance improvement

### Language: TypeScript 5+

**Why TypeScript?**

1. **Type Safety**: Compile-time type checking reduces runtime errors
2. **IDE Support**: Native VSCode support with intelligent suggestions
3. **Refactoring Friendly**: Easier refactoring for large projects
4. **Documentation as Code**: Type definitions serve as documentation

**Type Coverage:**

```bash
# Current type coverage: 95%+
npm run type-coverage
```

### Web Framework: Fastify 4+

**Comparison:**

| Framework | Performance (req/sec) | TypeScript | Plugin Ecosystem | Learning Curve |
|-----------|----------------------|------------|------------------|----------------|
| Fastify   | 76,835               | ✅ Native  | Rich             | Low            |
| Express   | 38,289               | ⚠️ Requires @types | Very Rich  | Very Low       |
| Koa       | 50,433               | ⚠️ Requires @types | Medium     | Medium         |
| NestJS    | 35,112               | ✅ Native  | Rich             | High           |

**Why Fastify?**

1. **Performance**: 2x faster than Express
2. **Schema Validation**: Built-in JSON Schema validation
3. **Plugin System**: Modular design
4. **TypeScript**: Native support, no extra configuration needed

**Fastify Plugins Used:**

```typescript
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyCompress from '@fastify/compress'

app
  .register(fastifyCors)
  .register(fastifyRateLimit, { max: 100, timeWindow: '1 minute' })
  .register(fastifyCompress)
```

### Database: Redis 7+

**Why Redis?**

1. **In-Memory Storage**: Pairing codes require fast access (< 1ms)
2. **TTL Support**: Native expiration time support
3. **Data Structures**: String, Hash, Set, etc.
4. **Atomic Operations**: Atomic pairing code validation
5. **Persistence**: RDB + AOF dual guarantee

**Why not other databases?**

| Database    | Pros                 | Cons                          | Suitability |
|-------------|----------------------|-------------------------------|-------------|
| **PostgreSQL** | Relational, ACID   | TTL not friendly, lower performance | ❌ Not suitable |
| **MongoDB** | Document-based, flexible | TTL index performance worse than Redis | ⚠️ Usable but not optimal |
| **Memcached** | High performance    | No persistence, simple data structures | ❌ Not suitable |
| **Etcd** | Distributed consistency | Lower performance, higher complexity | ❌ Not suitable |

**Redis Configuration:**

```bash
# redis.conf
maxmemory 1gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

### Package Manager: pnpm

**Comparison with npm/yarn:**

| Feature          | npm  | yarn | pnpm           |
|-----------------|------|------|----------------|
| Install Speed   | Slow | Fast | Fastest        |
| Disk Space      | High | High | Low (hard links) |
| Phantom Deps    | ❌ Yes | ❌ Yes | ✅ None      |
| Monorepo        | ⚠️ Workspaces | ⚠️ Workspaces | ✅ Native support |

**Why pnpm?**

1. **Disk Efficiency**: Hard links, saves 70% space
2. **Install Speed**: 2-3x faster than npm
3. **Strict Dependencies**: Avoids phantom dependency issues
4. **Monorepo**: Native workspace support

**Workspace Configuration:**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

## Development Tools

### Testing Framework: Jest + Supertest

**Why Jest?**

1. **Zero Configuration**: Works out of the box
2. **Snapshot Testing**: API response snapshots
3. **Coverage**: Built-in coverage reports
4. **Ecosystem**: Rich assertion libraries

**Test Structure:**

```
packages/gateway/
├── src/
│   └── routes/
│       └── agent.test.ts
└── __tests__/
    ├── integration/
    └── e2e/
```

**Test Commands:**

```bash
# Unit tests
pnpm test

# Coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### Code Standards: ESLint + Prettier

**ESLint Configuration:**

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

**Prettier Configuration:**

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none"
}
```

### Build Tools: tsx / tsup

**Development:**

```bash
# tsx - TypeScript executor
tsx watch src/index.ts
```

**Production Build:**

```bash
# tsup - Zero-config bundler
tsup src/index.ts --format cjs,esm --dts
```

## Deployment Tools

### Containerization: Docker

**Multi-stage Build:**

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

### Process Manager: PM2

**Cluster Mode:**

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

## Monitoring Tools

### Logging: Winston

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

### Metrics: Prometheus

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

## Helper Libraries

### Validation: Zod

```typescript
import { z } from 'zod'

const registerSchema = z.object({
  agent_id: z.string().min(1).max(100),
  endpoint: z.string().url(),
  metadata: z.record(z.any()).optional()
})

type RegisterRequest = z.infer<typeof registerSchema>
```

### HTTP Client: Axios

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

## Related Documentation

- [Architecture](/technical/architecture) - System architecture explanation
- [Security](/technical/security) - Security mechanism details
- [Deployment Guide](/guide/deployment) - Production environment deployment
