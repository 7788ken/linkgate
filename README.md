# LinkGate

> 轻量级、一次性的设备配对信令服务

**[English](./docs/en/README.md)** | **[中文](./docs/zh/README.md)**

## 项目简介

LinkGate 是一个公益性质的设备配对网关系统,用于本地电脑/服务器 Agent 与移动终端 APP 的安全配对连接。

### 核心特性

- ✅ **临时性**: 配对完成后网关自动删除临时信息
- ✅ **公益性质**: 免费开放,低资源消耗
- ✅ **自动重连**: Agent 断线后自动重新注册
- ✅ **简单易用**: 零配置,一条命令即可启动
- ✅ **隐私优先**: 不持久化敏感数据,配对即焚

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

## 文档

- [完整文档 (中文)](./docs/zh/README.md)
- [Full Documentation (English)](./docs/en/README.md)
- [技术架构](./docs/zh/ARCHITECTURE.md) (待创建)
- [API 文档](./docs/zh/API.md) (待创建)
- [部署指南](./docs/zh/DEPLOYMENT.md) (待创建)

## 项目状态

🚧 **规划阶段** - 目前处于架构设计和需求分析阶段

## 开发路线图

### 阶段 1: MVP (2-3 周)
- 基础 HTTP API
- Redis 临时存储
- Agent CLI 工具

### 阶段 2: 增强功能 (2-4 周)
- WebSocket 实时通信
- 心跳机制
- QR 码支持

### 阶段 3: P2P 优化 (1-2 个月)
- NAT 穿透
- STUN/TURN 集成
- E2EE 加密

详见 [完整实施计划](./docs/zh/README.md#实施计划)

## 技术栈

### 推荐方案 (轻量级)
- **后端**: Node.js + Express/Fastify
- **通信**: WebSocket (Socket.IO)
- **数据库**: Redis
- **部署**: Docker + Nginx

### 替代方案
- Go/Rust (高性能场景)
- WebRTC (P2P 优先场景)

## 贡献指南

欢迎社区贡献!

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

待定 (建议使用 MIT 或 Apache 2.0)

## 联系方式

- 项目主页: https://github.com/linkgate/linkgate
- 问题反馈: https://github.com/linkgate/linkgate/issues

## 致谢

本项目受以下开源项目启发:

- [Tailscale](https://tailscale.com)
- [FRP](https://github.com/fatedier/frp)
- [OpenClaw](https://docs.openclaw.ai)
- [Octelium](https://octelium.com)
