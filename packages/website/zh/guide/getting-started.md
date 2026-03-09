# 快速开始

本指南将帮助你在 5 分钟内启动 LinkGate。

## 前置要求

- Node.js 18+ (推荐使用 LTS 版本)
- pnpm 8+
- Redis 服务器 (用于临时存储)
- Docker (可选,用于本地 Redis)

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/7788ken/linkgate.git
cd linkgate
```

### 2. 安装依赖

```bash
# 安装 pnpm (如果还没安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 3. 启动 Redis

使用 Docker 启动 Redis:

```bash
docker-compose up -d redis
```

或者使用本地 Redis:

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. 启动 Gateway

```bash
# 进入 gateway 目录
cd packages/gateway

# 启动开发服务器
pnpm run dev
```

Gateway 将在 `http://localhost:3000` 启动。

### 5. 注册 Agent

在新的终端窗口中:

```bash
# 进入 agent 目录
cd packages/agent

# 注册 Agent (连接到本地 Gateway,监听端口 8080)
pnpm run dev register -g http://localhost:3000 -p 8080
```

你将看到类似输出:

```
✓ Agent 注册成功
配对码: 847291
有效期: 5分钟

使用此配对码在移动设备上完成配对
```

### 6. 配对连接

使用 HTTP API 进行配对:

```bash
curl -X POST http://localhost:3000/api/pair \
  -H "Content-Type: application/json" \
  -d '{"pairing_code":"847291","device_id":"mobile-123"}'
```

成功响应:

```json
{
  "success": true,
  "data": {
    "agent_id": "agent-abc123",
    "endpoint": "http://localhost:8080",
    "message": "配对成功"
  }
}
```

## 验证安装

### 检查 Gateway 状态

```bash
curl http://localhost:3000/health
```

### 检查 Agent 状态

```bash
cd packages/agent
pnpm run dev status
```

## 下一步

- 📖 [安装指南](/guide/installation) - 生产环境部署
- 🔧 [Agent 配置](/guide/agent) - Agent 详细配置
- 🌐 [Gateway API](/guide/api) - API 完整文档
- 🚀 [部署指南](/guide/deployment) - 部署到生产环境

## 常见问题

### Redis 连接失败

确保 Redis 正在运行:

```bash
# 检查 Redis 状态
redis-cli ping
# 应该返回: PONG
```

### 端口被占用

修改 Gateway 端口:

```bash
PORT=3001 pnpm run dev
```

### 配对码过期

配对码默认 5 分钟过期,可以重新注册获取新配对码。

## 获取帮助

遇到问题? 加入社区:

- [GitHub Discussions](https://github.com/7788ken/linkgate/discussions)
- [Issue Tracker](https://github.com/7788ken/linkgate/issues)
