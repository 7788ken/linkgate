import axios from 'axios';
import { AgentRegistration } from './models';

/**
 * Gateway API client
 */
export class GatewayClient {
  private baseUrl: string;

  constructor(gatewayUrl: string) {
    this.baseUrl = gatewayUrl.replace(/\/$/, '');
  }

  /**
   * Register agent to gateway
   */
  async register(data: Omit<AgentRegistration, 'agent_id' | 'timestamp' | 'pairing_code'>): Promise<{
    success: boolean;
    agent_id?: string;
    pairing_code?: string;
    expires_in?: number;
    error?: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/register`, data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Send heartbeat to gateway
   */
  async heartbeat(agentId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/heartbeat/${agentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Unregister agent from gateway
   */
  async unregister(agentId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await axios.delete(`${this.baseUrl}/api/agent/${agentId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`);
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }
}
