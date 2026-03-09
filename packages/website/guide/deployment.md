# 部署指南

本指南提供 LinkGate 在生产环境的部署方案。

## 部署选项

LinkGate 支持多种部署方式:

1. **传统部署**: VPS/云服务器 + PM2
2. **容器化部署**: Docker + Docker Compose
3. **云平台**: Railway、Fly.io、Vercel 等
4. **Kubernetes**: 适合大规模部署

## 前置要求

### 生产环境检查清单

- [ ] Node.js 18+ (LTS)
- [ ] Redis 6+ (持久化配置)
- [ ] HTTPS 证书 (Let's Encrypt 或其他)
- [ ] 域名 (可选但推荐)
- [ ] 防火墙配置
- [ ] 监控和日志

## 方式 1: 传统部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 Redis
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 验证
node --version  # v18.x.x
redis-cli ping  # PONG
```

### 2. 部署代码

```bash
# 克隆代码
git clone https://github.com/7788ken/linkgate.git
cd linkgate

# 安装依赖
pnpm install

# 构建
pnpm run build
```

### 3. 环境配置

```bash
# 创建生产环境配置
cp .env.example .env.production
```

编辑 `.env.production`:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Redis (使用密码)
REDIS_URL=redis://:your-password@localhost:6379

# 安全配置
PAIRING_CODE_TTL=300
CORS_ORIGIN=https://yourdomain.com

# 速率限制
RATE_LIMIT_MAX=100
```

### 4. 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动 Gateway
cd packages/gateway
pm2 start npm --name "linkgate-gateway" -- run start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

**PM2 配置文件** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'linkgate-gateway',
    script: 'npm',
    args: 'run start',
    cwd: '/opt/linkgate/packages/gateway',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/linkgate/error.log',
    out_file: '/var/log/linkgate/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
```

启动:

```bash
pm2 start ecosystem.config.js --env production
```

### 5. Nginx 反向代理

```nginx
# /etc/nginx/sites-available/linkgate
server {
    listen 80;
    server_name gateway.yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gateway.yourdomain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/gateway.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gateway.yourdomain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 代理到 Gateway
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

启用配置:

```bash
sudo ln -s /etc/nginx/sites-available/linkgate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL 证书

使用 Let's Encrypt:

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d gateway.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

## 方式 2: Docker 部署

### 1. 创建 Dockerfile

项目已包含 `Dockerfile.fly`,可以创建通用 Dockerfile:

```dockerfile
# packages/gateway/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY packages/gateway/package.json ./packages/gateway/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:18-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app/packages/gateway/dist ./dist
COPY --from=builder /app/packages/gateway/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 2. Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  gateway:
    build:
      context: .
      dockerfile: packages/gateway/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - PORT=3000
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - linkgate-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - linkgate-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - gateway
    restart: unless-stopped
    networks:
      - linkgate-network

volumes:
  redis-data:

networks:
  linkgate-network:
    driver: bridge
```

部署:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 方式 3: 云平台部署

### Railway

项目已包含 `railway.toml`:

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 部署
railway up

# 添加 Redis
railway add --plugin redis

# 设置环境变量
railway variables set REDIS_URL=${{Redis.REDIS_URL}}
```

### Fly.io

项目已包含 `fly.toml`:

```bash
# 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 创建应用
fly apps create linkgate-gateway

# 添加 Redis
fly redis create

# 部署
fly deploy

# 设置环境变量
fly secrets set REDIS_URL=<redis-url>
```

### Vercel (仅 Gateway)

注意: Vercel 不支持 WebSocket,仅适合 HTTP API。

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

## 方式 4: Kubernetes

### 1. 创建 Deployment

```yaml
# k8s/gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: linkgate-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: linkgate-gateway
  template:
    metadata:
      labels:
        app: linkgate-gateway
    spec:
      containers:
      - name: gateway
        image: linkgate/gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: linkgate-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 2. 创建 Service

```yaml
# k8s/gateway-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: linkgate-gateway
spec:
  selector:
    app: linkgate-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 3. 部署

```bash
kubectl apply -f k8s/
```

## 监控和日志

### PM2 监控

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs linkgate-gateway

# 监控面板
pm2 monit
```

### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 日志管理

使用 ELK 或 Loki:

```javascript
// packages/gateway/src/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

## 安全加固

### 1. Redis 安全

```bash
# /etc/redis/redis.conf
requirepass your-strong-password
bind 127.0.0.1
protected-mode yes
```

重启 Redis:

```bash
sudo systemctl restart redis-server
```

### 2. 防火墙配置

```bash
# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许 SSH
sudo ufw allow 22/tcp

# 启用防火墙
sudo ufw enable
```

### 3. 速率限制

```env
# .env
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

## 备份和恢复

### Redis 备份

```bash
# 手动备份
redis-cli BGSAVE

# 定时备份(cron)
0 2 * * * redis-cli BGSAVE && cp /var/lib/redis/dump.rdb /backup/redis-$(date +\%Y\%m\%d).rdb
```

### 恢复

```bash
# 停止 Redis
sudo systemctl stop redis-server

# 恢复数据
cp /backup/redis-20240101.rdb /var/lib/redis/dump.rdb

# 启动 Redis
sudo systemctl start redis-server
```

## 性能优化

### 1. Redis 优化

```bash
# /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 2. Node.js 优化

```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=2048" pm2 start ecosystem.config.js
```

### 3. Nginx 优化

```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
```

## 故障排除

### Gateway 无法启动

```bash
# 检查端口占用
lsof -i :3000

# 检查 Redis 连接
redis-cli ping

# 查看日志
pm2 logs linkgate-gateway
```

### Redis 连接失败

```bash
# 检查 Redis 状态
sudo systemctl status redis-server

# 检查配置
redis-cli config get bind
redis-cli config get requirepass
```

### SSL 证书问题

```bash
# 测试证书
openssl s_client -connect gateway.yourdomain.com:443

# 续期证书
sudo certbot renew
```

## 下一步

- [最佳实践](/guide/best-practices) - 生产环境最佳实践
- [技术架构](/technical/architecture) - 了解技术架构
- [FAQ](/faq) - 常见问题
