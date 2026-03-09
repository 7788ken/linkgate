# Agent 配置

Agent 是运行在本地电脑或服务器上的客户端程序,负责向 Gateway 注册并提供配对码。

## 配置方式

### 命令行参数

最简单的配置方式:

```bash
cd packages/agent

# 基础注册
pnpm run dev register -g https://gateway.example.com -p 8080

# 完整参数
pnpm run dev register \
  -g https://gateway.example.com \  # Gateway 地址
  -p 8080 \                          # 本地服务端口
  -n "My Server" \                   # Agent 名称
  --metadata '{"env":"production"}'  # 元数据(JSON 字符串)
```

### 环境变量

创建 `.env` 文件:

```env
# Gateway 配置
GATEWAY_URL=https://gateway.example.com
AGENT_PORT=8080

# Agent 配置
AGENT_NAME=My Development Server
AGENT_ID=agent-abc123

# 心跳配置
HEARTBEAT_INTERVAL=60
AUTO_RECONNECT=true

# 元数据(可选)
AGENT_METADATA={"env":"production","version":"1.0.0"}
```

使用环境变量:

```bash
pnpm run dev register
```

### 配置文件

创建 `agent.config.json`:

```json
{
  "gateway": {
    "url": "https://gateway.example.com",
    "timeout": 30000
  },
  "agent": {
    "id": "agent-abc123",
    "name": "My Development Server",
    "port": 8080,
    "metadata": {
      "env": "production",
      "version": "1.0.0",
      "location": "Beijing"
    }
  },
  "heartbeat": {
    "interval": 60,
    "autoReconnect": true,
    "maxRetries": 5
  },
  "security": {
    "verifySSL": true
  }
}
```

使用配置文件:

```bash
pnpm run dev register --config agent.config.json
```

## CLI 命令

### register - 注册 Agent

```bash
pnpm run dev register [options]

选项:
  -g, --gateway <url>     Gateway 服务器地址
  -p, --port <number>     本地服务端口
  -n, --name <string>     Agent 名称
  -i, --id <string>       Agent ID (可选,自动生成)
  --metadata <json>       元数据 (JSON 字符串)
  --config <path>         配置文件路径
  -h, --help              显示帮助信息
```

**示例**:

```bash
# 基础注册
pnpm run dev register -g http://localhost:3000 -p 8080

# 带名称和元数据
pnpm run dev register \
  -g https://gateway.example.com \
  -p 8080 \
  -n "Production Server" \
  --metadata '{"region":"us-west","version":"2.0.0"}'

# 使用配置文件
pnpm run dev register --config ./agent.config.json
```

### heartbeat - 发送心跳

```bash
pnpm run dev heartbeat [options]

选项:
  -i, --id <string>       Agent ID
  -g, --gateway <url>     Gateway 服务器地址
  -h, --help              显示帮助信息
```

**示例**:

```bash
pnpm run dev heartbeat -i agent-abc123 -g http://localhost:3000
```

### status - 查看状态

```bash
pnpm run dev status [options]

选项:
  -i, --id <string>       Agent ID (可选,显示所有)
  -g, --gateway <url>     Gateway 服务器地址
  -h, --help              显示帮助信息
```

**示例**:

```bash
# 查看所有 Agent
pnpm run dev status

# 查看指定 Agent
pnpm run dev status -i agent-abc123
```

### unregister - 注销 Agent

```bash
pnpm run dev unregister [options]

选项:
  -i, --id <string>       Agent ID
  -g, --gateway <url>     Gateway 服务器地址
  -h, --help              显示帮助信息
```

**示例**:

```bash
pnpm run dev unregister -i agent-abc123 -g http://localhost:3000
```

## 编程式使用

### TypeScript

```typescript
import { Agent } from '@linkgate/agent'

// 创建 Agent 实例
const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080,
  name: 'My Development Server',
  metadata: {
    env: 'production',
    version: '1.0.0'
  }
})

// 注册并获取配对码
try {
  const result = await agent.register()
  console.log('配对码:', result.pairingCode)
  console.log('过期时间:', result.expiresAt)

  // 启动自动心跳
  agent.startHeartbeat()

  // 监听事件
  agent.on('paired', (data) => {
    console.log('配对成功:', data)
  })

  agent.on('disconnected', () => {
    console.log('连接断开,正在重连...')
  })

} catch (error) {
  console.error('注册失败:', error)
}

// 手动发送心跳
await agent.heartbeat()

// 注销
await agent.unregister()
```

