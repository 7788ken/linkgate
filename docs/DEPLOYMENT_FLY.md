# Fly.io Deployment Guide

## 全球边缘部署到 Fly.io

### 为什么选择 Fly.io?

- 🌍 **全球边缘**: 30+ 数据中心,低延迟
- ⚡ **性能优异**: 物理机而非虚拟机
- 💰 **免费额度**: 3 个共享 CPU VM + 3GB 存储
- 🔄 **自动扩展**: 根据负载自动扩缩容
- 🔒 **安全可靠**: 内置 SSL/TLS,私有网络

### 前提条件

- Fly.io 账号 (https://fly.io)
- Fly CLI 工具
- 项目代码

### 部署步骤

#### 1. 安装 Fly CLI

```bash
# macOS
curl -L https://fly.io/install.sh | sh

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# 验证安装
fly version
```

#### 2. 登录 Fly.io

```bash
# 登录
fly auth login

# 或注册新账号
fly auth signup
```

#### 3. 创建应用

```bash
# 方式 1: 自动创建 (推荐)
fly launch

# 方式 2: 手动创建
fly apps create linkgate-gateway
```

#### 4. 配置环境变量

```bash
# 设置环境变量
fly secrets set NODE_ENV=production
fly secrets set LOG_LEVEL=info
fly secrets set GATEWAY_URL=https://linkgate-gateway.fly.dev

# 或编辑 fly.toml
```

#### 5. 添加 Redis

```bash
# 方式 1: 使用 Fly.io Redis (推荐)
fly redis create

# 选择配置:
# - Name: linkgate-redis
# - Region: 选择离用户最近的
# - Plan: Free (1 GB RAM)

# 方式 2: 使用 Upstash Redis (免费)
# 访问 https://upstash.com 创建 Redis
# 获取 URL 并设置:
fly secrets set REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```

#### 6. 部署应用

```bash
# 部署
fly deploy

# 查看状态
fly status

# 查看日志
fly logs
```

#### 7. 验证部署

```bash
# 获取应用 URL
fly info

# 健康检查
curl https://linkgate-gateway.fly.dev/api/health

# 应该返回
{"status":"ok","timestamp":1234567890}
```

### 多区域部署

```bash
# 查看可用区域
fly platform regions

# 添加区域
fly regions add nrt  # Tokyo
fly regions add lax  # Los Angeles
fly regions add fra  # Frankfurt

# 部署到多区域
fly deploy --regions sin,nrt,lax
```

### 自定义域名

```bash
# 1. 添加域名
fly domains add gateway.linkgate.example.com

# 2. 配置 DNS
# 添加 A 记录:
# gateway.linkgate.example.com -> Fly.io 提供的 IP

# 或添加 CNAME:
# gateway.linkgate.example.com -> linkgate-gateway.fly.dev

# 3. 申请 SSL 证书
fly certs create gateway.linkgate.example.com

# 4. 验证证书
fly certs show gateway.linkgate.example.com
```

### 监控和日志

```bash
# 实时日志
fly logs

# 应用指标
fly metrics

# SSH 进入容器
fly ssh console

# 查看运行状态
fly status
fly vm status
```

### 扩展和缩容

```bash
# 手动扩展
fly scale count 3

# 自动扩展 (需要配置)
fly autoscale set min=1 max=5

# 调整资源
fly scale vm shared-cpu-2x --memory 2048

# 查看当前配置
fly scale show
```

### 成本估算

#### 免费额度
```
3 shared-cpu-1x VMs (256MB RAM each)
3GB persistent volume
160GB outbound data transfer

预估: $0/月
适合: 测试、小型应用
```

#### 生产环境
```
1 dedicated-cpu-1x VM (2GB RAM)
1GB Redis
100GB data transfer

预估: $15-25/月
适合: 中型应用,1000+ 用户
```

#### 全球部署
```
3 dedicated-cpu-1x VMs (多区域)
3GB Redis
300GB data transfer

预估: $50-80/月
适合: 大型应用,全球用户
```

### 性能优化

#### 1. 启用健康检查

```toml
# fly.toml
[[services.http_checks]]
  interval = "30s"
  timeout = "5s"
  method = "get"
  path = "/api/health"
```

#### 2. 配置并发限制

```toml
[services.concurrency]
  type = "connections"
  hard_limit = 100
  soft_limit = 80
```

#### 3. 启用自动扩展

```bash
# 设置自动扩展规则
fly autoscale set min=1 max=10
```

#### 4. 使用缓存

```bash
# 添加 Volume 用于 Redis 持久化
fly volumes create redis_data --region sin --size 1
```

### 故障排查

#### 1. 部署失败

```bash
# 查看构建日志
fly logs --instance

# 常见问题:
- 内存不足: fly scale vm shared-cpu-2x --memory 2048
- 构建超时: 检查 Dockerfile
- 依赖缺失: 检查 package.json
```

#### 2. 应用崩溃

```bash
# 查看应用日志
fly logs

# 查看实例状态
fly status

# 重启应用
fly restart

# 回滚到上一版本
fly rollback
```

#### 3. Redis 连接失败

```bash
# 检查 Redis 状态
fly redis list

# 查看 Redis 连接字符串
fly redis status linkgate-redis

# 测试连接
fly ssh console
redis-cli -u $REDIS_URL ping
```

#### 4. 性能问题

```bash
# 查看资源使用
fly metrics

# 升级资源
fly scale vm dedicated-cpu-2x --memory 4096

# 优化区域
fly regions list
fly regions remove <region>  # 移除远离用户的区域
```

### 安全配置

#### 1. 环境变量加密

```bash
# 所有 secrets 都自动加密
fly secrets list
fly secrets set SECRET_KEY=value
```

#### 2. 限制访问

```bash
# 仅允许特定 IP
fly ips list
fly ips allocate-v4

# 配置防火墙 (需要 Pro 计划)
```

#### 3. 启用 HTTPS

```bash
# Fly.io 自动提供 SSL/TLS
# 自定义域名需要手动配置:
fly certs create gateway.example.com
```

### CI/CD 集成

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Fly.io
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### 备份和恢复

```bash
# 备份 Redis 数据
fly ssh console
redis-cli -u $REDIS_URL --rdb /data/dump.rdb

# 下载备份
fly sftp get /data/dump.rdb ./backup.rdb

# 恢复数据
fly sftp put ./backup.rdb /data/dump.rdb
fly restart
```

### 下一步

- [ ] 配置自定义域名
- [ ] 启用多区域部署
- [ ] 配置自动扩展
- [ ] 添加监控告警 (Grafana)
- [ ] 性能测试和优化

### 支持资源

- Fly.io 文档: https://fly.io/docs/
- Fly.io 社区: https://community.fly.io/
- Fly.io Status: https://status.fly.io/
- LinkGate Issues: https://github.com/linkgate/linkgate/issues

### 常用命令速查

```bash
# 应用管理
fly apps list          # 列出所有应用
fly apps create <name> # 创建应用
fly apps destroy <name> # 删除应用

# 部署
fly deploy             # 部署应用
fly status             # 查看状态
fly logs               # 查看日志
fly restart            # 重启应用
fly rollback           # 回滚

# 扩展
fly scale count 3      # 扩展到 3 个实例
fly scale vm shared-cpu-2x # 升级 VM
fly autoscale set min=1 max=5 # 自动扩展

# 域名
fly domains list       # 列出域名
fly domains add <domain> # 添加域名
fly certs create <domain> # 申请证书

# Redis
fly redis create       # 创建 Redis
fly redis list         # 列出 Redis
fly redis status <name> # 查看 Redis 状态

# SSH
fly ssh console        # 进入容器
fly ssh issue          # 生成 SSH 证书
```
