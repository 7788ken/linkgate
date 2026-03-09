# LinkGate

> Lightweight, Ephemeral Device Pairing Signaling Service

**[English](./docs/en/README.md)** | **[中文](./docs/zh/README.md)** | **[Documentation](https://7788ken.github.io/linkgate/)**

## Overview

LinkGate is a public-benefit device pairing gateway system designed for secure pairing connections between local computer/server Agents and mobile terminal APPs.

### Key Features

- ✅ **Ephemeral**: Temporary information is automatically deleted after pairing
- ✅ **Public Benefit**: Free and open source with low resource consumption
- ✅ **Auto-Reconnect**: Agents automatically re-register after disconnection
- ✅ **Easy to Use**: Zero configuration, start with a single command
- ✅ **Privacy First**: No persistent sensitive data, burn after pairing

## Quick Start

👉 **[5-Minute Quick Start Guide](./QUICKSTART.md)**

### 1. Install Dependencies

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Start Services

```bash
# Start Redis
docker-compose up -d redis

# Start Gateway (new terminal)
cd packages/gateway && pnpm run dev

# Register Agent (new terminal)
cd packages/agent && pnpm run dev register -g http://localhost:3000 -p 8080
```

### 3. Pairing Connection

After obtaining the pairing code, use API or SDK for pairing:

```bash
curl -X POST http://localhost:3000/api/pair \
  -H "Content-Type: application/json" \
  -d '{"pairing_code":"847291","device_id":"mobile-123"}'
```

## Documentation

- **[Official Website](https://7788ken.github.io/linkgate/)** - Complete documentation
- [English Documentation](./docs/en/README.md) - Full docs in English
- [中文文档](./docs/zh/README.md) - 完整中文文档
- [API Reference](https://7788ken.github.io/linkgate/guide/api.html) - API documentation
- [Deployment Guide](https://7788ken.github.io/linkgate/guide/deployment.html) - Production deployment

## Project Status

✅ **MVP Complete** - Gateway API and Agent CLI are production-ready

### Implemented Features

- ✅ Gateway HTTP API (register/pair/heartbeat/health check)
- ✅ Redis temporary storage (TTL auto-expiration)
- ✅ Agent CLI tool (register/heartbeat/status/unregister)
- ✅ Pairing code mechanism (6-digit, one-time use)
- ✅ Unit test framework
- ✅ Docker deployment configuration
- ✅ Monorepo architecture (pnpm workspaces)
- ✅ WebSocket real-time communication
- ✅ QR code generation

## Roadmap

### Phase 1: MVP ✅ (Completed)
- Basic HTTP API
- Redis temporary storage
- Agent CLI tool

### Phase 2: Enhanced Features ✅ (Completed)
- WebSocket real-time communication
- Heartbeat mechanism
- QR code support

### Phase 3: P2P Optimization (Planned)
- NAT traversal
- STUN/TURN integration
- E2EE encryption

See [Implementation Plan](./docs/en/README.md#implementation-plan) for details

## Tech Stack

### Current Implementation

- **Runtime**: Node.js 18+ (LTS)
- **Language**: TypeScript 5.x
- **Framework**: Fastify 4.x (High-performance HTTP server)
- **Database**: Redis (temporary storage, TTL auto-expiration)
- **Package Manager**: pnpm workspaces
- **Testing**: Jest + Supertest
- **Code Standards**: ESLint + Prettier
- **Deployment**: Docker + Docker Compose

### Directory Structure

```
linkgate/
├── packages/
│   ├── gateway/     # Gateway server (Fastify + Redis)
│   ├── agent/       # Agent CLI client
│   └── website/     # Official documentation website
├── docs/            # Documentation (en/zh)
└── docker/          # Docker configuration
```

## Contributing

Community contributions are welcome!

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Contact

- **GitHub**: https://github.com/7788ken/linkgate
- **Issues**: https://github.com/7788ken/linkgate/issues
- **Discussions**: https://github.com/7788ken/linkgate/discussions

## Acknowledgments

This project is inspired by the following open-source projects:

- [Tailscale](https://tailscale.com)
- [FRP](https://github.com/fatedier/frp)
- [OpenClaw](https://docs.openclaw.ai)
- [Octelium](https://octelium.com)

---

**[Documentation](https://7788ken.github.io/linkgate/)** | **[GitHub](https://github.com/7788ken/linkgate)** | **[NPM](https://www.npmjs.com/package/linkgate)**
