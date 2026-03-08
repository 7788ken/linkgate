# 项目结构规划

本文档描述 LinkGate 项目的预期目录结构。

## 完整目录结构

```
linkgate/
├── docs/                      # 文档目录
│   ├── en/                    # 英文文档
│   │   ├── README.md         # 英文完整文档
│   │   ├── ARCHITECTURE.md   # 架构设计 (待创建)
│   │   ├── API.md            # API 文档 (待创建)
│   │   └── DEPLOYMENT.md     # 部署指南 (待创建)
│   └── zh/                    # 中文文档
│       ├── README.md         # 中文完整文档
│       ├── ARCHITECTURE.md   # 架构设计 (待创建)
│       ├── API.md            # API 文档 (待创建)
│       └── DEPLOYMENT.md     # 部署指南 (待创建)
│
├── packages/                  # Monorepo 包目录
│   ├── gateway/              # Gateway 服务器
│   │   ├── src/
│   │   │   ├── api/          # API 路由
│   │   │   ├── services/     # 业务逻辑
│   │   │   ├── models/       # 数据模型
│   │   │   ├── middleware/   # 中间件
│   │   │   └── index.ts      # 入口文件
│   │   ├── tests/            # 测试文件
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── agent/                # Agent 客户端
│   │   ├── src/
│   │   │   ├── client.ts     # 客户端核心
│   │   │   ├── register.ts   # 注册逻辑
│   │   │   ├── heartbeat.ts  # 心跳逻辑
│   │   │   └── index.ts      # CLI 入口
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── sdk/                  # SDK (移动端/Web)
│       ├── src/
│       │   ├── pairing.ts    # 配对逻辑
│       │   ├── connection.ts # 连接管理
│       │   └── index.ts      # SDK 入口
│       ├── tests/
│       ├── package.json
│       └── README.md
│
├── apps/                      # 应用程序
│   ├── web-admin/            # Web 管理界面 (可选)
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── mobile-app/           # 移动端示例应用 (可选)
│       ├── src/
│       └── package.json
│
├── docker/                    # Docker 相关
│   ├── gateway.Dockerfile    # Gateway 镜像
│   ├── agent.Dockerfile      # Agent 镜像
│   └── docker-compose.yml    # 本地开发环境
│
├── scripts/                   # 脚本工具
│   ├── setup.sh              # 项目初始化
│   └── deploy.sh             # 部署脚本
│
├── .gitignore                # Git 忽略配置
├── README.md                 # 项目说明
├── LICENSE                   # 许可证 (待添加)
└── package.json              # Monorepo 根配置 (如果使用 pnpm workspaces)
```

## 阶段性目录结构

### 阶段 1: MVP (当前)

```
linkgate/
├── docs/
│   ├── en/README.md
│   └── zh/README.md
├── packages/
│   ├── gateway/              # HTTP API + Redis
│   └── agent/                # CLI 工具
├── .gitignore
└── README.md
```

### 阶段 2: 增强功能

```
linkgate/
├── docs/
│   ├── en/ (完整文档)
│   └── zh/ (完整文档)
├── packages/
│   ├── gateway/              # + WebSocket
│   ├── agent/                # + 心跳机制
│   └── sdk/                  # 新增 SDK
├── apps/
│   └── web-admin/            # 新增管理界面
└── docker/
    └── docker-compose.yml
```

### 阶段 3: P2P 优化

```
linkgate/
├── (前期结构)
├── packages/
│   ├── gateway/              # + STUN/TURN 支持
│   ├── agent/                # + NAT 穿透
│   ├── sdk/                  # + WebRTC 支持
│   └── relay/                # 新增中继服务器 (可选)
└── apps/
    └── mobile-app/           # 新增移动端示例
```

## 核心模块说明

### 1. Gateway (网关服务器)

- **职责**: 处理 Agent 注册、配对验证、信息交换
- **技术**: Node.js + Express/Fastify + Redis
- **关键文件**:
  - `src/api/register.ts`: Agent 注册 API
  - `src/api/pair.ts`: 配对验证 API
  - `src/services/heartbeat.ts`: 心跳检测服务
  - `src/services/cleanup.ts`: 过期数据清理

### 2. Agent (客户端)

- **职责**: 向网关注册、维护心跳、接受连接
- **技术**: Node.js CLI 或 Go/Rust 二进制
- **关键文件**:
  - `src/client.ts`: 网关客户端
  - `src/register.ts`: 注册逻辑
  - `src/heartbeat.ts`: 心跳维护
  - `src/server.ts`: 本地服务 (接受连接)

### 3. SDK (移动端/Web)

- **职责**: 配对码输入、QR 码扫描、连接建立
- **技术**: TypeScript/JavaScript
- **关键文件**:
  - `src/pairing.ts`: 配对逻辑
  - `src/connection.ts`: P2P 连接管理
  - `src/webrtc.ts`: WebRTC 支持 (阶段 3)

## 技术选型建议

### Monorepo 工具

- **pnpm workspaces** (推荐): 高效、节省磁盘空间
- **Turborepo**: 构建优化
- **Nx**: 企业级 monorepo 工具

### 包管理器

- **pnpm** (推荐): 快速、节省空间
- **yarn**: 经典选择
- **npm**: Node.js 自带

### 测试框架

- **Jest**: 单元测试
- **Supertest**: API 测试
- **Playwright**: E2E 测试

## 下一步行动

1. 初始化 Monorepo 结构
2. 创建 `packages/gateway` 基础代码
3. 创建 `packages/agent` CLI 工具
4. 编写 API 文档
5. 编写单元测试
