import { StorageService } from '../src/services';
import { MockRedis } from './utils/mock-redis';

// Mock ioredis
jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: MockRedis,
  };
});

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    // Create new instance for each test
    storage = new StorageService('redis://mock');
  });

  afterEach(async () => {
    await storage.close();
  });

  describe('registerAgent', () => {
    it('should register a new agent and return agent_id and pairing_code', async () => {
      const data = {
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      };

      const result = await storage.registerAgent(data);

      expect(result).toHaveProperty('agent_id');
      expect(result).toHaveProperty('pairing_code');
      expect(result.pairing_code).toMatch(/^\d{6}$/);
      expect(result.agent_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique pairing codes', async () => {
      const results = await Promise.all([
        storage.registerAgent({ port: 8080, ttl: 300, capabilities: [] }),
        storage.registerAgent({ port: 8081, ttl: 300, capabilities: [] }),
        storage.registerAgent({ port: 8082, ttl: 300, capabilities: [] }),
      ]);

      const codes = results.map((r) => r.pairing_code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should register agent with all optional fields', async () => {
      const data = {
        public_ip: '1.2.3.4',
        local_ip: '192.168.1.100',
        port: 8080,
        ttl: 600,
        capabilities: ['file-transfer', 'remote-shell', 'screen-share'],
      };

      const result = await storage.registerAgent(data);
      const agent = await storage.getAgent(result.agent_id);

      expect(agent).not.toBeNull();
      expect(agent?.public_ip).toBe('1.2.3.4');
      expect(agent?.local_ip).toBe('192.168.1.100');
      expect(agent?.capabilities).toHaveLength(3);
    });

    it('should store agent with correct TTL', async () => {
      const data = {
        port: 8080,
        ttl: 300,
        capabilities: [],
      };

      const { agent_id } = await storage.registerAgent(data);
      const agent = await storage.getAgent(agent_id);

      expect(agent).not.toBeNull();
      expect(agent?.ttl).toBe(300);
    });
  });

  describe('getAgent', () => {
    it('should return agent data by ID', async () => {
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      const agent = await storage.getAgent(agent_id);

      expect(agent).not.toBeNull();
      expect(agent?.agent_id).toBe(agent_id);
      expect(agent?.port).toBe(8080);
    });

    it('should return null for non-existent agent', async () => {
      const agent = await storage.getAgent('non-existent-id');
      expect(agent).toBeNull();
    });

    it('should return agent with correct timestamp', async () => {
      const before = Date.now();
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: [],
      });
      const after = Date.now();

      const agent = await storage.getAgent(agent_id);

      expect(agent?.timestamp).toBeGreaterThanOrEqual(before);
      expect(agent?.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getAgentByPairingCode', () => {
    it('should return agent by pairing code', async () => {
      const { pairing_code, agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: [],
      });

      const agent = await storage.getAgentByPairingCode(pairing_code);

      expect(agent).not.toBeNull();
      expect(agent?.agent_id).toBe(agent_id);
    });

    it('should return null for invalid pairing code', async () => {
      const agent = await storage.getAgentByPairingCode('000000');
      expect(agent).toBeNull();
    });
  });

  describe('verifyPairing', () => {
    it('should successfully verify valid pairing code', async () => {
      const { pairing_code } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      const result = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device',
        device_name: 'Test Phone',
      });

      expect(result.success).toBe(true);
      expect(result.agent_info).toBeDefined();
      expect(result.agent_info?.port).toBe(8080);
      expect(result.agent_info?.capabilities).toContain('file-transfer');
    });

    it('should fail for invalid pairing code', async () => {
      const result = await storage.verifyPairing({
        pairing_code: '999999',
        device_id: 'test-device',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired pairing code');
    });

    it('should delete pairing code after successful verification (one-time use)', async () => {
      const { pairing_code } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      // First verification - should succeed
      const result1 = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device-1',
      });
      expect(result1.success).toBe(true);

      // Second verification - should fail
      const result2 = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device-2',
      });
      expect(result2.success).toBe(false);
    });

    it('should not return agent info on failure', async () => {
      const result = await storage.verifyPairing({
        pairing_code: '000000',
        device_id: 'test-device',
      });

      expect(result.success).toBe(false);
      expect(result.agent_info).toBeUndefined();
    });
  });

  describe('updateHeartbeat', () => {
    it('should update agent heartbeat', async () => {
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      const before = Date.now();
      const success = await storage.updateHeartbeat(agent_id);
      const after = Date.now();

      expect(success).toBe(true);

      const agent = await storage.getAgent(agent_id);
      expect(agent?.last_heartbeat).toBeDefined();
      expect(agent?.last_heartbeat).toBeGreaterThanOrEqual(before);
      expect(agent?.last_heartbeat).toBeLessThanOrEqual(after);
    });

    it('should return false for non-existent agent', async () => {
      const success = await storage.updateHeartbeat('non-existent-id');
      expect(success).toBe(false);
    });

    it('should update heartbeat timestamp multiple times', async () => {
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: [],
      });

      await storage.updateHeartbeat(agent_id);
      const agent1 = await storage.getAgent(agent_id);
      const heartbeat1 = agent1?.last_heartbeat;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      await storage.updateHeartbeat(agent_id);
      const agent2 = await storage.getAgent(agent_id);
      const heartbeat2 = agent2?.last_heartbeat;

      expect(heartbeat2).toBeGreaterThan(heartbeat1!);
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent and pairing code', async () => {
      const { agent_id, pairing_code } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      await storage.deleteAgent(agent_id);

      // Agent should be deleted
      const agent = await storage.getAgent(agent_id);
      expect(agent).toBeNull();

      // Pairing code should be deleted
      const pairResult = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device',
      });
      expect(pairResult.success).toBe(false);
    });

    it('should handle non-existent agent gracefully', async () => {
      // Should not throw error
      await expect(storage.deleteAgent('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty capabilities array', async () => {
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: [],
      });

      const agent = await storage.getAgent(agent_id);
      expect(agent?.capabilities).toEqual([]);
    });

    it('should handle very long capabilities list', async () => {
      const capabilities = Array.from({ length: 100 }, (_, i) => `capability-${i}`);

      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities,
      });

      const agent = await storage.getAgent(agent_id);
      expect(agent?.capabilities).toHaveLength(100);
    });

    it('should handle minimum TTL', async () => {
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 1,
        capabilities: [],
      });

      const agent = await storage.getAgent(agent_id);
      expect(agent).not.toBeNull();
    });

    it('should handle maximum TTL', async () => {
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 86400, // 24 hours
        capabilities: [],
      });

      const agent = await storage.getAgent(agent_id);
      expect(agent).not.toBeNull();
      expect(agent?.ttl).toBe(86400);
    });

    it('should handle special characters in device_name', async () => {
      const { pairing_code } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: [],
      });

      const result = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device',
        device_name: '测试设备 📱 <script>alert("xss")</script>',
      });

      expect(result.success).toBe(true);
    });
  });
});
