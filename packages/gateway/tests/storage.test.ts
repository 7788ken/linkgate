import { StorageService } from '../src/services';
import { AgentRegistration } from '../src/models';

describe('StorageService', () => {
  let storage: StorageService;

  beforeAll(() => {
    // Use mock Redis for testing
    storage = new StorageService('redis://localhost:6379');
  });

  afterAll(async () => {
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
    });
  });

  describe('getAgent', () => {
    it('should return agent data by ID', async () => {
      // First register an agent
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      // Then retrieve it
      const agent = await storage.getAgent(agent_id);

      expect(agent).not.toBeNull();
      expect(agent?.agent_id).toBe(agent_id);
      expect(agent?.port).toBe(8080);
    });

    it('should return null for non-existent agent', async () => {
      const agent = await storage.getAgent('non-existent-id');
      expect(agent).toBeNull();
    });
  });

  describe('verifyPairing', () => {
    it('should successfully verify valid pairing code', async () => {
      // Register an agent
      const { pairing_code } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      // Verify pairing
      const result = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device',
      });

      expect(result.success).toBe(true);
      expect(result.agent_info).toBeDefined();
      expect(result.agent_info?.port).toBe(8080);
    });

    it('should fail for invalid pairing code', async () => {
      const result = await storage.verifyPairing({
        pairing_code: '999999',
        device_id: 'test-device',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired pairing code');
    });

    it('should delete pairing code after successful verification', async () => {
      // Register an agent
      const { pairing_code } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      // Verify pairing once
      await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device',
      });

      // Try to verify again with same code
      const result = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device-2',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('updateHeartbeat', () => {
    it('should update agent heartbeat', async () => {
      const { agent_id } = await storage.registerAgent({
        port: 8080,
        ttl: 300,
        capabilities: ['file-transfer'],
      });

      const success = await storage.updateHeartbeat(agent_id);
      expect(success).toBe(true);

      const agent = await storage.getAgent(agent_id);
      expect(agent?.last_heartbeat).toBeDefined();
    });

    it('should return false for non-existent agent', async () => {
      const success = await storage.updateHeartbeat('non-existent-id');
      expect(success).toBe(false);
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

      const agent = await storage.getAgent(agent_id);
      expect(agent).toBeNull();

      const pairResult = await storage.verifyPairing({
        pairing_code,
        device_id: 'test-device',
      });
      expect(pairResult.success).toBe(false);
    });
  });
});
