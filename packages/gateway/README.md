# @linkgate/gateway

> LinkGate Gateway Server - Pairing signaling service

## Installation

```bash
pnpm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp ../../.env.example .env
```

## Development

```bash
# Start Redis
docker-compose up -d redis

# Run in development mode
pnpm run dev
```

## Usage

### Start Gateway Server

```bash
# Development
pnpm run dev

# Production
pnpm run build
pnpm start
```

### API Endpoints

#### POST /api/register - Register Agent

Request:
```json
{
  "public_ip": "1.2.3.4",
  "local_ip": "192.168.1.100",
  "port": 8080,
  "ttl": 300,
  "capabilities": ["file-transfer", "remote-shell"]
}
```

Response:
```json
{
  "success": true,
  "agent_id": "uuid-v4",
  "pairing_code": "847291",
  "expires_in": 300
}
```

#### POST /api/pair - Pair Device

Request:
```json
{
  "pairing_code": "847291",
  "device_id": "mobile-device-id",
  "device_name": "My iPhone"
}
```

Response:
```json
{
  "success": true,
  "agent_info": {
    "public_ip": "1.2.3.4",
    "local_ip": "192.168.1.100",
    "port": 8080,
    "capabilities": ["file-transfer", "remote-shell"]
  }
}
```

#### POST /api/heartbeat/:agent_id - Update Heartbeat

Response:
```json
{
  "success": true,
  "message": "Heartbeat updated"
}
```

#### GET /api/health - Health Check

Response:
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

## License

MIT
