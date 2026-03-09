# Architecture Design

This document introduces LinkGate's system architecture and technical design.

## System Architecture

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Internet                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Load Balancer │
                    │    (Nginx)     │
                    └───────┬────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
          ┌─────▼─────┐ ┌──▼──────┐ ┌──▼──────┐
          │ Gateway 1 │ │Gateway 2│ │Gateway 3│
          └─────┬─────┘ └──┬──────┘ └──┬──────┘
                │           │           │
                └───────────┼───────────┘
                            │
                    ┌───────▼────────┐
                    │  Redis Cluster │
                    │   (Master-Slave)│
                    └───────┬────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
          ┌─────▼─────┐           ┌────▼─────┐
          │  Agent 1  │           │ Agent 2  │
          │ (Intranet)│           │(Intranet)│
          └─────┬─────┘           └────┬─────┘
                │                       │
          ┌─────▼─────┐           ┌────▼─────┐
          │Local Apps │           │Dev Server│
          └───────────┘           └──────────┘
```

### Component Responsibilities

| Component | Responsibility | Tech Stack |
|-----------|---------------|------------|
| **Load Balancer** | SSL termination, load balancing, rate limiting | Nginx |
| **Gateway** | Pairing code management, Agent registration, heartbeat detection | Fastify + TypeScript |
| **Redis** | Temporary data storage, session management, distributed locks | Redis 7 |
| **Agent** | Local service proxy, heartbeat reporting, auto-reconnect | Node.js + TypeScript |

## Core Flows

### 1. Agent Registration Flow

```typescript
// Sequence diagram
Agent -> Gateway: POST /api/agent/register
    {
      agent_id: "agent-abc123",
      endpoint: "http://192.168.1.100:8080"
    }

Gateway -> Redis: Store Agent info
    SET agent:agent-abc123 {
      endpoint: "http://192.168.1.100:8080",
      status: "online",
      registered_at: timestamp
    }
    EXPIRE agent:agent-abc123 600

Gateway -> Redis: Generate pairing code
    SET pairing:847291 agent-abc123
    EXPIRE pairing:847291 300

Gateway -> Agent: Return pairing code
    {
      pairing_code: "847291",
      expires_at: "2026-03-09T00:05:00Z",
      ttl: 300
    }
```

### 2. Pairing Flow

```typescript
Mobile App -> Gateway: POST /api/pair
    {
      pairing_code: "847291",
      device_id: "mobile-123"
    }

Gateway -> Redis: Validate pairing code
    GET pairing:847291
    Return: agent-abc123

Gateway -> Redis: Get Agent info
    GET agent:agent-abc123
    Return: {
      endpoint: "http://192.168.1.100:8080",
      status: "online"
    }

Gateway -> Redis: Clean up pairing code (one-time use)
    DEL pairing:847291

Gateway -> Mobile App: Return Agent info
    {
      agent_id: "agent-abc123",
      endpoint: "http://192.168.1.100:8080"
    }

Mobile App -> Agent: Direct communication
    POST http://192.168.1.100:8080/api/data
```

### 3. Heartbeat Flow

```typescript
Agent -> Gateway: POST /api/agent/heartbeat
    {
      agent_id: "agent-abc123",
      status: { cpu: "45%", memory: "512MB" }
    }

Gateway -> Redis: Update Agent status
    HSET agent:agent-abc123 status "online"
    HSET agent:agent-abc123 last_heartbeat timestamp
    EXPIRE agent:agent-abc123 600

Gateway -> Agent: Return confirmation
    {
      success: true,
      next_heartbeat: 60
    }
```

## Data Model

### Redis Data Structures

#### Agent Information

```redis
# Hash - Agent basic information
agent:{agent_id}
  - agent_id: string
  - endpoint: string
  - status: "online" | "offline"
  - registered_at: timestamp
  - last_heartbeat: timestamp
  - metadata: json

# TTL: 600 seconds (10 minutes, auto-renewed by heartbeat)
```

#### Pairing Code Mapping

```redis
# String - Pairing code to Agent ID mapping
pairing:{code} = agent_id

# TTL: 300 seconds (5 minutes)
```

## Tech Stack

### Gateway - Fastify

**Selection Rationale:**

1. **High Performance**: 2x faster than Express
2. **Low Overhead**: Request processing time < 1ms
3. **TypeScript**: Native support, type-safe
4. **Plugin Ecosystem**: Rich plugin system

**Performance Comparison:**

```
Fastify:  76,835 req/sec
Express:  38,289 req/sec
Hapi:     31,825 req/sec
```

### Redis

**Selection Rationale:**

1. **In-memory Storage**: Pairing codes need fast access (< 1ms)
2. **TTL Support**: Native expiration time support
3. **Data Structures**: String, Hash, Set, etc.
4. **Atomic Operations**: Atomicity for pairing code validation
5. **Persistence**: RDB + AOF dual guarantee

### TypeScript

**Selection Rationale:**

1. **Type Safety**: Reduces runtime errors
2. **IDE Support**: Better code completion and refactoring
3. **Maintainability**: Easier to maintain large projects
4. **Ecosystem**: Native support in Node.js ecosystem

## Related Documentation

- [Tech Stack](/technical/stack) - Detailed technology selection explanation
- [Security Design](/technical/security) - Security mechanism details
- [API Documentation](/guide/api) - API interface documentation