### 事件监听

```typescript
// 配对成功
agent.on('paired', (data) => {
  console.log('设备已配对:', data.deviceId)
  console.log('设备端点:', data.endpoint)
})

// 心跳成功
agent.on('heartbeat:success', () => {
  console.log('心跳发送成功')
})

// 心跳失败
agent.on('heartbeat:failed', (error) => {
  console.error('心跳失败:', error)
})

// 连接断开
agent.on('disconnected', () => {
  console.log('与 Gateway 断开连接')
})

// 自动重连
agent.on('reconnecting', (attempt) => {
  console.log(`正在重连 (${attempt}/5)...`)
})

// 重连成功
agent.on('reconnected', () => {
  console.log('重连成功')
})

// 错误
agent.on('error', (error) => {
  console.error('Agent 错误:', error)
})
```

### Node.js 服务集成

将 Agent 集成到现有的 Node.js 服务:

```typescript
import express from 'express'
import { Agent } from '@linkgate/agent'

const app = express()
const port = 8080

// 创建 Agent
const agent = new Agent({
  gateway: process.env.GATEWAY_URL,
  port: port
})

// 你的服务路由
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Agent!' })
})

// 启动服务器
app.listen(port, async () => {
  console.log(`服务器运行在端口 ${port}`)

  // 注册 Agent
  try {
    const result = await agent.register()
    console.log('配对码:', result.pairingCode)
    agent.startHeartbeat()
  } catch (error) {
    console.error('注册失败:', error)
    process.exit(1)
  }
})

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('正在关闭...')
  await agent.unregister()
  process.exit(0)
})
```

## 高级配置

### 自动重连

```typescript
const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080,
  heartbeat: {
    interval: 60,        // 心跳间隔(秒)
    autoReconnect: true, // 自动重连
    maxRetries: 5,       // 最大重试次数
    retryDelay: 5000     // 重试延迟(毫秒)
  }
})
```

### 自定义元数据

```typescript
const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080,
  metadata: {
    // 基本信息
    name: 'Production Server',
    version: '1.0.0',
    env: 'production',

    // 位置信息
    location: {
      country: 'CN',
      city: 'Beijing',
      timezone: 'Asia/Shanghai'
    },

    // 性能指标
    specs: {
      cpu: '8 cores',
      memory: '16GB',
      storage: '500GB SSD'
    },

    // 自定义字段
    custom: {
      team: 'backend',
      project: 'api-gateway'
    }
  }
})
```

### 安全配置

```typescript
const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080,
  security: {
    verifySSL: true,           // 验证 SSL 证书
    caCert: '/path/to/ca.pem', // 自定义 CA 证书
    timeout: 30000             // 请求超时(毫秒)
  }
})
```

## 故障排除

### 注册失败

```bash
# 检查 Gateway 是否运行
curl http://localhost:3000/health

# 检查端口是否被占用
lsof -i :8080

# 查看详细日志
DEBUG=* pnpm run dev register -g http://localhost:3000 -p 8080
```

### 心跳失败

```bash
# 检查 Agent ID 是否正确
pnpm run dev status

# 手动发送心跳测试
pnpm run dev heartbeat -i agent-abc123 -g http://localhost:3000
```

### 连接超时

```typescript
// 增加超时时间
const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080,
  timeout: 60000  // 60秒
})
```

## 最佳实践

1. **使用环境变量**: 敏感信息(如 Gateway URL)使用环境变量
2. **优雅关闭**: 监听 SIGTERM 信号,注销 Agent
3. **错误处理**: 实现完善的错误处理和重试机制
4. **日志记录**: 记录关键事件和错误
5. **健康检查**: 定期检查 Agent 状态
6. **资源清理**: 及时注销不再使用的 Agent

## 下一步

- [配对流程](/guide/pairing) - 了解配对机制
- [API 文档](/guide/api) - Gateway API 参考
- [部署指南](/guide/deployment) - 生产环境部署
