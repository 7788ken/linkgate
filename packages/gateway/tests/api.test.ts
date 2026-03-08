import { createServer } from '../src';
import Fastify from 'fastify';

describe('Gateway API', () => {
  let fastify: Fastify.FastifyInstance;

  beforeAll(async () => {
    fastify = await createServer();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        status: 'ok',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('POST /api/register', () => {
    it('should register a new agent', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          port: 8080,
          ttl: 300,
          capabilities: ['file-transfer'],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('agent_id');
      expect(body).toHaveProperty('pairing_code');
      expect(body.pairing_code).toMatch(/^\d{6}$/);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          // Missing port and ttl
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('POST /api/pair', () => {
    it('should fail for invalid pairing code', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/pair',
        payload: {
          pairing_code: '999999',
          device_id: 'test-device',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/pair',
        payload: {
          // Missing pairing_code and device_id
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
