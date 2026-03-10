import { createServer } from '../src';
import { FastifyInstance } from 'fastify';

// Mock ioredis with inline class definition to avoid hoisting issues
jest.mock('ioredis', () => {
  class MockRedis {
    private store: Map<string, { value: string; expireAt?: number }>;

    constructor() {
      this.store = new Map();
    }

    async get(key: string): Promise<string | null> {
      const item = this.store.get(key);
      if (!item) return null;

      if (item.expireAt && Date.now() > item.expireAt) {
        this.store.delete(key);
        return null;
      }

      return item.value;
    }

    async set(key: string, value: string): Promise<'OK'> {
      this.store.set(key, { value });
      return 'OK';
    }

    async setex(key: string, seconds: number, value: string): Promise<'OK'> {
      const expireAt = Date.now() + seconds * 1000;
      this.store.set(key, { value, expireAt });
      return 'OK';
    }

    async del(key: string): Promise<number> {
      const existed = this.store.has(key);
      this.store.delete(key);
      return existed ? 1 : 0;
    }

    async quit(): Promise<'OK'> {
      this.store.clear();
      return 'OK';
    }
  }

  return {
    __esModule: true,
    default: MockRedis,
  };
});

describe('Integration Tests', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await createServer();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('Complete Pairing Flow', () => {
    it('should complete full registration and pairing flow', async () => {
      // Step 1: Register agent
      const regResponse = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          public_ip: '1.2.3.4',
          local_ip: '192.168.1.100',
          port: 8080,
          ttl: 300,
          capabilities: ['file-transfer', 'remote-shell'],
        },
      });

      expect(regResponse.statusCode).toBe(201);
      const { agent_id, pairing_code } = JSON.parse(regResponse.payload);

      // Step 2: Send heartbeat
      const heartbeatResponse = await fastify.inject({
        method: 'POST',
        url: `/api/heartbeat/${agent_id}`,
      });

      expect(heartbeatResponse.statusCode).toBe(200);

      // Step 3: Pair device
      const pairResponse = await fastify.inject({
        method: 'POST',
        url: '/api/pair',
        payload: {
          pairing_code,
          device_id: 'mobile-device-123',
          device_name: 'My Phone',
        },
      });

      expect(pairResponse.statusCode).toBe(200);
      const pairBody = JSON.parse(pairResponse.payload);
      expect(pairBody.success).toBe(true);
      expect(pairBody.agent_info).toEqual({
        public_ip: '1.2.3.4',
        local_ip: '192.168.1.100',
        port: 8080,
        capabilities: ['file-transfer', 'remote-shell'],
      });

      // Step 4: Verify one-time use
      const pairAgainResponse = await fastify.inject({
        method: 'POST',
        url: '/api/pair',
        payload: {
          pairing_code,
          device_id: 'mobile-device-456',
        },
      });

      expect(pairAgainResponse.statusCode).toBe(404);
    });

    it('should handle agent deletion', async () => {
      // Register agent
      const regResponse = await fastify.inject({
        method: 'POST',
        url: '/api/register',
        payload: {
          port: 8080,
          ttl: 300,
          capabilities: [],
        },
      });

      const { agent_id, pairing_code } = JSON.parse(regResponse.payload);

      // Delete agent
      const delResponse = await fastify.inject({
        method: 'DELETE',
        url: `/api/agent/${agent_id}`,
      });

      expect(delResponse.statusCode).toBe(200);

      // Verify heartbeat fails
      const heartbeatResponse = await fastify.inject({
        method: 'POST',
        url: `/api/heartbeat/${agent_id}`,
      });

      expect(heartbeatResponse.statusCode).toBe(404);

      // Verify pairing fails
      const pairResponse = await fastify.inject({
        method: 'POST',
        url: '/api/pair',
        payload: {
          pairing_code,
          device_id: 'test-device',
        },
      });

      expect(pairResponse.statusCode).toBe(404);
    });
  });
});
