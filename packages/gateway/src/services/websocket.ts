import WebSocket from 'ws';

/**
 * WebSocket connection types
 */
export enum ConnectionType {
  AGENT = 'agent',
  DEVICE = 'device',
}

/**
 * WebSocket connection information
 */
export interface WebSocketConnection {
  socket: WebSocket;
  type: ConnectionType;
  id: string; // agent_id or device_id
  pairing_code?: string; // For device connections waiting for pairing
  connectedAt: number;
  lastPing: number;
}

/**
 * WebSocket message types
 */
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

/**
 * WebSocket event types
 */
export enum WSEventType {
  // Connection events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',

  // Agent events
  AGENT_REGISTERED = 'agent:registered',
  AGENT_HEARTBEAT = 'agent:heartbeat',

  // Pairing events
  PAIRING_INITIATED = 'pairing:initiated',
  PAIRING_SUCCESS = 'pairing:success',
  PAIRING_FAILED = 'pairing:failed',

  // Error events
  ERROR = 'error',

  // Ping/Pong
  PING = 'ping',
  PONG = 'pong',
}

/**
 * WebSocket connection manager
 */
export class WebSocketManager {
  private connections: Map<string, WebSocketConnection>;
  private pairingCodeConnections: Map<string, string>; // pairing_code -> device connection ID

  constructor() {
    this.connections = new Map();
    this.pairingCodeConnections = new Map();
  }

  /**
   * Add a new connection
   */
  addConnection(connection: WebSocketConnection): void {
    const connectionId = this.generateConnectionId(connection.type, connection.id);
    this.connections.set(connectionId, connection);

    // If device is waiting for pairing, index by pairing code
    if (connection.type === ConnectionType.DEVICE && connection.pairing_code) {
      this.pairingCodeConnections.set(connection.pairing_code, connectionId);
    }
  }

  /**
   * Remove a connection
   */
  removeConnection(type: ConnectionType, id: string): void {
    const connectionId = this.generateConnectionId(type, id);
    const connection = this.connections.get(connectionId);

    if (connection) {
      // Clean up pairing code index
      if (connection.pairing_code) {
        this.pairingCodeConnections.delete(connection.pairing_code);
      }

      this.connections.delete(connectionId);
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(type: ConnectionType, id: string): WebSocketConnection | undefined {
    const connectionId = this.generateConnectionId(type, id);
    return this.connections.get(connectionId);
  }

  /**
   * Get device connection by pairing code
   */
  getDeviceByPairingCode(pairingCode: string): WebSocketConnection | undefined {
    const connectionId = this.pairingCodeConnections.get(pairingCode);
    if (!connectionId) return undefined;

    return this.connections.get(connectionId);
  }

  /**
   * Send message to a specific connection
   */
  send(type: ConnectionType, id: string, message: WebSocketMessage): boolean {
    const connection = this.getConnection(type, id);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Broadcast message to all connections of a type
   */
  broadcast(type: ConnectionType, message: WebSocketMessage): number {
    let sent = 0;

    this.connections.forEach((connection) => {
      if (connection.type === type && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify(message));
          sent++;
        } catch (error) {
          console.error('Failed to broadcast WebSocket message:', error);
        }
      }
    });

    return sent;
  }

  /**
   * Notify device about successful pairing
   */
  notifyPairingSuccess(pairingCode: string, agentInfo: any): boolean {
    const deviceConnection = this.getDeviceByPairingCode(pairingCode);
    if (!deviceConnection) return false;

    const message: WebSocketMessage = {
      type: WSEventType.PAIRING_SUCCESS,
      payload: agentInfo,
      timestamp: Date.now(),
    };

    return this.send(deviceConnection.type, deviceConnection.id, message);
  }

  /**
   * Notify agent about new device connection
   */
  notifyAgentNewDevice(agentId: string, deviceInfo: any): boolean {
    const message: WebSocketMessage = {
      type: WSEventType.PAIRING_SUCCESS,
      payload: deviceInfo,
      timestamp: Date.now(),
    };

    return this.send(ConnectionType.AGENT, agentId, message);
  }

  /**
   * Update connection last ping time
   */
  updateLastPing(type: ConnectionType, id: string): void {
    const connection = this.getConnection(type, id);
    if (connection) {
      connection.lastPing = Date.now();
    }
  }

  /**
   * Get all connections
   */
  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection count
   */
  getConnectionCount(type?: ConnectionType): number {
    if (!type) {
      return this.connections.size;
    }

    let count = 0;
    this.connections.forEach((connection) => {
      if (connection.type === type) count++;
    });
    return count;
  }

  /**
   * Clean up stale connections (not pinged in last 60 seconds)
   */
  cleanupStaleConnections(): number {
    const now = Date.now();
    const staleThreshold = 60000; // 60 seconds
    let cleaned = 0;

    this.connections.forEach((connection, connectionId) => {
      if (now - connection.lastPing > staleThreshold) {
        try {
          connection.socket.close();
        } catch (error) {
          console.error('Failed to close stale connection:', error);
        }
        this.connections.delete(connectionId);
        cleaned++;
      }
    });

    return cleaned;
  }

  /**
   * Generate connection ID
   */
  private generateConnectionId(type: ConnectionType, id: string): string {
    return `${type}:${id}`;
  }
}
