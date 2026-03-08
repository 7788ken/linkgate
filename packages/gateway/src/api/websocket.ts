import { FastifyInstance } from 'fastify';
import { WebSocket } from '@fastify/websocket';
import {
  WebSocketManager,
  ConnectionType,
  WSEventType,
  WebSocketMessage,
} from '../services';

interface WebSocketQuery {
  type: 'agent' | 'device';
  id: string;
  pairing_code?: string;
}

/**
 * Register WebSocket routes
 */
export async function registerWebSocketRoutes(
  fastify: FastifyInstance,
  wsManager: WebSocketManager
) {
  // WebSocket endpoint for real-time communication
  await fastify.register(async function (fastify) {
    fastify.get<{ Querystring: WebSocketQuery }>(
      '/ws',
      { websocket: true },
      (connection /* SocketStream */, req /* FastifyRequest */) => {
        const query = req.query as WebSocketQuery;

        // Validate required parameters
        if (!query.type || !query.id) {
          connection.socket.send(
            JSON.stringify({
              type: WSEventType.ERROR,
              payload: { message: 'Missing required parameters: type, id' },
              timestamp: Date.now(),
            })
          );
          connection.socket.close();
          return;
        }

        // Validate connection type
        if (query.type !== 'agent' && query.type !== 'device') {
          connection.socket.send(
            JSON.stringify({
              type: WSEventType.ERROR,
              payload: { message: 'Invalid connection type. Must be "agent" or "device"' },
              timestamp: Date.now(),
            })
          );
          connection.socket.close();
          return;
        }

        const connectionType =
          query.type === 'agent' ? ConnectionType.AGENT : ConnectionType.DEVICE;

        // Register connection
        wsManager.addConnection({
          socket: connection.socket,
          type: connectionType,
          id: query.id,
          pairing_code: query.pairing_code,
          connectedAt: Date.now(),
          lastPing: Date.now(),
        });

        // Send connected confirmation
        const connectedMessage: WebSocketMessage = {
          type: WSEventType.CONNECTED,
          payload: {
            type: connectionType,
            id: query.id,
            message: 'Successfully connected to LinkGate Gateway',
          },
          timestamp: Date.now(),
        };

        connection.socket.send(JSON.stringify(connectedMessage));

        // Handle incoming messages
        connection.socket.on('message', (message: Buffer) => {
          try {
            const data = JSON.parse(message.toString());

            // Handle ping/pong
            if (data.type === WSEventType.PING) {
              wsManager.updateLastPing(connectionType, query.id);

              const pongMessage: WebSocketMessage = {
                type: WSEventType.PONG,
                payload: { timestamp: Date.now() },
                timestamp: Date.now(),
              };

              connection.socket.send(JSON.stringify(pongMessage));
              return;
            }

            // Handle other message types
            fastify.log.debug({ type: data.type, payload: data.payload }, 'WebSocket message received');
          } catch (error) {
            fastify.log.error(error, 'Failed to parse WebSocket message');

            const errorMessage: WebSocketMessage = {
              type: WSEventType.ERROR,
              payload: { message: 'Invalid message format' },
              timestamp: Date.now(),
            };

            connection.socket.send(JSON.stringify(errorMessage));
          }
        });

        // Handle connection close
        connection.socket.on('close', () => {
          wsManager.removeConnection(connectionType, query.id);

          const disconnectedMessage: WebSocketMessage = {
            type: WSEventType.DISCONNECTED,
            payload: {
              type: connectionType,
              id: query.id,
            },
            timestamp: Date.now(),
          };

          fastify.log.info({ type: connectionType, id: query.id }, 'WebSocket connection closed');
        });

        // Handle errors
        connection.socket.on('error', (error) => {
          fastify.log.error(error, 'WebSocket error');
          wsManager.removeConnection(connectionType, query.id);
        });
      }
    );
  });

  // REST endpoint to get WebSocket stats
  fastify.get('/api/ws/stats', async (request, reply) => {
    return {
      total_connections: wsManager.getConnectionCount(),
      agent_connections: wsManager.getConnectionCount(ConnectionType.AGENT),
      device_connections: wsManager.getConnectionCount(ConnectionType.DEVICE),
    };
  });
}
