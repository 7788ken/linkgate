#!/usr/bin/env node

import { Command } from 'commander';
import { GatewayClient } from './services';
import { publicIp, publicIpv4, publicIpv6 } from 'public-ip';
import * as os from 'os';

const program = new Command();

program
  .name('linkgate')
  .description('LinkGate Agent Client - Register and manage local agents')
  .version('0.1.0');

/**
 * Register command
 */
program
  .command('register')
  .description('Register this agent to the gateway')
  .requiredOption('-g, --gateway <url>', 'Gateway URL (e.g., https://gateway.example.com)')
  .requiredOption('-p, --port <number>', 'Local listening port', parseInt)
  .option('-n, --name <name>', 'Agent name', os.hostname())
  .option('-t, --ttl <seconds>', 'Registration TTL (time to live)', '300')
  .option('-c, --capabilities <items>', 'Comma-separated capabilities', 'file-transfer,remote-shell')
  .action(async (options) => {
    try {
      const client = new GatewayClient(options.gateway);

      // Check gateway health
      console.log(`Checking gateway health: ${options.gateway}`);
      const healthy = await client.healthCheck();
      if (!healthy) {
        console.error('❌ Gateway is not reachable');
        process.exit(1);
      }
      console.log('✅ Gateway is healthy');

      // Get public IP
      console.log('Detecting public IP...');
      const public_ip = await publicIpv4();
      console.log(`✅ Public IP: ${public_ip}`);

      // Get local IP
      const local_ip = Object.values(os.networkInterfaces())
        .flat()
        .find((iface) => iface?.family === 'IPv4' && !iface.internal)?.address;
      console.log(`✅ Local IP: ${local_ip}`);

      // Register
      console.log('Registering agent...');
      const result = await client.register({
        public_ip,
        local_ip,
        port: options.port,
        ttl: parseInt(options.ttl),
        capabilities: options.capabilities.split(',').map((c: string) => c.trim()),
      });

      if (result.success) {
        console.log('\n✅ Registration successful!\n');
        console.log(`  Agent ID: ${result.agent_id}`);
        console.log(`  Pairing Code: ${result.pairing_code}`);
        console.log(`  Expires in: ${result.expires_in} seconds\n`);
        console.log('💡 Share this pairing code with your mobile device to connect.\n');

        // Save agent_id to file for later use
        // TODO: Implement persistent storage
      } else {
        console.error('❌ Registration failed:', result.error);
        process.exit(1);
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Check agent status')
  .requiredOption('-g, --gateway <url>', 'Gateway URL')
  .requiredOption('-a, --agent-id <id>', 'Agent ID')
  .action(async (options) => {
    try {
      const client = new GatewayClient(options.gateway);

      console.log('Checking agent status...');
      const healthy = await client.healthCheck();

      if (healthy) {
        console.log('✅ Agent is registered and active');
      } else {
        console.log('❌ Agent is not reachable or expired');
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Heartbeat command
 */
program
  .command('heartbeat')
  .description('Send heartbeat to gateway')
  .requiredOption('-g, --gateway <url>', 'Gateway URL')
  .requiredOption('-a, --agent-id <id>', 'Agent ID')
  .action(async (options) => {
    try {
      const client = new GatewayClient(options.gateway);

      console.log('Sending heartbeat...');
      const result = await client.heartbeat(options.agentId);

      if (result.success) {
        console.log('✅ Heartbeat sent successfully');
      } else {
        console.error('❌ Heartbeat failed:', result.error);
        process.exit(1);
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Unregister command
 */
program
  .command('unregister')
  .description('Unregister agent from gateway')
  .requiredOption('-g, --gateway <url>', 'Gateway URL')
  .requiredOption('-a, --agent-id <id>', 'Agent ID')
  .action(async (options) => {
    try {
      const client = new GatewayClient(options.gateway);

      console.log('Unregistering agent...');
      const result = await client.unregister(options.agentId);

      if (result.success) {
        console.log('✅ Agent unregistered successfully');
      } else {
        console.error('❌ Unregister failed:', result.error);
        process.exit(1);
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
