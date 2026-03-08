/**
 * Agent registration information (mirrors gateway model)
 */
export interface AgentRegistration {
  agent_id: string;
  public_ip?: string;
  local_ip?: string;
  port: number;
  pairing_code: string;
  capabilities: string[];
  timestamp: number;
  ttl: number;
  last_heartbeat?: number;
}
