# Introduction

Welcome to LinkGate!

## What is LinkGate?

LinkGate is a **public-benefit** device pairing gateway system designed for secure pairing connections between local computer/server Agents and mobile terminal APPs.

### Key Features

- ✅ **Ephemeral**: Temporary information is automatically deleted after pairing
- ✅ **Public Benefit**: Free and open source, low resource consumption
- ✅ **Auto-Reconnect**: Agents automatically re-register after disconnection
- ✅ **Easy to Use**: Zero configuration, start with a single command
- ✅ **Privacy First**: No persistent sensitive data, burn after pairing

## Use Cases

### 1. Remote Access to Local Development

Expose local development servers to mobile devices for testing:

```bash
# 1. Start Agent
cd packages/agent && pnpm run dev register -g https://gateway.example.com -p 3000

# 2. Get pairing code
# Pairing code: 847291

# 3. Pair on mobile device
# Use the pairing code to complete connection
```

### 2. IoT Device Pairing

Provide secure pairing mechanism for smart home and industrial devices:

```typescript
// Device side
const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080
})

const code = await agent.register()
console.log('Pairing code:', code)
```

### 3. Temporary Collaboration Sessions

Create temporary peer-to-peer connections without exposing internal network:

- Remote desktop assistance
- File transfer
- Real-time collaboration tools

## Architecture Overview

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   Agent     │◄────────►│   Gateway    │◄────────►│  Mobile App │
│(Local Server)│ Register │(Signaling    │  Pair    │(Mobile Device)│
│             │          │   Server)    │          │             │
└─────────────┘          └──────────────┘          └─────────────┘
      ▲                         │                         ▲
      │                         ▼                         │
      │                   ┌──────────┐                    │
      └───────────────────┤  Redis   ├───────────────────┘
           Heartbeat      └──────────┘      Temporary
           Status           Storage
```

## Quick Navigation

- [Quick Start](/guide/getting-started) - Get started in 5 minutes
- [Installation Guide](/guide/installation) - Detailed installation steps
- [API Documentation](/guide/api) - Complete API reference
- [Architecture](/technical/architecture) - Technical architecture

## Community & Support

- 💬 [GitHub Discussions](https://github.com/7788ken/linkgate/discussions) - Q&A
- 🐛 [Issue Tracker](https://github.com/7788ken/linkgate/issues) - Bug reports
- 📖 [Documentation Repo](https://github.com/7788ken/linkgate) - Contribute

## License

LinkGate is open-sourced under the MIT License.
