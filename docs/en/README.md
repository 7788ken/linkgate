# LinkGate - Public Device Pairing Gateway

> Lightweight, one-time device pairing signaling service

## Overview

LinkGate is a public-interest device pairing gateway system designed for secure pairing between local computer/server agents and mobile terminal apps.

### Core Features

- ✅ **Ephemeral**: Gateway auto-deletes temporary info after pairing
- ✅ **Public Service**: Free, low resource consumption
- ✅ **Auto-Reconnect**: Agent auto-re-registers on disconnection
- ✅ **Zero Config**: One command to start, no configuration needed
- ✅ **Privacy First**: No persistent sensitive data, burn after pairing

## Workflow

```
┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│  Local      │───────▶│   Gateway    │◀───────│   Mobile    │
│  Agent      │        │   Server     │        │   APP       │
└─────────────┘        └──────────────┘        └─────────────┘
     │                        │                        │
     │ 1. Register            │                        │
     │   {agent_id,           │                        │
     │    public_ip,          │                        │
     │    port,               │                        │
     │    timestamp}          │                        │
     ├───────────────────────▶│                        │
     │                        │                        │
     │                        │ 2. Verify              │
     │                        │   {pairing_code,       │
     │                        │    agent_id}           │
     │                        │◀───────────────────────┤
     │                        │                        │
     │                        │ 3. Return              │
     │                        │   agent_info           │
     │                        ├───────────────────────▶│
     │                        │                        │
     │ 4. Direct Connection (P2P or via relay)         │
     │◀───────────────────────────────────────────────▶│
     │                        │                        │
     │                        │ 5. Cleanup             │
     │                        │   (delete temp data)   │
     │                        ├───────────────────────▶│
```

### Detailed Steps

1. **Agent Registration**: Local agent registers handshake info with gateway, receives pairing code
2. **Terminal Verification**: Mobile app submits pairing code for verification
3. **Info Exchange**: Gateway returns agent connection info upon successful verification
4. **Establish Connection**: Terminal establishes direct P2P or relay connection with agent
5. **Data Cleanup**: Gateway deletes temporary pairing information

## Similar Projects Comparison

### 1. P2P Network Traversal
- **Tailscale + Headscale**: WireGuard-based P2P VPN with NAT traversal
- **ZeroTier**: Decentralized Layer 2 network
- **FRP (Fast Reverse Proxy)**: Open source reverse proxy supporting TCP/UDP port forwarding

### 2. WebRTC Signaling Servers
- **Simple WebRTC Signaling Server**: Node.js + Socket.IO implementation
- **STUN/TURN Servers**: For NAT traversal and media relay

### 3. Device Pairing Authentication
- **OpenClaw**: AI gateway project using QR codes for device pairing
- Supports local device pairing and auto-approval

### 4. Cloudflare Tunnel Alternatives
- **Octelium**: Complete self-hosted remote access solution
- **Pangolin**: WireGuard + Traefik based access platform

## LinkGate's Differentiation

| Feature | LinkGate | Tailscale | FRP | OpenClaw |
|---------|----------|-----------|-----|----------|
| Data cleanup after pairing | ✅ | ❌ | ❌ | ❌ |
| Zero config startup | ✅ | ✅ | ❌ | ❌ |
| Free public service | ✅ | Commercial | Open source | Open source |
| One-time pairing code | ✅ | ❌ | ❌ | ✅ |
| QR code support | ✅ | ❌ | ❌ | ✅ |
| Auto-reconnect | ✅ | ✅ | ❌ | ✅ |
| Lightweight | ✅ | ❌ | ✅ | ❌ |

## Core Module Design

### 1. Agent Registration Module

```typescript
interface AgentRegistration {
  agent_id: string;        // UUID v4
  public_ip?: string;      // Auto-detect or STUN discovery
  local_ip?: string;       // LAN IP (optional)
  port: number;
  pairing_code: string;    // 6-digit or short code
  capabilities: string[];  // Supported features
  timestamp: number;
  ttl: number;             // Expiration time (e.g., 5 minutes)
}
```

### 2. Terminal Verification Module

```typescript
interface PairingRequest {
  pairing_code: string;    // User input
  device_id: string;       // Device identifier
  device_name?: string;
}

interface PairingResponse {
  success: boolean;
  agent_info?: {
    public_ip?: string;
    local_ip?: string;
    port: number;
    capabilities: string[];
  };
  relay_server?: string;   // If relay needed
}
```

### 3. Heartbeat & Reconnection Mechanism

```typescript
// Agent side
setInterval(async () => {
  await gateway.heartbeat(agent_id);
}, 30000); // Every 30 seconds

// Gateway side
if (Date.now() - last_heartbeat > 60000) {
  deleteRegistration(agent_id); // Mark as offline
}
```

## Technology Stack Options

### Option A: Lightweight (Recommended for Start)

**Stack**:
- **Backend**: Node.js + Express/Fastify
- **Communication**: WebSocket (Socket.IO)
- **Database**: Redis (temporary storage, TTL auto-expiration)
- **Deployment**: Docker + Nginx

