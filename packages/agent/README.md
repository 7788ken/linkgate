# @linkgate/agent

> LinkGate Agent Client - CLI tool for agent registration

## Installation

```bash
pnpm install
```

## Usage

### Register Agent

```bash
# Using npx (after build)
npx linkgate register \
  --gateway https://gateway.example.com \
  --port 8080 \
  --name "MyHomePC" \
  --ttl 300

# Or run directly
pnpm run dev register \
  --gateway http://localhost:3000 \
  --port 8080
```

### Check Status

```bash
linkgate status \
  --gateway https://gateway.example.com \
  --agent-id <your-agent-id>
```

### Send Heartbeat

```bash
linkgate heartbeat \
  --gateway https://gateway.example.com \
  --agent-id <your-agent-id>
```

### Unregister Agent

```bash
linkgate unregister \
  --gateway https://gateway.example.com \
  --agent-id <your-agent-id>
```

## Options

### register

| Option | Required | Description |
|--------|----------|-------------|
| `-g, --gateway <url>` | Yes | Gateway URL |
| `-p, --port <number>` | Yes | Local listening port |
| `-n, --name <name>` | No | Agent name (default: hostname) |
| `-t, --ttl <seconds>` | No | Registration TTL (default: 300) |
| `-c, --capabilities <items>` | No | Comma-separated capabilities (default: file-transfer,remote-shell) |

### status / heartbeat / unregister

| Option | Required | Description |
|--------|----------|-------------|
| `-g, --gateway <url>` | Yes | Gateway URL |
| `-a, --agent-id <id>` | Yes | Agent ID |

## Development

```bash
# Development mode
pnpm run dev -- --help

# Build
pnpm run build

# Test
pnpm test
```

## License

MIT
