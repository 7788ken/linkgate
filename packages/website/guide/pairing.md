# 配对流程

LinkGate 使用临时配对码机制实现安全的设备配对。本文档详细介绍配对流程和最佳实践。

## 配对流程概览

```
┌─────────┐                  ┌──────────┐                  ┌─────────────┐
│  Agent  │                  │ Gateway  │                  │ Mobile App  │
└────┬────┘                  └────┬─────┘                  └──────┬──────┘
     │                            │                               │
     │ 1. 注册请求                 │                               │
     ├───────────────────────────►│                               │
     │                            │                               │
     │ 2. 返回配对码 (847291)      │                               │
     │◄───────────────────────────┤                               │
     │                            │                               │
     │                            │  3. 配对请求 (配对码: 847291)  │
     │                            │◄──────────────────────────────┤
     │                            │                               │
     │                            │ 4. 验证配对码                  │
     │                            │   查找对应 Agent              │
     │                            │                               │
     │                            │ 5. 返回 Agent 信息            │
     │                            ├──────────────────────────────►│
     │                            │                               │
     │ 6. 可选: WebSocket 通知     │                               │
     │◄───────────────────────────┤                               │
     │                            │                               │
     │ 7. 直接通信 (P2P)           │                               │
     │◄──────────────────────────────────────────────────────────►│
     │                            │                               │
```

## 详细步骤

### 1. Agent 注册

Agent 向 Gateway 注册,获取临时配对码。

**请求**:

```bash
POST /api/agent/register
Content-Type: application/json

{
  "agent_id": "agent-abc123",
  "endpoint": "http://192.168.1.100:8080",
  "metadata": {
    "name": "Development Server"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "pairing_code": "847291",
    "expires_at": "2026-03-09T00:05:00.000Z",
    "ttl": 300
  }
}
```

**特点**:
- 配对码为 6 位数字
- 默认有效期 5 分钟
- 一次性使用(配对后失效)

### 2. 展示配对码

将配对码展示给用户,用户在移动设备上输入。

**终端显示**:

```
✓ Agent 注册成功

配对码: 847291
有效期: 5 分钟

请在移动设备上输入此配对码完成配对
```

**二维码**:

```bash
# 生成二维码(可选)
cd packages/agent
pnpm run dev register -g http://localhost:3000 -p 8080 --qr
```

### 3. 移动设备配对

用户在移动设备上输入配对码,发起配对请求。

**请求**:

```bash
POST /api/pair
Content-Type: application/json

{
  "pairing_code": "847291",
  "device_id": "mobile-123",
  "metadata": {
    "platform": "iOS",
    "model": "iPhone 15"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "agent_id": "agent-abc123",
    "endpoint": "http://192.168.1.100:8080",
    "metadata": {
      "name": "Development Server"
    },
    "paired_at": "2026-03-09T00:00:00.000Z"
  }
}
```

### 4. 配对完成

移动设备获得 Agent 的连接信息,可以直接与 Agent 通信。

**移动设备发起连接**:

```typescript
// 使用返回的 endpoint 连接 Agent
const response = await fetch('http://192.168.1.100:8080/api/data', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello from mobile!' })
})
```

## 配对码特性

### 安全性

- **临时性**: 配对码默认 5 分钟过期
- **一次性**: 配对成功后立即失效
- **随机性**: 使用加密安全的随机数生成
- **长度**: 6 位数字,易输入且足够安全

### 配置

```bash
# .env 文件
PAIRING_CODE_TTL=300        # 有效期(秒)
PAIRING_CODE_LENGTH=6       # 位数
```

### 查询配对码状态

```bash
# 查询配对码信息(不执行配对)
curl http://localhost:3000/api/pair/847291
```

**响应**:

```json
{
  "success": true,
  "data": {
    "pairing_code": "847291",
    "agent_id": "agent-abc123",
    "expires_at": "2026-03-09T00:05:00.000Z",
    "remaining_seconds": 240,
    "is_valid": true
  }
}
```

## 实时通知

从 v0.2.0 开始,支持 WebSocket 实时通知。

### Agent 端

```typescript
import { Agent } from '@linkgate/agent'

const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080
})

// 注册
await agent.register()

// 监听配对成功事件
agent.on('paired', (data) => {
  console.log('配对成功!')
  console.log('设备 ID:', data.deviceId)
  console.log('设备信息:', data.metadata)
})

// 启动 WebSocket 连接
agent.connectWebSocket()
```

### 移动端

