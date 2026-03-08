import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageService } from '../services';
import { AgentRegistration, PairingRequest } from '../models';

interface RegisterRequest {
  Body: Omit<AgentRegistration, 'agent_id' | 'timestamp' | 'pairing_code'>;
}

interface PairRequest {
  Body: PairingRequest;
}

interface HeartbeatRequest {
  Params: { agent_id: string };
}

/**
 * Register API routes
 */
export async function registerRoutes(
  fastify: FastifyInstance,
  storage: StorageService
) {
  /**
   * POST /api/register - Agent registration
   */
  fastify.post<RegisterRequest>('/api/register', async (request, reply) => {
    try {
      const data = request.body;

      // Validate required fields
      if (!data.port || !data.ttl) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: port, ttl',
        });
      }

      // Register agent
      const result = await storage.registerAgent(data);

      return reply.status(201).send({
        success: true,
        agent_id: result.agent_id,
        pairing_code: result.pairing_code,
        expires_in: data.ttl,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/pair - Pairing verification
   */
  fastify.post<PairRequest>('/api/pair', async (request, reply) => {
    try {
      const { pairing_code, device_id, device_name } = request.body;

      // Validate required fields
      if (!pairing_code || !device_id) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: pairing_code, device_id',
        });
      }

      // Verify pairing
      const result = await storage.verifyPairing(request.body);

      if (!result.success) {
        return reply.status(404).send(result);
      }

      return reply.status(200).send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/heartbeat/:agent_id - Update heartbeat
   */
  fastify.post<HeartbeatRequest>(
    '/api/heartbeat/:agent_id',
    async (request, reply) => {
      try {
        const { agent_id } = request.params;

        const success = await storage.updateHeartbeat(agent_id);

        if (!success) {
          return reply.status(404).send({
            success: false,
            error: 'Agent not found',
          });
        }

        return reply.status(200).send({
          success: true,
          message: 'Heartbeat updated',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * DELETE /api/agent/:agent_id - Delete agent
   */
  fastify.delete<HeartbeatRequest>(
    '/api/agent/:agent_id',
    async (request, reply) => {
      try {
        const { agent_id } = request.params;

        await storage.deleteAgent(agent_id);

        return reply.status(200).send({
          success: true,
          message: 'Agent deleted',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * GET /api/health - Health check
   */
  fastify.get('/api/health', async (request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: Date.now(),
    });
  });
}
