import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { StorageService, WebSocketManager } from './services';
import { registerRoutes, registerWebSocketRoutes } from './api';

/**
 * Create and configure Fastify server
 */
export async function createServer() {
  const isTest = process.env.NODE_ENV === 'test';

  const fastify = Fastify({
    logger: isTest
      ? false // Disable logging in tests
      : {
          level: process.env.LOG_LEVEL || 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
  });

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Register WebSocket
  await fastify.register(websocket);

  // Initialize services
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const storage = new StorageService(redisUrl);
  const wsManager = new WebSocketManager();

  // Register API routes
  await registerRoutes(fastify, storage);

  // Register WebSocket routes
  await registerWebSocketRoutes(fastify, wsManager);

  // Periodic cleanup of stale WebSocket connections
  setInterval(() => {
    const cleaned = wsManager.cleanupStaleConnections();
    if (cleaned > 0) {
      fastify.log.info(`Cleaned up ${cleaned} stale WebSocket connections`);
    }
  }, 60000); // Every minute

  // Graceful shutdown
  const closeSignals = ['SIGINT', 'SIGTERM'];
  closeSignals.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, closing server...`);
      await storage.close();
      await fastify.close();
      process.exit(0);
    });
  });

  return fastify;
}

/**
 * Start server
 */
export async function startServer() {
  const fastify = await createServer();

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    fastify.log.info(`Gateway server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
