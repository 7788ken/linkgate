# LinkGate 快速开始指南

## 🚀 5 分钟快速启动

### 1. 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Redis (本地或 Docker)

### 2. 安装依赖

```bash
# 安装 pnpm (如果还没安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 3. 启动 Redis

```bash
# 使用 Docker Compose 启动 Redis
docker-compose up -d redis

# 或使用本地 Redis
redis-server
```

### 4. 启动 Gateway 服务器

```bash
# 开发模式
cd packages/gateway
pnpm run dev

# Gateway 将在 http://localhost:3000 启动
```

### 5. 注册 Agent (新终端窗口)

```bash
cd packages/agent

# 开发模式运行
pnpm run dev register \
  --gateway http://localhost:3000 \
  --port 8080 \
  --name "MyTestAgent"
```

输出示例:
```
Checking gateway health: http://localhost:3000
✅ Gateway is healthy
Detecting public IP...
✅ Public IP: 1.2.3.4
✅ Local IP: 192.168.1.100
Registering agent...

✅ Registration successful!

  Agent ID: 550e8400-e29b-41d4-a716-446655440000
  Pairing Code: 847291
  Expires in: 300 seconds

💡 Share this pairing code with your mobile device to connect.
```

### 6. 模拟设备配对

```bash
# 使用 curl 测试配对
curl -X POST http://localhost:3000/api/pair \
  -H "Content-Type: application/json" \
  -d '{
    "pairing_code": "847291",
    "device_id": "test-mobile-device",
    "device_name": "My iPhone"
  }'
```

成功响应:
```json
{
  "success": true,
  "agent_info": {
    "public_ip": "1.2.3.4",
    "local_ip": "192.168.1.100",
    "port": 8080,
    "capabilities": ["file-transfer", "remote-shell"]
  }
}
```

## 📦 完整工作流程

### Gateway 服务器

```bash
# 开发
cd packages/gateway
pnpm run dev

# 构建
pnpm run build

# 生产运行
pnpm start

# 测试
pnpm test
```

### Agent 客户端

```bash
cd packages/agent

# 注册
pnpm run dev register -g http://localhost:3000 -p 8080

# 心跳
pnpm run dev heartbeat -g http://localhost:3000 -a <agent-id>

# 状态
pnpm run dev status -g http://localhost:3000 -a <agent-id>

# 注销
pnpm run dev unregister -g http://localhost:3000 -a <agent-id>
```

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test -- --coverage
```

## 🐳 Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f gateway

# 停止服务
docker-compose down
```

## 🔧 开发工具

### 代码检查

```bash
# ESLint
pnpm lint

# 自动修复
pnpm lint --fix
```

### 代码格式化

```bash
# Prettier
pnpm format
```

## 📊 API 测试

### 使用 HTTPie

```bash
# 安装 HTTPie
brew install httpie

# 健康检查
GET http://localhost:3000/api/health

# 注册 Agent
POST http://localhost:3000/api/register port=8080 ttl:=300 capabilities:='["file-transfer"]'

# 配对
POST http://localhost:3000/api/pair pairing_code=847291 device_id=test-device
```

### 使用 Postman

导入 API 集合:
- Gateway URL: `http://localhost:3000`
- Endpoints:
  - POST `/api/register`
  - POST `/api/pair`
  - POST `/api/heartbeat/:agent_id`
  - DELETE `/api/agent/:agent_id`
  - GET `/api/health`

## 🐛 常见问题

### Redis 连接失败

```bash
# 检查 Redis 是否运行
redis-cli ping

# 启动 Redis
docker-compose up -d redis
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀掉进程
kill -9 <PID>
```

### 配对码过期

配对码默认 5 分钟 (300 秒) 有效期,可以通过 `--ttl` 参数调整:

```bash
pnpm run dev register -g http://localhost:3000 -p 8080 --ttl 600
```

## 📚 下一步

- [ ] 实现 WebSocket 实时通信
- [ ] 添加 QR 码配对支持
- [ ] 开发移动端 SDK
- [ ] 实现 NAT 穿透
- [ ] 添加端到端加密

## 💡 提示

1. **开发环境**: 使用 `pnpm run dev` 自动重启服务器
2. **日志查看**: Gateway 日志输出到控制台,包含详细的请求信息
3. **调试**: 在代码中使用 `fastify.log.debug()` 输出调试信息
4. **Redis**: 使用 `redis-cli` 可以查看存储的数据:
   ```bash
   redis-cli
   > KEYS linkgate:*
   > GET linkgate:agent:<agent-id>
   ```

## 🎯 目标完成度

### ✅ 已完成 (MVP)

- [x] Gateway HTTP API
- [x] Redis 临时存储
- [x] Agent CLI 工具
- [x] 基础配对流程
- [x] 单元测试框架
- [x] Docker 部署配置

### 🚧 进行中

- [ ] 完整的单元测试覆盖
- [ ] 集成测试
- [ ] CI/CD 流程

### 📅 计划中

- [ ] WebSocket 实时通信
- [ ] QR 码配对
- [ ] Web 管理界面
- [ ] 移动端 SDK

---

**Happy Pairing! 🎉**