```javascript
// WebSocket 连接
const ws = new WebSocket('wss://gateway.example.com/ws')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)

  if (data.type === 'pairing_success') {
    console.log('配对成功:', data.payload)
    // 使用返回的 endpoint 连接 Agent
    connectToAgent(data.payload.endpoint)
  }
}
```

## 配对流程最佳实践

### 1. 错误处理

**移动端**:

```typescript
async function pairDevice(pairingCode: string) {
  try {
    const response = await fetch('https://gateway.example.com/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairing_code: pairingCode,
        device_id: getDeviceId()
      })
    })

    if (!response.ok) {
      const error = await response.json()

      switch (error.error.code) {
        case 'INVALID_PAIRING_CODE':
          alert('配对码无效或已过期,请重新获取')
          break
        case 'RATE_LIMIT_EXCEEDED':
          alert('请求过于频繁,请稍后再试')
          break
        default:
          alert('配对失败: ' + error.error.message)
      }
      return null
    }

    const result = await response.json()
    return result.data

  } catch (error) {
    console.error('配对请求失败:', error)
    alert('网络错误,请检查网络连接')
    return null
  }
}
```

### 2. 配对码输入优化

**移动端 UI**:

```tsx
function PairingInput() {
  const [code, setCode] = useState('')

  // 自动格式化: 847-291
  const formatCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    if (digits.length > 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    }
    return digits
  }

  return (
    <input
      type="text"
      value={code}
      onChange={(e) => setCode(formatCode(e.target.value))}
      placeholder="000-000"
      maxLength={7}
    />
  )
}
```

### 3. 二维码配对

**Agent 端生成二维码**:

```typescript
import QRCode from 'qrcode'

const agent = new Agent({ /* ... */ })
const result = await agent.register()

// 生成包含配对码的二维码
const qrData = JSON.stringify({
  type: 'linkgate-pairing',
  code: result.pairingCode,
  gateway: 'https://gateway.example.com'
})

const qrImage = await QRCode.toDataURL(qrData)
console.log('二维码:', qrImage)
```

**移动端扫描**:

```typescript
// 扫描二维码后解析
const qrData = JSON.parse(scannedText)

if (qrData.type === 'linkgate-pairing') {
  // 自动填充配对码
  await pairDevice(qrData.code)
}
```

### 4. 配对状态管理

**移动端**:

```typescript
// 存储配对信息
interface PairedAgent {
  agentId: string
  endpoint: string
  pairedAt: Date
  metadata: object
}

class DeviceManager {
  private pairedAgents: Map<string, PairedAgent> = new Map()

  async pair(pairingCode: string): Promise<PairedAgent> {
    const result = await pairDevice(pairingCode)

    const agent: PairedAgent = {
      agentId: result.agent_id,
      endpoint: result.endpoint,
      pairedAt: new Date(result.paired_at),
      metadata: result.metadata
    }

    this.pairedAgents.set(agent.agentId, agent)
    this.saveToStorage()

    return agent
  }

  private saveToStorage() {
    localStorage.setItem('paired_agents', JSON.stringify(
      Array.from(this.pairedAgents.entries())
    ))
  }
}
```

## 安全考虑

### 1. HTTPS

生产环境务必使用 HTTPS:

```typescript
const agent = new Agent({
  gateway: 'https://gateway.example.com',  // ✅ 使用 HTTPS
  port: 8080
})
```

### 2. 配对码时效

- 默认 5 分钟过期
- 根据场景调整(不要太长)

```bash
# .env
PAIRING_CODE_TTL=300  # 5 分钟
```

### 3. 速率限制

防止暴力破解:

```bash
# .env
RATE_LIMIT_PAIRING_MAX=20  # 每分钟最多 20 次配对尝试
```

### 4. 网络隔离

建议在内网或 VPN 环境使用:

```typescript
// Agent 只监听内网地址
const agent = new Agent({
  gateway: 'https://gateway.company.internal',
  port: 8080,
  host: '192.168.1.100'  // 内网 IP
})
```

## 常见问题

### 配对码过期怎么办?

重新注册 Agent 获取新的配对码:

```bash
cd packages/agent
pnpm run dev register -g https://gateway.example.com -p 8080
```

### 配对失败但配对码正确?

检查:
1. Agent 是否在线(发送心跳)
2. 网络连接是否正常
3. Gateway 日志是否有错误

### 如何取消配对?

配对码是一次性的,配对成功后自动失效。如需重新配对,重新注册即可。

## 下一步

- [API 文档](/guide/api) - 完整 API 参考
- [Agent 配置](/guide/agent) - Agent 详细配置
- [最佳实践](/guide/best-practices) - 生产环境最佳实践
