import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { AgentRegistration, PairingRequest, PairingResponse } from '../models';

/**
 * Redis storage service for agent registrations
 */
export class StorageService {
  private redis: Redis;
  private readonly keyPrefix = 'linkgate:agent:';

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Register a new agent
   */
  async registerAgent(data: Omit<AgentRegistration, 'agent_id' | 'timestamp' | 'pairing_code'>): Promise<{
    agent_id: string;
    pairing_code: string;
  }> {
    const agent_id = uuidv4();
    const pairing_code = this.generatePairingCode();
    const timestamp = Date.now();

    const registration: AgentRegistration = {
      ...data,
      agent_id,
      pairing_code,
      timestamp,
      last_heartbeat: timestamp,
    };

    // Store with TTL
    const key = this.keyPrefix + agent_id;
    await this.redis.setex(key, data.ttl, JSON.stringify(registration));

    // Also create pairing code index for quick lookup
    const codeKey = `${this.keyPrefix}code:${pairing_code}`;
    await this.redis.setex(codeKey, data.ttl, agent_id);

    return { agent_id, pairing_code };
  }

  /**
   * Get agent registration by ID
   */
  async getAgent(agent_id: string): Promise<AgentRegistration | null> {
    const key = this.keyPrefix + agent_id;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get agent by pairing code
   */
  async getAgentByPairingCode(pairing_code: string): Promise<AgentRegistration | null> {
    const codeKey = `${this.keyPrefix}code:${pairing_code}`;
    const agent_id = await this.redis.get(codeKey);

    if (!agent_id) {
      return null;
    }

    return this.getAgent(agent_id);
  }

  /**
   * Verify pairing request and return agent info
   */
  async verifyPairing(request: PairingRequest): Promise<PairingResponse> {
    const agent = await this.getAgentByPairingCode(request.pairing_code);

    if (!agent) {
      return {
        success: false,
        error: 'Invalid or expired pairing code',
      };
    }

    // Delete pairing code after successful verification (one-time use)
    const codeKey = `${this.keyPrefix}code:${request.pairing_code}`;
    await this.redis.del(codeKey);

    // Return agent connection info
    return {
      success: true,
      agent_info: {
        public_ip: agent.public_ip,
        local_ip: agent.local_ip,
        port: agent.port,
        capabilities: agent.capabilities,
      },
    };
  }

  /**
   * Update agent heartbeat
   */
  async updateHeartbeat(agent_id: string): Promise<boolean> {
    const agent = await this.getAgent(agent_id);
    if (!agent) {
      return false;
    }

    agent.last_heartbeat = Date.now();
    const key = this.keyPrefix + agent_id;
    await this.redis.setex(key, agent.ttl, JSON.stringify(agent));

    return true;
  }

  /**
   * Delete agent registration
   */
  async deleteAgent(agent_id: string): Promise<void> {
    const agent = await this.getAgent(agent_id);
    if (agent) {
      // Delete pairing code index
      const codeKey = `${this.keyPrefix}code:${agent.pairing_code}`;
      await this.redis.del(codeKey);
    }

    // Delete agent data
    const key = this.keyPrefix + agent_id;
    await this.redis.del(key);
  }

  /**
   * Generate 6-digit pairing code
   */
  private generatePairingCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}
