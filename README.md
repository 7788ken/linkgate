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

👉 **[5 分钟快速启动指南](./QUICKSTART.md)**

### 1. 安装依赖

```bash
# 安装 pnpm (如果还没安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 2. 启动服务

```bash
# 启动 Redis
docker-compose up -d redis

# 启动 Gateway (新终端)
cd packages/gateway && pnpm run dev

# 注册 Agent (新终端)
cd packages/agent && pnpm run dev register -g http://localhost:3000 -p 8080
```

### 3. 配对连接

获取配对码后,使用 API 或 SDK 进行配对:

```bash
curl -X POST http://localhost:3000/api/pair \
  -H "Content-Type: application/json" \
  -d '{"pairing_code":"847291","device_id":"mobile-123"}'
```

## 文档

- [完整文档 (中文)](./docs/zh/README.md)
- [Full Documentation (English)](./docs/en/README.md)
- [技术架构](./docs/zh/ARCHITECTURE.md) (待创建)
- [API 文档](./docs/zh/API.md) (待创建)
- [部署指南](./docs/zh/DEPLOYMENT.md) (待创建)

## 项目状态

✅ **MVP 阶段完成** - Gateway API 和 Agent CLI 已可用

### 已实现功能

- ✅ Gateway HTTP API (注册/配对/心跳/健康检查)
- ✅ Redis 临时存储 (TTL 自动过期)
- ✅ Agent CLI 工具 (register/heartbeat/status/unregister)
- ✅ 配对码机制 (6 位数字,一次性使用)
- ✅ 单元测试框架
- ✅ Docker 部署配置
- ✅ Monorepo 架构 (pnpm workspaces)

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

### 当前实现 (MVP)

- **运行时**: Node.js 18+ (LTS)
- **语言**: TypeScript 5.x
- **框架**: Fastify 4.x (高性能 HTTP 服务器)
- **数据库**: Redis (临时存储, TTL 自动过期)
- **包管理**: pnpm workspaces
- **测试**: Jest + Supertest
- **代码规范**: ESLint + Prettier
- **部署**: Docker + Docker Compose

### 目录结构

```
linkgate/
├── packages/
│   ├── gateway/     # Gateway 服务器 (Fastify + Redis)
│   └── agent/       # Agent CLI 客户端
├── docs/            # 文档 (zh/en)
└── docker/          # Docker 配置
```

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
