import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { StorageService } from './services';
import { registerRoutes } from './api';

/**
 * Create and configure Fastify server
 */
export async function createServer() {
  const fastify = Fastify({
    logger: {
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

  // Initialize storage service
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const storage = new StorageService(redisUrl);

  // Register API routes
  await registerRoutes(fastify, storage);

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
