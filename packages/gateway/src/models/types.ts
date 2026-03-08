/**
 * Agent registration information
 */
export interface AgentRegistration {
  /** Unique agent identifier (UUID v4) */
  agent_id: string;

  /** Agent public IP (auto-detected or via STUN) */
  public_ip?: string;

  /** Local network IP */
  local_ip?: string;

  /** Listening port */
  port: number;

  /** 6-digit pairing code */
  pairing_code: string;

  /** Supported capabilities */
  capabilities: string[];

  /** Registration timestamp */
  timestamp: number;

  /** Time to live (seconds) */
  ttl: number;

  /** Last heartbeat timestamp */
  last_heartbeat?: number;
}

/**
 * Pairing request from mobile terminal
 */
export interface PairingRequest {
  /** Pairing code entered by user */
  pairing_code: string;

  /** Device identifier */
  device_id: string;

  /** Device name (optional) */
  device_name?: string;
}

/**
 * Pairing response to mobile terminal
 */
export interface PairingResponse {
  /** Success flag */
  success: boolean;

  /** Error message (if failed) */
  error?: string;

  /** Agent connection info (if successful) */
  agent_info?: {
    public_ip?: string;
    local_ip?: string;
    port: number;
    capabilities: string[];
  };

  /** Relay server address (if needed) */
  relay_server?: string;
}

/**
 * Heartbeat payload
 */
export interface HeartbeatPayload {
  agent_id: string;
  timestamp: number;
}
