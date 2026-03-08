import { createServer } from '../src';
import { FastifyInstance } from 'fastify';

describe('Gateway API', () => {
  let fastify: FastifyInstance;

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
    it('should register a new agent with minimal data', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          port: 8080,
          ttl: 300,
          capabilities: [],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('agent_id');
      expect(body).toHaveProperty('pairing_code');
      expect(body.pairing_code).toMatch(/^\d{6}$/);
      expect(body.expires_in).toBe(300);
    });

    it('should register agent with all fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          public_ip: '1.2.3.4',
          local_ip: '192.168.1.100',
          port: 8080,
          ttl: 600,
          capabilities: ['file-transfer', 'remote-shell'],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
    });

    it('should return 400 for missing port', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          ttl: 300,
          capabilities: [],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Missing required fields');
    });

    it('should return 400 for missing ttl', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          port: 8080,
          capabilities: [],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('should return 400 for empty payload', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle multiple registrations', async () => {
      const responses = await Promise.all([
        fastify.inject({
          method: 'POST',
          url: '/api/register',
          payload: { port: 8080, ttl: 300, capabilities: [] },
        }),
        fastify.inject({
          method: 'POST',
          url: '/api/register',
          payload: { port: 8081, ttl: 300, capabilities: [] },
        }),
        fastify.inject({
          method: 'POST',
          url: '/api/register',
          payload: { port: 8082, ttl: 300, capabilities: [] },
        }),
      ]);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
      });

      // All pairing codes should be unique
      const codes = responses.map((r) => JSON.parse(r.payload).pairing_code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
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
