# Railway Deployment Guide

## 快速部署到 Railway

### 前提条件

- GitHub 账号
- Railway 账号 (https://railway.app)
- 项目代码已推送到 GitHub

### 部署步骤

#### 1. 登录 Railway

访问 https://railway.app 并使用 GitHub 账号登录

#### 2. 创建新项目

```bash
# 方式 1: 通过 Web 界面
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择 linkgate 仓库
4. 点击 "Deploy Now"

# 方式 2: 通过 CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

#### 3. 配置环境变量

在 Railway 项目设置中添加以下环境变量:

```bash
# 基础配置
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis (Railway 自动提供)
REDIS_URL=${{Redis.REDIS_URL}}

# Gateway URL (替换为你的 Railway 域名)
GATEWAY_URL=https://linkgate-production.up.railway.app

# 安全配置
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
DEFAULT_TTL=300
MAX_TTL=3600
```

#### 4. 添加 Redis 服务

```bash
# 在 Railway 项目中
1. 点击 "+ New"
2. 选择 "Database"
3. 选择 "Redis"
4. Redis 会自动连接到你的应用
```

#### 5. 部署

```bash
# 自动部署
Railway 会自动检测代码推送并部署

# 手动部署
railway up
```

#### 6. 验证部署

```bash
# 健康检查
curl https://your-app.up.railway.app/api/health

# 应该返回
{"status":"ok","timestamp":1234567890}
```

### 自定义域名 (可选)

```bash
# 1. 在 Railway 项目设置中
Settings > Domains > Add Custom Domain

# 2. 添加你的域名
例如: gateway.linkgate.example.com

# 3. 配置 DNS
添加 CNAME 记录指向 your-app.up.railway.app
```

### 监控和日志

```bash
# 查看日志
railway logs

# 在 Web 界面
项目 > Deployments > 选择部署 > View Logs
```

### 扩展配置

```bash
# 在 railway.toml 中配置

[deploy]
# 副本数量
replicas = 2

# 资源限制
memory = 1024
cpu = 2
```

### 成本估算

#### 免费额度 ($5/月)
- RAM: 512 MB
- CPU: 1 vCPU
- 网络流量: 100 GB
- **适合**: 测试、小型应用

#### 生产环境 (~$10-15/月)
- RAM: 1 GB
- CPU: 2 vCPU
- Redis: 256 MB
- **适合**: 中型应用,1000+ 用户

### 故障排查

#### 1. 构建失败

```bash
# 检查构建日志
railway logs --deployment

# 常见问题:
- pnpm 版本不兼容: 在 nixpacks.toml 中指定版本
- 依赖缺失: 检查 package.json
```

#### 2. Redis 连接失败

```bash
# 检查 Redis 变量
railway variables

# 应该包含:
REDIS_URL=redis://default:xxx@xxx.railway.app:6379
```

#### 3. 应用崩溃

```bash
# 查看应用日志
railway logs

# 常见原因:
- 内存不足: 升级套餐
- 端口错误: 确保使用 PORT 环境变量
- Redis 超时: 检查 Redis 连接
```

### 性能优化

```bash
# 1. 启用健康检查
# railway.toml
[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 300

# 2. 配置自动扩展
[deploy]
replicas = 2
autoscaling = true
```

### 安全建议

```bash
# 1. 环境变量加密
Railway 自动加密所有环境变量

# 2. 限制访问
Settings > Networking > Allow List

# 3. 启用 HTTPS
Railway 默认提供 SSL/TLS
```

### 下一步

- [ ] 配置自定义域名
- [ ] 添加监控 (Grafana)
- [ ] 配置告警 (PagerDuty)
- [ ] 设置 CI/CD
- [ ] 性能测试

### 支持资源

- Railway 文档: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- LinkGate Issues: https://github.com/linkgate/linkgate/issues
