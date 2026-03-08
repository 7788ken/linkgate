# LinkGate - 公益设备配对网关

> 轻量级、一次性的设备配对信令服务

## 项目简介

LinkGate 是一个公益性质的设备配对网关系统,用于本地电脑/服务器 Agent 与移动终端 APP 的安全配对连接。

### 核心特性

- ✅ **临时性**: 配对完成后网关自动删除临时信息
- ✅ **公益性质**: 免费开放,低资源消耗
- ✅ **自动重连**: Agent 断线后自动重新注册
- ✅ **简单易用**: 零配置,一条命令即可启动
- ✅ **隐私优先**: 不持久化敏感数据,配对即焚

## 工作流程

```
┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│  Local      │───────▶│   Gateway    │◀───────│   Mobile    │
│  Agent      │        │   Server     │        │   APP       │
└─────────────┘        └──────────────┘        └─────────────┘
     │                        │                        │
     │ 1. Register            │                        │
     │   {agent_id,           │                        │
     │    public_ip,          │                        │
     │    port,               │                        │
     │    timestamp}          │                        │
     ├───────────────────────▶│                        │
     │                        │                        │
     │                        │ 2. Verify              │
     │                        │   {pairing_code,       │
     │                        │    agent_id}           │
     │                        │◀───────────────────────┤
     │                        │                        │
     │                        │ 3. Return              │
     │                        │   agent_info           │
     │                        ├───────────────────────▶│
     │                        │                        │
     │ 4. Direct Connection (P2P or via relay)         │
     │◀───────────────────────────────────────────────▶│
     │                        │                        │
     │                        │ 5. Cleanup             │
     │                        │   (delete temp data)   │
     │                        ├───────────────────────▶│
```

### 详细步骤

1. **Agent 注册**: 本地 Agent 向网关注册握手信息,获取配对码
2. **终端验证**: 移动端 APP 提交配对码进行验证
3. **信息交换**: 网关验证成功后返回 Agent 连接信息
4. **建立连接**: 终端与 Agent 建立直接 P2P 连接或中继连接
5. **清理数据**: 网关删除临时配对信息

## 类似项目对比

### 1. P2P 网络穿透类
- **Tailscale + Headscale**: WireGuard 基于的 P2P VPN,支持 NAT 穿透
- **ZeroTier**: 去中心化 Layer 2 网络
- **FRP (Fast Reverse Proxy)**: 开源反向代理,支持 TCP/UDP 端口转发

### 2. WebRTC 信令服务器
- **Simple WebRTC Signaling Server**: Node.js + Socket.IO 实现
- **STUN/TURN 服务器**: 用于 NAT 穿透和媒体中继

### 3. 设备配对认证类
- **OpenClaw**: 使用 QR 码进行设备配对的 AI 网关项目
- 支持本地设备配对和自动批准

### 4. Cloudflare Tunnel 替代品
- **Octelium**: 完整的自托管远程访问方案
- **Pangolin**: 基于 WireGuard + Traefik 的访问平台

## LinkGate 的差异化优势

| 特性 | LinkGate | Tailscale | FRP | OpenClaw |
|------|----------|-----------|-----|----------|
| 配对后数据清理 | ✅ | ❌ | ❌ | ❌ |
| 零配置启动 | ✅ | ✅ | ❌ | ❌ |
| 公益免费 | ✅ | 商业 | 开源 | 开源 |
| 一次性配对码 | ✅ | ❌ | ❌ | ✅ |
| QR 码支持 | ✅ | ❌ | ❌ | ✅ |
| 自动重连 | ✅ | ✅ | ❌ | ✅ |
| 轻量级 | ✅ | ❌ | ✅ | ❌ |

## 核心模块设计

### 1. Agent 注册模块

```typescript
interface AgentRegistration {
  agent_id: string;        // UUID v4
  public_ip?: string;      // 自动检测或 STUN 获取
  local_ip?: string;       // 局域网 IP (可选)
  port: number;
  pairing_code: string;    // 6 位数字或短码
  capabilities: string[];  // 支持的功能
  timestamp: number;
  ttl: number;             // 过期时间 (如 5 分钟)
}
```

### 2. 终端验证模块

```typescript
interface PairingRequest {
  pairing_code: string;    // 用户输入
  device_id: string;       // 设备标识
  device_name?: string;
}

interface PairingResponse {
  success: boolean;
  agent_info?: {
    public_ip?: string;
    local_ip?: string;
    port: number;
    capabilities: string[];
  };
  relay_server?: string;   // 如果需要中继
}
```

### 3. 心跳与重连机制

```typescript
// Agent 端
setInterval(async () => {
  await gateway.heartbeat(agent_id);
}, 30000); // 每 30 秒

// Gateway 端
if (Date.now() - last_heartbeat > 60000) {
  deleteRegistration(agent_id); // 标记为离线
}
```

## 技术选型

### 方案 A: 轻量级 (推荐起步)

**技术栈**:
- **后端**: Node.js + Express/Fastify
- **通信**: WebSocket (Socket.IO)
- **数据库**: Redis (临时存储, TTL 自动过期)
- **部署**: Docker + Nginx

