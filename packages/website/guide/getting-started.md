# Quick Start

This guide will help you get started with LinkGate in 5 minutes.

## Prerequisites

- Node.js 18+ (LTS version recommended)
- pnpm 8+
- Redis server (for temporary storage)
- Docker (optional, for local Redis)

## Installation Steps

### 1. Clone the Project

```bash
git clone https://github.com/7788ken/linkgate.git
cd linkgate
```

### 2. Install Dependencies

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Start Redis

Start Redis using Docker:

```bash
docker-compose up -d redis
```

Or use local Redis:

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. Start Gateway

```bash
# Navigate to gateway directory
cd packages/gateway

# Start development server
pnpm run dev
```

Gateway will start at `http://localhost:3000`.

### 5. Register Agent

In a new terminal window:

```bash
# Navigate to agent directory
cd packages/agent

# Register Agent (connect to local Gateway, listen on port 8080)
pnpm run dev register -g http://localhost:3000 -p 8080
```

You will see output like:

```
✓ Agent registered successfully
Pairing code: 847291
Valid for: 5 minutes

Use this pairing code on your mobile device to complete pairing
```

### 6. Pairing Connection

Use the HTTP API to pair:

```bash
curl -X POST http://localhost:3000/api/pair \
  -H "Content-Type: application/json" \
  -d '{"pairing_code":"847291","device_id":"mobile-123"}'
```

Success response:

```json
{
  "success": true,
  "data": {
    "agent_id": "agent-abc123",
    "endpoint": "http://localhost:8080",
    "message": "Pairing successful"
  }
}
```

## Verify Installation

### Check Gateway Status

```bash
curl http://localhost:3000/health
```

### Check Agent Status

```bash
cd packages/agent
pnpm run dev status
```

## Next Steps

- 📖 [Installation Guide](/guide/installation) - Production deployment
- 🔧 [Agent Configuration](/guide/agent) - Detailed Agent configuration
- 🌐 [Gateway API](/guide/api) - Complete API documentation
- 🚀 [Deployment Guide](/guide/deployment) - Deploy to production

## Common Issues

### Redis Connection Failed

Ensure Redis is running:

```bash
# Check Redis status
redis-cli ping
# Should return: PONG
```

### Port Already in Use

Change Gateway port:

```bash
PORT=3001 pnpm run dev
```

### Pairing Code Expired

Pairing codes expire after 5 minutes by default. Re-register to get a new code.

## Getting Help

Having issues? Join the community:

- [GitHub Discussions](https://github.com/7788ken/linkgate/discussions)
- [Issue Tracker](https://github.com/7788ken/linkgate/issues)
