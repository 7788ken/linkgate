# Project Structure Planning

This document describes the expected directory structure of the LinkGate project.

## Complete Directory Structure

```
linkgate/
├── docs/                      # Documentation
│   ├── en/                    # English docs
│   │   ├── README.md         # Full English docs
│   │   ├── ARCHITECTURE.md   # Architecture design (TODO)
│   │   ├── API.md            # API documentation (TODO)
│   │   └── DEPLOYMENT.md     # Deployment guide (TODO)
│   └── zh/                    # Chinese docs
│       ├── README.md         # Full Chinese docs
│       ├── ARCHITECTURE.md   # Architecture design (TODO)
│       ├── API.md            # API documentation (TODO)
│       └── DEPLOYMENT.md     # Deployment guide (TODO)
│
├── packages/                  # Monorepo packages
│   ├── gateway/              # Gateway server
│   │   ├── src/
│   │   │   ├── api/          # API routes
│   │   │   ├── services/     # Business logic
│   │   │   ├── models/       # Data models
│   │   │   ├── middleware/   # Middleware
│   │   │   └── index.ts      # Entry point
│   │   ├── tests/            # Test files
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── agent/                # Agent client
│   │   ├── src/
│   │   │   ├── client.ts     # Client core
│   │   │   ├── register.ts   # Registration logic
│   │   │   ├── heartbeat.ts  # Heartbeat logic
│   │   │   └── index.ts      # CLI entry
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── sdk/                  # SDK (mobile/web)
│       ├── src/
│       │   ├── pairing.ts    # Pairing logic
│       │   ├── connection.ts # Connection management
│       │   └── index.ts      # SDK entry
│       ├── tests/
│       ├── package.json
│       └── README.md
│
├── apps/                      # Applications
│   ├── web-admin/            # Web admin interface (optional)
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── mobile-app/           # Mobile demo app (optional)
│       ├── src/
│       └── package.json
│
├── docker/                    # Docker files
│   ├── gateway.Dockerfile    # Gateway image
│   ├── agent.Dockerfile      # Agent image
│   └── docker-compose.yml    # Local dev environment
│
├── scripts/                   # Utility scripts
│   ├── setup.sh              # Project initialization
│   └── deploy.sh             # Deployment script
│
├── .gitignore                # Git ignore config
├── README.md                 # Project readme
├── LICENSE                   # License (TODO)
└── package.json              # Monorepo root config (if using pnpm workspaces)
```

## Phased Directory Structure

### Phase 1: MVP (Current)

```
linkgate/
├── docs/
│   ├── en/README.md
│   └── zh/README.md
├── packages/
│   ├── gateway/              # HTTP API + Redis
│   └── agent/                # CLI tool
├── .gitignore
└── README.md
```

### Phase 2: Enhanced Features

```
linkgate/
├── docs/
│   ├── en/ (full docs)
│   └── zh/ (full docs)
├── packages/
│   ├── gateway/              # + WebSocket
│   ├── agent/                # + Heartbeat
│   └── sdk/                  # New SDK
├── apps/
│   └── web-admin/            # New admin UI
└── docker/
    └── docker-compose.yml
```

### Phase 3: P2P Optimization

```
linkgate/
├── (previous structure)
├── packages/
│   ├── gateway/              # + STUN/TURN support
│   ├── agent/                # + NAT traversal
│   ├── sdk/                  # + WebRTC support
│   └── relay/                # New relay server (optional)
└── apps/
    └── mobile-app/           # New mobile demo
```

## Core Module Descriptions

### 1. Gateway (Server)

- **Responsibility**: Handle agent registration, pairing verification, info exchange
- **Tech**: Node.js + Express/Fastify + Redis
- **Key Files**:
  - `src/api/register.ts`: Agent registration API
  - `src/api/pair.ts`: Pairing verification API
  - `src/services/heartbeat.ts`: Heartbeat detection service
  - `src/services/cleanup.ts`: Expired data cleanup

### 2. Agent (Client)

- **Responsibility**: Register with gateway, maintain heartbeat, accept connections
- **Tech**: Node.js CLI or Go/Rust binary
- **Key Files**:
  - `src/client.ts`: Gateway client
  - `src/register.ts`: Registration logic
  - `src/heartbeat.ts`: Heartbeat maintenance
  - `src/server.ts`: Local server (accept connections)

### 3. SDK (Mobile/Web)

- **Responsibility**: Pairing code input, QR code scanning, connection establishment
- **Tech**: TypeScript/JavaScript
- **Key Files**:
  - `src/pairing.ts`: Pairing logic
  - `src/connection.ts`: P2P connection management
  - `src/webrtc.ts`: WebRTC support (Phase 3)

## Technology Recommendations

### Monorepo Tools

- **pnpm workspaces** (recommended): Efficient, saves disk space
- **Turborepo**: Build optimization
- **Nx**: Enterprise-grade monorepo tool

### Package Managers

- **pnpm** (recommended): Fast, space-efficient
- **yarn**: Classic choice
- **npm**: Built into Node.js

### Testing Frameworks

- **Jest**: Unit tests
- **Supertest**: API tests
- **Playwright**: E2E tests

## Next Steps

1. Initialize monorepo structure
2. Create `packages/gateway` base code
3. Create `packages/agent` CLI tool
4. Write API documentation
5. Write unit tests
