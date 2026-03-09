# FAQ

Frequently Asked Questions about LinkGate.

## Quick Navigation

- [Installation & Configuration](#installation--configuration)
- [Usage Issues](#usage-issues)
- [Troubleshooting](#troubleshooting)
- [Deployment Issues](#deployment-issues)

## Installation & Configuration

### Q: What operating systems does LinkGate support?

**A**: LinkGate supports all major operating systems:

- ✅ Linux (Ubuntu, Debian, CentOS, etc.)
- ✅ macOS 10.15+
- ✅ Windows 10+ (using WSL2 or native)
- ✅ Docker containers

### Q: What are the Node.js version requirements?

**A**:
- **Minimum**: Node.js 18.x
- **Recommended**: Node.js 20.x LTS
- **Not Supported**: Node.js 16.x and below

Check version:

```bash
node --version  # Should be >= 18.0.0
```

### Q: Is Redis required? Can I use other databases?

**A**:
- **Redis is required** because:
  - Pairing codes need TTL (expiration) support
  - High-performance in-memory storage
  - Atomic operations guarantee

- **Cannot be replaced by other databases**:
  - MySQL/PostgreSQL: TTL not friendly
  - MongoDB: Performance not as good as Redis
  - SQLite: Doesn't support distributed deployment

## Usage Issues

### Q: How long is the pairing code valid?

**A**:
- **Default**: 5 minutes (300 seconds)
- **Configurable**: 1-30 minutes

Modify validity period:

```env
# .env
PAIRING_CODE_TTL=600  # 10 minutes
```

### Q: Can pairing codes be reused?

**A**: **No**. Pairing codes are one-time use:
- Invalidated immediately after successful pairing
- Prevents replay attacks
- Need to re-register for a new code

### Q: What happens when an Agent goes offline?

**A**:

1. **Heartbeat timeout** (default 10 minutes):
   - Gateway marks Agent as offline
   - Data in Redis automatically expires

2. **Auto-reconnect** (if enabled):
   - Agent attempts to reconnect
   - Exponential backoff retry

3. **Mobile device**:
   - Receives disconnection notification (WebSocket)
   - Needs to re-pair

## Troubleshooting

### Q: Gateway startup error: "Redis connection refused"

**A**:

**Cause**: Redis is not running or unreachable

**Solution**:

```bash
# 1. Check Redis status
redis-cli ping

# 2. Start Redis
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Docker
docker-compose up -d redis

# 3. Verify connection
redis-cli ping  # Should return PONG
```

### Q: Pairing failed: "Invalid or expired pairing code"

**A**:

**Possible Causes**:

1. **Pairing code expired**:
   - Codes expire after 5 minutes
   - Re-register to get a new code

2. **Pairing code already used**:
   - Codes are one-time use
   - Re-register to get a new code

3. **Pairing code entered incorrectly**:
   - Check for typos
   - Note the difference between 0 and O, 1 and l

**Solution**:

```bash
# Re-register Agent
cd packages/agent
pnpm run dev register -g http://localhost:3000 -p 8080
```

### Q: Agent heartbeat failed

**A**:

**Troubleshooting Steps**:

```bash
# 1. Check if Gateway is running
curl http://localhost:3000/health

# 2. Verify Agent ID is correct
pnpm run dev status

# 3. Check network connectivity
ping gateway.yourdomain.com

# 4. View detailed logs
DEBUG=* pnpm run dev heartbeat -i agent-abc123
```

**Common Causes**:

- Agent ID doesn't exist or has expired
- Gateway unreachable
- Redis connection failed
- Firewall blocking

## Deployment Issues

### Q: How to update to the latest version?

**A**:

```bash
# 1. Backup configuration
cp .env .env.backup

# 2. Pull latest code
git pull origin master

# 3. Update dependencies
pnpm install

# 4. Rebuild
pnpm run build

# 5. Restart service
pm2 restart linkgate-gateway

# 6. Verify
curl http://localhost:3000/health
```

### Q: How to achieve zero-downtime deployment?

**A**:

**Using PM2**:

```bash
# Zero-downtime reload
pm2 reload linkgate-gateway
```

**Using Kubernetes**:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

## Other Questions

### Q: Is LinkGate open source?

**A**: Yes, LinkGate is open-sourced under the MIT License.

- GitHub: https://github.com/7788ken/linkgate
- License: MIT
- Commercial use: ✅
- Modification: ✅

### Q: How to contribute code?

**A**:

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

See [Contributing Guide](https://github.com/7788ken/linkgate/blob/master/CONTRIBUTING.md)

### Q: Where to report security vulnerabilities?

**A**:

Please **DO NOT** report security vulnerabilities in public Issues.

Send email to: security@linkgate.example.com

We will respond within 48 hours.

---

## Can't find your answer?

If your question isn't answered here:

1. 📖 Check the [complete documentation](/guide/)
2. 💬 Ask in [GitHub Discussions](https://github.com/7788ken/linkgate/discussions)
3. 🐛 Report in [GitHub Issues](https://github.com/7788ken/linkgate/issues)
4. 📧 Email support@linkgate.example.com
