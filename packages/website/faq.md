# 常见问题 (FAQ)

本文档汇总了 LinkGate 使用过程中的常见问题和解决方案。

## 快速导航

- [安装和配置](#安装和配置)
- [使用问题](#使用问题)
- [故障排除](#故障排除)
- [性能优化](#性能优化)
- [安全相关](#安全相关)
- [部署问题](#部署问题)

## 安装和配置

### Q: LinkGate 支持哪些操作系统?

**A**: LinkGate 支持所有主流操作系统:

- ✅ Linux (Ubuntu, Debian, CentOS, 等)
- ✅ macOS 10.15+
- ✅ Windows 10+ (使用 WSL2 或原生)
- ✅ Docker 容器

### Q: Node.js 版本要求是什么?

**A**:
- **最低**: Node.js 18.x
- **推荐**: Node.js 20.x LTS
- **不支持**: Node.js 16.x 及以下

检查版本:

```bash
node --version  # 应该 >= 18.0.0
```

### Q: 如何安装 pnpm?

**A**:

```bash
# 使用 npm
npm install -g pnpm

# 使用 Homebrew (macOS)
brew install pnpm

# 使用安装脚本
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Q: Redis 必须吗?可以用其他数据库吗?

**A**:
- **Redis 是必需的**,因为:
  - 配对码需要 TTL(过期时间)支持
  - 高性能内存存储
  - 原子操作保证

- **不能用其他数据库替代**:
  - MySQL/PostgreSQL: TTL 不友好
  - MongoDB: 性能不如 Redis
  - SQLite: 不支持分布式

### Q: 如何配置 Redis 密码?

**A**:

1. **Redis 配置**:

```bash
# /etc/redis/redis.conf
requirepass your-strong-password
```

2. **重启 Redis**:

```bash
sudo systemctl restart redis-server
```

3. **Gateway 配置**:

```env
# .env
REDIS_URL=redis://:your-strong-password@localhost:6379
```

### Q: 如何在 Windows 上运行?

**A**:

**方式 1: WSL2 (推荐)**

```bash
# 安装 WSL2
wsl --install

# 在 WSL2 中运行
cd /mnt/c/path/to/linkgate
pnpm install
pnpm run dev
```

**方式 2: 原生 Windows**

```bash
# 安装 Redis (使用 Memurai 或 Redis for Windows)
# 然后运行
pnpm install
pnpm run dev
```

## 使用问题

### Q: 配对码有效期是多久?

**A**:
- **默认**: 5 分钟 (300 秒)
- **可配置**: 1-30 分钟

修改有效期:

```env
# .env
PAIRING_CODE_TTL=600  # 10 分钟
```

### Q: 配对码可以重复使用吗?

**A**: **不可以**。配对码是一次性的:
- 配对成功后立即失效
- 防止重放攻击
- 需要重新注册获取新配对码

### Q: 一个 Agent 可以配对多少个设备?

**A**:
- **当前版本**: 无限制
- **推荐**: 根据实际需求控制
- **未来**: 企业版支持配额管理

### Q: Agent 离线后会发生什么?

**A**:

1. **心跳超时** (默认 10 分钟):
   - Gateway 标记 Agent 为离线
   - Redis 中的数据自动过期

2. **自动重连** (如果启用):
   - Agent 尝试重新连接
   - 指数退避重试

3. **移动设备**:
   - 收到断开通知 (WebSocket)
   - 需要重新配对

### Q: 如何查看当前在线的 Agent?

**A**:

**方式 1: CLI**

```bash
cd packages/agent
pnpm run dev status
```

**方式 2: API**

```bash
curl http://localhost:3000/api/agents
```

**方式 3: Redis**

```bash
redis-cli KEYS "agent:*"
```

### Q: 如何撤销已发布的配对码?

**A**:

```bash
# 删除指定配对码
redis-cli DEL "pairing:847291"

# 或者注销 Agent(会清理所有配对码)
curl -X DELETE http://localhost:3000/api/agent/agent-abc123
```

## 故障排除

### Q: 启动 Gateway 报错: "Redis connection refused"

**A**:

**原因**: Redis 未启动或无法连接

**解决**:

```bash
# 1. 检查 Redis 状态
redis-cli ping

# 2. 启动 Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Docker
docker-compose up -d redis

# 3. 验证连接
redis-cli ping  # 应该返回 PONG
```

### Q: 配对失败: "配对码无效或已过期"

**A**:

**可能原因**:

1. **配对码过期**:
   - 配对码 5 分钟后过期
   - 重新注册获取新配对码

2. **配对码已被使用**:
   - 配对码是一次性的
   - 重新注册获取新配对码

3. **配对码输入错误**:
   - 检查是否输入正确
   - 注意区分 0 和 O,1 和 l

**解决**:

```bash
# 重新注册 Agent
cd packages/agent
pnpm run dev register -g http://localhost:3000 -p 8080
```

### Q: Agent 心跳失败

**A**:

**排查步骤**:

```bash
# 1. 检查 Gateway 是否运行
curl http://localhost:3000/health

# 2. 检查 Agent ID 是否正确
pnpm run dev status

# 3. 检查网络连接
ping gateway.yourdomain.com

# 4. 查看详细日志
DEBUG=* pnpm run dev heartbeat -i agent-abc123
```

**常见原因**:

- Agent ID 不存在或已过期
- Gateway 不可达
- Redis 连接失败
- 防火墙阻止

### Q: Gateway 启动很慢

**A**:

**可能原因**:

1. **依赖安装不完整**:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

2. **TypeScript 编译慢**:
```bash
# 使用增量编译
pnpm run build --incremental
```

3. **Redis 连接慢**:
```bash
# 检查 Redis 延迟
redis-cli --latency
```

### Q: 内存占用过高

**A**:

**诊断**:

```bash
# 查看 Node.js 内存使用
node --expose-gc -e "console.log(process.memoryUsage())"

# 查看 Redis 内存使用
redis-cli INFO memory
```

**解决**:

1. **Gateway**:
```bash
# 限制 Node.js 内存
NODE_OPTIONS="--max-old-space-size=512" pnpm run dev
```

2. **Redis**:
```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## 性能优化

### Q: 如何提高配对速度?

**A**:

1. **使用连接池**:
```typescript
const redisPool = createPool({
  create: () => createClient({ url: process.env.REDIS_URL }),
  destroy: (client) => client.quit()
}, {
  min: 5,
  max: 20
})
```

2. **启用压缩**:
```typescript
import fastifyCompress from '@fastify/compress'
app.register(fastifyCompress)
```

3. **使用 CDN**:
```nginx
location /static {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Q: Gateway 能支持多少并发连接?

**A**:

**单实例性能**:
- 并发连接: 10,000
- 请求/秒: 50,000+
- 延迟(P99): < 20ms

**扩展建议**:
- 1-1000 用户: 单实例 + 单 Redis
- 1000-10000 用户: 3 实例 + Redis 主从
- 10000+ 用户: 集群 + Redis Cluster

### Q: 如何减少心跳开销?

**A**:

1. **调整心跳间隔**:
```env
HEARTBEAT_INTERVAL=120  # 2 分钟(默认 1 分钟)
```

2. **批量心跳**:
```typescript
// 批量发送多个 Agent 的心跳
const agents = [agent1, agent2, agent3]
await Promise.all(agents.map(a => a.heartbeat()))
```

3. **使用 WebSocket**:
```typescript
// WebSocket 心跳开销更小
agent.connectWebSocket()
```

## 安全相关

### Q: 配对码会被暴力破解吗?

**A**:

**风险较低**,因为:

1. **熵足够**: 6 位数字 = 19.9 bits 熵
2. **有效期短**: 5 分钟过期
3. **速率限制**: 每分钟最多 20 次尝试
4. **一次性使用**: 配对后立即失效

**成功概率**:
```
100 次 / 1,000,000 种可能 = 0.01%
```

### Q: 如何防止中间人攻击?

**A**:

1. **始终使用 HTTPS**:
```nginx
server {
    listen 443 ssl;
    # ...
}
```

2. **证书固定** (移动端):
```kotlin
val certPinner = CertificatePinner.Builder()
    .add("gateway.example.com", "sha256/your-hash")
    .build()
```

3. **HSTS**:
```nginx
add_header Strict-Transport-Security "max-age=31536000";
```

### Q: Redis 数据会被窃取吗?

**A**:

**防护措施**:

1. **启用认证**:
```bash
# redis.conf
requirepass strong-password
```

2. **限制访问**:
```bash
bind 127.0.0.1
protected-mode yes
```

3. **使用 TLS**:
```bash
tls-port 6379
tls-cert-file /path/to/cert.pem
```

4. **网络隔离**:
```bash
# 仅允许 Gateway 访问
sudo ufw allow from 127.0.0.1 to any port 6379
```

### Q: 如何防止 DDoS 攻击?

**A**:

1. **速率限制**:
```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
})
```

2. **CDN/WAF**:
- Cloudflare
- AWS Shield
- Azure DDoS Protection

3. **负载均衡**:
```nginx
upstream gateway {
    server gateway1:3000;
    server gateway2:3000;
    server gateway3:3000;
}
```

### Q: 如何审计安全事件?

**A**:

**启用审计日志**:

```typescript
logger.info('AUDIT', {
  action: 'PAIRING_SUCCESS',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString()
})
```

**定期检查**:

```bash
# 查看失败日志
grep "PAIRING_FAILURE" /var/log/linkgate/app.log

# 查看异常 IP
awk '{print $ip}' app.log | sort | uniq -c | sort -rn | head
```

## 部署问题

### Q: 如何更新到最新版本?

**A**:

```bash
# 1. 备份配置
cp .env .env.backup

# 2. 拉取最新代码
git pull origin master

# 3. 更新依赖
pnpm install

# 4. 重新构建
pnpm run build

# 5. 重启服务
pm2 restart linkgate-gateway

# 6. 验证
curl http://localhost:3000/health
```

### Q: Docker 部署如何持久化数据?

**A**:

```yaml
# docker-compose.yml
services:
  redis:
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**备份**:

```bash
# 导出数据
docker exec linkgate-redis redis-cli BGSAVE
docker cp linkgate-redis:/data/dump.rdb ./backup/

# 恢复数据
docker cp ./backup/dump.rdb linkgate-redis:/data/
docker restart linkgate-redis
```

### Q: 如何实现零停机部署?

**A**:

**使用 PM2**:

```bash
# 零停机重载
pm2 reload linkgate-gateway
```

**使用 Kubernetes**:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Q: 如何监控生产环境?

**A**:

1. **健康检查**:
```bash
# 添加到 Cron
*/5 * * * * curl -f http://localhost:3000/health || systemctl restart linkgate
```

2. **Prometheus + Grafana**:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'linkgate'
    static_configs:
      - targets: ['localhost:3000']
```

3. **日志聚合**:
- ELK Stack
- Loki + Grafana
- CloudWatch Logs

### Q: 如何迁移到新服务器?

**A**:

**步骤**:

```bash
# 1. 导出数据
redis-cli --rdb dump.rdb

# 2. 打包配置
tar -czf linkgate-config.tar.gz .env nginx.conf

# 3. 传输到新服务器
scp dump.rdb linkgate-config.tar.gz user@new-server:/tmp/

# 4. 新服务器上恢复
# 安装依赖
git clone https://github.com/7788ken/linkgate.git
cd linkgate
pnpm install
pnpm run build

# 恢复配置
tar -xzf /tmp/linkgate-config.tar.gz

# 恢复 Redis 数据
redis-cli --rdb /tmp/dump.rdb

# 启动服务
pm2 start ecosystem.config.js
```

## 其他问题

### Q: LinkGate 是开源的吗?

**A**: 是的,LinkGate 采用 MIT 许可证开源。

- GitHub: https://github.com/7788ken/linkgate
- 许可证: MIT
- 可商用: ✅
- 可修改: ✅

### Q: 有商业支持吗?

**A**:
- **社区支持**: GitHub Issues/Discussions
- **商业支持**: 计划中 (企业版)
- **SLA 保障**: 企业版提供

### Q: 如何贡献代码?

**A**:

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

详见 [贡献指南](https://github.com/7788ken/linkgate/blob/master/CONTRIBUTING.md)

### Q: 在哪里报告安全漏洞?

**A**:

请**不要**在公开的 Issue 中报告安全漏洞。

发送邮件到: security@linkgate.example.com

我们会在 48 小时内回复。

### Q: 如何获取最新动态?

**A**:

- ⭐ Star GitHub 仓库
- 👀 Watch Releases
- 💬 加入 Discussions
- 📢 关注 Twitter (@linkgate)

---

## 没有找到答案?

如果你的问题没有在这里找到答案:

1. 📖 查阅[完整文档](/guide/)
2. 💬 在 [GitHub Discussions](https://github.com/7788ken/linkgate/discussions) 提问
3. 🐛 在 [GitHub Issues](https://github.com/7788ken/linkgate/issues) 报告问题
4. 📧 发送邮件到 support@linkgate.example.com
