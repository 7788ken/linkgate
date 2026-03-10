import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

/**
 * Configure endpoint-specific rate limiting
 */
export async function configureRateLimiting(fastify: FastifyInstance) {
  // Global rate limiting (fallback)
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    allowList: ['127.0.0.1'], // Allow localhost for development
    keyGenerator: (request) => request.ip,
  });
}

/**
 * Rate limit configuration for specific endpoints
 */
export const rateLimitConfigs = {
  // Registration: 5 per minute (prevent abuse)
  register: {
    max: 5,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many registration attempts. Please try again later.',
      retryAfter: 60,
    }),
  },

  // Pairing: 10 per minute (allow reasonable attempts)
  pair: {
    max: 10,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many pairing attempts. Please try again later.',
      retryAfter: 60,
    }),
  },

  // Heartbeat: 60 per minute (1 per second average)
  heartbeat: {
    max: 60,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Heartbeat rate limit exceeded.',
      retryAfter: 60,
    }),
  },
};
