import { z } from 'zod';

// Custom IP validation regex
const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

/**
 * Schema for agent registration
 */
export const registerAgentSchema = z.object({
  public_ip: z.string().regex(ipRegex).optional(),
  local_ip: z.string().regex(ipRegex).optional(),
  port: z.number().int().min(1).max(65535),
  ttl: z.number().int().min(60).max(86400).default(600), // 1 min to 24 hours
  capabilities: z.array(z.string().max(50)).max(20).default([]),
  metadata: z.record(z.string(), z.any()).optional().refine(
    (val) => JSON.stringify(val).length <= 1024,
    { message: 'Metadata must be less than 1KB' }
  ),
});

export type RegisterAgentRequest = z.infer<typeof registerAgentSchema>;

/**
 * Schema for pairing verification
 */
export const verifyPairingSchema = z.object({
  pairing_code: z.string().length(6, 'Pairing code must be exactly 6 digits'),
  device_id: z.string().min(1).max(100),
  device_name: z.string().max(100).optional(),
});

export type VerifyPairingRequest = z.infer<typeof verifyPairingSchema>;

/**
 * Schema for heartbeat update
 */
export const updateHeartbeatSchema = z.object({
  agent_id: z.string().min(1).max(100),
  status: z.record(z.string(), z.any()).optional(),
});

export type UpdateHeartbeatRequest = z.infer<typeof updateHeartbeatSchema>;

/**
 * Schema for agent deletion
 */
export const deleteAgentSchema = z.object({
  agent_id: z.string().min(1).max(100),
});

export type DeleteAgentRequest = z.infer<typeof deleteAgentSchema>;
