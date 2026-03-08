# Changelog

All notable changes to LinkGate will be documented in this file.

## [0.2.0] - 2026-03-08

### Added

#### WebSocket Real-time Communication
- WebSocket endpoint (`/ws`) for real-time communication
- Connection manager with agent/device support
- Real-time pairing status notifications
- Automatic stale connection cleanup (60s threshold)
- Ping/pong heartbeat mechanism
- WebSocket statistics endpoint (`/api/ws/stats`)

#### QR Code Pairing
- QR code generation endpoints
  - `GET /api/qrcode/:pairing_code` - Data URL format
  - `GET /api/qrcode/:pairing_code/image` - PNG image format
- Embedded gateway URL and pairing code in QR data
- Mobile-friendly scanning support

#### Testing
- Comprehensive test suite (70+ test cases)
- Mock Redis for unit testing
- Integration tests for complete flows
- API endpoint testing
- Edge case coverage
- Target: 80%+ code coverage

### Changed
- Added `@fastify/websocket` dependency
- Added `qrcode` dependency
- Enhanced storage service with better error handling
- Improved API validation and error messages

### Technical Details
- TypeScript strict mode
- Fastify 4.x framework
- Redis 7.x for storage
- Jest testing framework
- Docker deployment support

## [0.1.0] - 2026-03-08

### Added
- Initial MVP release
- Gateway HTTP API server
  - `POST /api/register` - Agent registration
  - `POST /api/pair` - Device pairing verification
  - `POST /api/heartbeat/:agent_id` - Heartbeat update
  - `DELETE /api/agent/:agent_id` - Agent deletion
  - `GET /api/health` - Health check
- Agent CLI client
  - `linkgate register` - Register to gateway
  - `linkgate heartbeat` - Send heartbeat
  - `linkgate status` - Check status
  - `linkgate unregister` - Unregister agent
- Redis storage with TTL auto-expiration
- 6-digit pairing code generation (CSPRNG)
- One-time pairing code usage
- IP rate limiting (100 req/min)
- CORS support
- Structured logging (Pino)
- Graceful shutdown
- Docker + Docker Compose deployment
- Monorepo architecture (pnpm workspaces)
- Complete documentation (Chinese + English)
- Quick start guide

### Security
- One-time pairing codes
- TTL-based expiration (default 5 minutes)
- IP rate limiting
- Input validation
- CORS configuration

### Documentation
- Comprehensive project planning docs
- API documentation
- Architecture design
- Deployment guide
- Quick start guide (5-minute setup)
- Project structure documentation

[0.2.0]: https://github.com/linkgate/linkgate/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/linkgate/linkgate/releases/tag/v0.1.0
