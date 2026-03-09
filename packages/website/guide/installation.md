# 安装指南

本指南提供 LinkGate 的详细安装步骤,包括开发环境和生产环境。

## 系统要求

### 必需

- **Node.js**: 18.x 或更高版本 (推荐 LTS)
- **pnpm**: 8.x 或更高版本
- **Redis**: 6.x 或更高版本
- **内存**: 最少 512MB
- **存储**: 最少 100MB

### 推荐

- **Docker**: 用于容器化部署
- **Docker Compose**: 用于本地开发

## 安装方式

### 方式 1: 从源码安装

适合开发和自定义需求。

```bash
# 1. 克隆仓库
git clone https://github.com/linkgate/linkgate.git
cd linkgate

# 2. 安装 pnpm (如果需要)
npm install -g pnpm

# 3. 安装依赖
pnpm install

# 4. 构建项目
pnpm run build
```

### 方式 2: Docker 部署

适合生产环境快速部署。

```bash
# 1. 拉取镜像
docker pull linkgate/gateway:latest

# 2. 运行容器
docker run -d \
  --name linkgate-gateway \
  -p 3000:3000 \
  -e REDIS_URL=redis://redis:6379 \
  linkgate/gateway:latest
```

### 方式 3: 使用 Docker Compose

一键部署完整环境。

```bash
# 使用项目提供的 docker-compose.yml
docker-compose up -d
```

## 配置

### 环境变量

创建 `.env` 文件:

```bash
# 复制示例配置
cp .env.example .env
```

编辑 `.env`:

```env
# Gateway 配置
PORT=3000
HOST=0.0.0.0

# Redis 配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# 配对配置
PAIRING_CODE_TTL=300        # 配对码有效期(秒)
PAIRING_CODE_LENGTH=6       # 配对码长度

# Agent 配置
AGENT_TTL=600               # Agent 心跳超时(秒)
HEARTBEAT_INTERVAL=60       # 心跳间隔(秒)

# 安全配置
CORS_ORIGIN=*               # CORS 来源
RATE_LIMIT_MAX=100          # 速率限制
```

### Redis 配置

#### 本地 Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 验证
redis-cli ping
```

#### Docker Redis

```bash
# 启动 Redis 容器
docker run -d \
  --name linkgate-redis \
  -p 6379:6379 \
  redis:7-alpine

# 使用密码保护
docker run -d \
  --name linkgate-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass your-password
```

## 目录结构

```
linkgate/
├── packages/
│   ├── gateway/          # Gateway 服务
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── agent/            # Agent CLI
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── docs/                 # 文档
├── docker/               # Docker 配置
├── .env.example          # 环境变量示例
└── docker-compose.yml    # Docker Compose 配置
```

## 验证安装

### 1. 检查 Gateway

```bash
cd packages/gateway
pnpm run dev
```

访问 `http://localhost:3000/health`:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 10
}
```

### 2. 检查 Agent

```bash
cd packages/agent
pnpm run dev status
```

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
cd packages/gateway && pnpm test
```

## 生产环境部署

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动 Gateway
cd packages/gateway
pm2 start npm --name "linkgate-gateway" -- run start

# 查看日志
pm2 logs linkgate-gateway

# 开机自启
pm2 startup
pm2 save
```

### 使用 Systemd

创建服务文件 `/etc/systemd/system/linkgate.service`:

```ini
[Unit]
Description=LinkGate Gateway
After=network.target

[Service]
Type=simple
User=linkgate
WorkingDirectory=/opt/linkgate/packages/gateway
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl enable linkgate
sudo systemctl start linkgate
sudo systemctl status linkgate
```

### 云平台部署

详见 [部署指南](/guide/deployment)。

## 升级

```bash
# 拉取最新代码
git pull origin master

# 更新依赖
pnpm install

# 重新构建
pnpm run build

# 重启服务
pm2 restart linkgate-gateway
```

## 故障排除

### 依赖安装失败

```bash
# 清理缓存
pnpm store prune

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Redis 连接问题

```bash
# 检查 Redis 状态
redis-cli ping

# 检查 Redis 配置
redis-cli config get bind
redis-cli config get protected-mode
```

### 端口冲突

```bash
# 查找占用端口的进程
lsof -i :3000

# 修改端口
PORT=3001 pnpm run dev
```

## 下一步

- [快速开始](/guide/getting-started) - 开始使用
- [Agent 配置](/guide/agent) - Agent 详细配置
- [部署指南](/guide/deployment) - 生产部署