**Pros**:
- Rapid development
- Low resource footprint
- Suitable for public service (low-cost servers)

**Use Case**: MVP quick validation, small-scale users

---

### Option B: Enterprise Grade

**Stack**:
- **Backend**: Go (Gin) or Rust (Actix-web)
- **Communication**: gRPC + WebSocket
- **Database**: PostgreSQL + Redis
- **Message Queue**: NATS (optional)

**Pros**:
- High performance
- Type safety
- Better concurrency handling

**Use Case**: Large-scale production, high concurrency scenarios

---

### Option C: P2P First

**Stack**:
- **WebRTC-based**: Reuse existing STUN/TURN servers
- **Signaling**: Custom lightweight protocol
- **NAT Traversal**: Use public STUN servers

**Pros**:
- True P2P connections
- Reduced server load
- Low latency

**Use Case**: Real-time communication apps, latency-sensitive

## Implementation Plan

### Phase 1: MVP (2-3 weeks)

- [ ] Basic HTTP API (register/verify/query)
- [ ] Redis temporary storage
- [ ] Simple pairing code generation
- [ ] Agent CLI tool
- [ ] Basic documentation

**Deliverable**: Runnable minimum viable version

---

### Phase 2: Enhanced Features (2-4 weeks)

- [ ] WebSocket real-time communication
- [ ] Heartbeat mechanism
- [ ] Web management interface
- [ ] Pairing code QR support
- [ ] Multiple pairing methods (code/QR/NFC)

**Deliverable**: Feature-complete beta version

---

### Phase 3: P2P Optimization (1-2 months)

- [ ] NAT traversal detection
- [ ] STUN/TURN integration
- [ ] Relay server (optional)
- [ ] Encrypted communication (E2EE)

**Deliverable**: Production version with direct connection support

---

### Phase 4: Operations & Optimization

- [ ] Monitoring & logging
- [ ] Load balancing
- [ ] Security audit
- [ ] Community documentation

**Deliverable**: Sustainable public service

## Innovations

1. **One-time Pairing Code**: 5-minute validity, immediately invalid after use
2. **QR Code Convenience**: Scan to pair, no manual input needed
3. **Smart Reconnection**: Agent auto-updates registration on network changes
4. **Zero Configuration**: No config files needed, one command to start
5. **Privacy First**: Gateway immediately deletes data after successful pairing

## Security Considerations

### 1. Anti-Abuse Mechanisms

- IP rate limiting: Max 10 requests per minute per IP
- Pairing code attempt limits: Max 5 wrong attempts per code
- Agent registration frequency limits: Max 3 registrations per minute per agent

### 2. Data Encryption

- Transport layer: Enforce HTTPS (TLS 1.3+)
- Optional end-to-end encryption (E2EE): Using X25519 key exchange

### 3. Authentication

- Agent uses Ed25519 signature verification to prevent spoofing
- Pairing code uses cryptographically secure random number generator (CSPRNG)

### 4. Audit Logs

- Record pairing activities (time, IP, device type)
- **Do NOT store** sensitive information (real IPs, device IDs, etc.)

## Quick Start

### Gateway Server Deployment

```bash
# Deploy with Docker
docker run -d \
  -p 3000:3000 \
  -e REDIS_URL=redis://localhost:6379 \
  -e JWT_SECRET=your-secret \
  linkgate/gateway:latest
```

### Agent Client Usage

```bash
# One-click registration
curl -X POST https://gateway.example.com/register \
  -H "Content-Type: application/json" \
  -d '{"port": 8080, "name": "MyHomePC"}'

# Returns pairing code: 847291
```

### Mobile App Integration

```typescript
// User inputs pairing code
const result = await gateway.pair('847291');

// Get agent info and establish connection
await connectToAgent(result.agent_info);
```

## References

- [Simple WebRTC Signaling Server](https://github.com/aljanabim/simple_webrtc_signaling_server)
- [WebRTC Signaling Server Guide - Ant Media](https://antmedia.io/webrtc-signaling-servers-everything-you-need-to-know/)
- [NAT Traversal with STUN/TURN - Cisco](https://community.cisco.com/t5/collaboration-knowledge-base/demystifying-nat-traversal-with-stun-turn-and-ice/ta-p/4766853)
- [Tailscale vs ngrok Comparison](https://tailscale.com/compare/ngrok)
- [FRP - Fast Reverse Proxy](https://libhunt.com/compare-frp-vs-tailscale)
- [OpenClaw Device Pairing](https://docs.openclaw.ai)
- [Octelium - Cloudflare Tunnel Alternative](https://octelium.com)
- [Pangolin - Self-hosted Access Platform](https://github.com/fosrl/pangolin)
- [Awesome Tunneling - GitHub](https://github.com/anderspitman/awesome-tunneling)

## License

TBD (Recommend MIT or Apache 2.0)

## Contributing

Community contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md)

## Contact

- Project Home: https://github.com/linkgate/linkgate
- Issue Tracker: https://github.com/linkgate/linkgate/issues