**优点**:
- 开发快速
- 资源占用低
- 适合公益性质 (低成本服务器即可)

**适用场景**: MVP 快速验证, 小规模用户

---

### 方案 B: 企业级

**技术栈**:
- **后端**: Go (Gin) 或 Rust (Actix-web)
- **通信**: gRPC + WebSocket
- **数据库**: PostgreSQL + Redis
- **消息队列**: NATS (可选)

**优点**:
- 高性能
- 类型安全
- 更好的并发处理

**适用场景**: 大规模生产环境, 高并发场景

---

### 方案 C: P2P 优先

**技术栈**:
- **基于 WebRTC**: 复用现有 STUN/TURN 服务器
- **信令**: 自定义轻量级协议
- **NAT 穿透**: 使用公共 STUN 服务器

**优点**:
- 真正的 P2P 连接
- 减少服务器负载
- 低延迟

**适用场景**: 实时通信应用, 对延迟敏感

## 实施计划

### 阶段 1: MVP (2-3 周)

- [ ] 基础 HTTP API (注册/验证/查询)
- [ ] Redis 临时存储
- [ ] 简单的配对码生成
- [ ] Agent CLI 工具
- [ ] 基础文档

**交付物**: 可运行的最小可用版本

---

### 阶段 2: 增强功能 (2-4 周)

- [ ] WebSocket 实时通信
- [ ] 心跳机制
- [ ] Web 管理界面
- [ ] 配对码 QR 码支持
- [ ] 多种配对方式 (码/Q 码/NFC)

**交付物**: 功能完善的 Beta 版本

---

### 阶段 3: P2P 优化 (1-2 个月)

- [ ] NAT 穿透检测
- [ ] STUN/TURN 集成
- [ ] 中继服务器 (可选)
- [ ] 加密通信 (E2EE)

**交付物**: 支持直连的生产版本

---

### 阶段 4: 运营与优化

- [ ] 监控与日志
- [ ] 负载均衡
- [ ] 安全审计
- [ ] 社区文档

**交付物**: 可持续运营的公共服务

## 创新点

1. **一次性配对码**: 5 分钟有效期,使用后立即失效
2. **QR 码便捷性**: 扫码即配对,无需手动输入
3. **智能重连**: Agent 网络变化时自动更新注册信息
4. **零配置**: Agent 无需配置文件,一条命令即可启动
5. **隐私优先**: 配对成功后网关立即删除数据

## 安全考虑

### 1. 防滥用机制

- IP 限流: 单 IP 每分钟最多 10 次请求
- 配对码尝试次数限制: 每个码最多 5 次错误尝试
- Agent 注册频率限制: 单 Agent 每分钟最多 3 次注册

### 2. 数据加密

- 传输层: 强制 HTTPS (TLS 1.3+)
- 可选端到端加密 (E2EE): 使用 X25519 密钥交换

### 3. 身份验证

- Agent 使用 Ed25519 签名验证,防止伪造
- 配对码使用加密安全的随机数生成器 (CSPRNG)

### 4. 审计日志

- 记录配对行为 (时间、IP、设备类型)
- **不存储**敏感信息 (真实 IP、设备 ID 等)

## 快速开始

### Gateway 服务器部署

```bash
# 使用 Docker 部署
docker run -d \
  -p 3000:3000 \
  -e REDIS_URL=redis://localhost:6379 \
  -e JWT_SECRET=your-secret \
  linkgate/gateway:latest
```

### Agent 客户端使用

```bash
# 一键注册
curl -X POST https://gateway.example.com/register \
  -H "Content-Type: application/json" \
  -d '{"port": 8080, "name": "MyHomePC"}'

# 返回配对码: 847291
```

### 移动端 APP 集成

```typescript
// 用户输入配对码
const result = await gateway.pair('847291');

// 获取 agent 信息并建立连接
await connectToAgent(result.agent_info);
```

## 参考资源

- [Simple WebRTC Signaling Server](https://github.com/aljanabim/simple_webrtc_signaling_server)
- [WebRTC Signaling Server Guide - Ant Media](https://antmedia.io/webrtc-signaling-servers-everything-you-need-to-know/)
- [NAT Traversal with STUN/TURN - Cisco](https://community.cisco.com/t5/collaboration-knowledge-base/demystifying-nat-traversal-with-stun-turn-and-ice/ta-p/4766853)
- [Tailscale vs ngrok Comparison](https://tailscale.com/compare/ngrok)
- [FRP - Fast Reverse Proxy](https://libhunt.com/compare-frp-vs-tailscale)
- [OpenClaw Device Pairing](https://docs.openclaw.ai)
- [Octelium - Cloudflare Tunnel Alternative](https://octelium.com)
- [Pangolin - Self-hosted Access Platform](https://github.com/fosrl/pangolin)
- [Awesome Tunneling - GitHub](https://github.com/anderspitman/awesome-tunneling)

## 许可证

待定 (建议使用 MIT 或 Apache 2.0)

## 贡献指南

欢迎社区贡献!请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 联系方式

- 项目主页: https://github.com/linkgate/linkgate
- 问题反馈: https://github.com/linkgate/linkgate/issues
