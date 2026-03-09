# Gateway API 文档

LinkGate Gateway 提供 RESTful API 用于 Agent 注册、配对和心跳管理。

## 基础信息

- **Base URL**: `http://localhost:3000` (开发环境)
- **Content-Type**: `application/json`
- **认证方式**: 无需认证(配对码机制)

## 端点概览

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/agent/register` | 注册 Agent |
| POST | `/api/agent/heartbeat` | Agent 心跳 |
| GET | `/api/agent/:id` | 获取 Agent 信息 |
| DELETE | `/api/agent/:id` | 注销 Agent |
| POST | `/api/pair` | 配对请求 |
| GET | `/api/pair/:code` | 查询配对码 |

## 健康检查

### GET /health

检查 Gateway 服务状态。

**请求示例**:

```bash
curl http://localhost:3000/health
```

**响应示例**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "0.2.0"
}
```

**状态码**:

- `200`: 服务正常

---

## Agent 注册

### POST /api/agent/register

注册新的 Agent 并获取配对码。

**请求体**:

```typescript
{
  agent_id: string      // Agent 唯一标识
  endpoint: string      // Agent 服务地址 (如: http://192.168.1.100:8080)
  metadata?: object     // 可选的元数据
}
```

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent-abc123",
    "endpoint": "http://192.168.1.100:8080",
    "metadata": {
      "name": "My Development Server",
      "version": "1.0.0"
    }
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "pairing_code": "847291",
    "expires_at": "2024-01-01T00:05:00.000Z",
    "ttl": 300
  }
}
```

**状态码**:

- `201`: 注册成功
- `400`: 请求参数错误
- `409`: Agent ID 已存在

---

## Agent 心跳

### POST /api/agent/heartbeat

发送心跳保持 Agent 在线状态。

**请求体**:

```typescript
{
  agent_id: string      // Agent ID
  status?: object       // 可选的状态信息
}
```

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/agent/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent-abc123",
    "status": {
      "connections": 5,
      "cpu": "45%",
      "memory": "512MB"
    }
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "next_heartbeat": 60,
    "message": "Heartbeat received"
  }
}
```

**状态码**:

- `200`: 心跳成功
- `404`: Agent 不存在

---

## 获取 Agent 信息

### GET /api/agent/:id

获取指定 Agent 的详细信息。

**请求示例**:

```bash
curl http://localhost:3000/api/agent/agent-abc123
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "agent_id": "agent-abc123",
    "endpoint": "http://192.168.1.100:8080",
    "status": "online",
    "last_heartbeat": "2024-01-01T00:00:00.000Z",
    "registered_at": "2024-01-01T00:00:00.000Z",
    "metadata": {
      "name": "My Development Server",
      "version": "1.0.0"
    }
  }
}
```

**状态码**:

- `200`: 成功
- `404`: Agent 不存在

---

## 注销 Agent

### DELETE /api/agent/:id

注销 Agent 并清理相关数据。

**请求示例**:

```bash
curl -X DELETE http://localhost:3000/api/agent/agent-abc123
```

**响应示例**:

```json
{
  "success": true,
  "message": "Agent unregistered successfully"
}
```

**状态码**:

- `200`: 注销成功
- `404`: Agent 不存在

---

## 配对请求

### POST /api/pair

使用配对码完成设备配对。

**请求体**:

```typescript
{
  pairing_code: string  // 6位数字配对码
  device_id: string     // 移动设备唯一标识
  metadata?: object     // 可选的设备信息
}
```

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/pair \
  -H "Content-Type: application/json" \
  -d '{
    "pairing_code": "847291",
    "device_id": "mobile-123",
    "metadata": {
      "platform": "iOS",
      "model": "iPhone 15",
      "app_version": "1.0.0"
    }
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "agent_id": "agent-abc123",
    "endpoint": "http://192.168.1.100:8080",
    "paired_at": "2024-01-01T00:00:00.000Z",
    "message": "配对成功"
  }
}
```

**状态码**:

- `200`: 配对成功
- `400`: 配对码无效或已过期
- `404`: 配对码不存在

---

## 查询配对码

### GET /api/pair/:code

查询配对码信息(不执行配对)。

**请求示例**:

```bash
curl http://localhost:3000/api/pair/847291
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "pairing_code": "847291",
    "agent_id": "agent-abc123",
    "expires_at": "2024-01-01T00:05:00.000Z",
    "remaining_seconds": 240,
    "is_valid": true
  }
}
```

**状态码**:

- `200`: 查询成功
- `404`: 配对码不存在或已过期

---

## 错误响应

所有错误响应遵循统一格式:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAIRING_CODE",
    "message": "配对码无效或已过期",
    "details": {}
  }
}
```

### 错误码

| 错误码 | 描述 |
|--------|------|
| `INVALID_PAIRING_CODE` | 配对码无效或已过期 |
| `AGENT_NOT_FOUND` | Agent 不存在 |
| `AGENT_ALREADY_EXISTS` | Agent ID 已存在 |
| `HEARTBEAT_TIMEOUT` | 心跳超时 |
| `INVALID_REQUEST` | 请求参数错误 |
| `RATE_LIMIT_EXCEEDED` | 超过速率限制 |

---

## 速率限制

API 实施以下速率限制:

- **注册**: 10 次/分钟
- **配对**: 20 次/分钟
- **心跳**: 60 次/分钟
- **其他**: 100 次/分钟

超过限制将返回 `429 Too Many Requests`。

---

## SDK 集成

### TypeScript/JavaScript

```typescript
import { GatewayClient } from '@linkgate/sdk'

const client = new GatewayClient({
  baseUrl: 'https://gateway.example.com'
})

// 注册 Agent
const result = await client.register({
  agentId: 'agent-abc123',
  endpoint: 'http://192.168.1.100:8080'
})

console.log('配对码:', result.pairingCode)
```

### Python

```python
from linkgate import GatewayClient

client = GatewayClient('https://gateway.example.com')

# 注册 Agent
result = client.register(
    agent_id='agent-abc123',
    endpoint='http://192.168.1.100:8080'
)

print(f'配对码: {result.pairing_code}')
```

---

## WebSocket 支持

Gateway 支持 WebSocket 实时通信(从 v0.2.0 开始)。

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3000/ws')

ws.onopen = () => {
  console.log('WebSocket 连接成功')
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('收到消息:', data)
}
```

### 消息格式

```typescript
{
  type: 'pairing_success' | 'agent_offline' | 'heartbeat_required',
  payload: any,
  timestamp: string
}
```

---

## 最佳实践

1. **错误处理**: 始终处理 API 错误响应
2. **重试机制**: 对临时性错误实施指数退避重试
3. **心跳频率**: 建议 60 秒发送一次心跳
4. **配对码安全**: 配对码为一次性使用,不要重复使用
5. **HTTPS**: 生产环境务必使用 HTTPS

## 下一步

- [Agent 配置](/guide/agent) - Agent 详细配置
- [配对流程](/guide/pairing) - 配对流程说明
- [部署指南](/guide/deployment) - 生产环境部署
