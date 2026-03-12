import { program } from 'commander'
import { registerAgent, sendHeartbeat } from './services/client'
import { AgentConfig } from './models/types'

async function run(): Promise<void> {
  program
    .name('linkgate-agent')
    .description('CLI to manage linkgate agents')
    .version('0.1.0')

  program
    .command('register')
    .description('Registers the agent with the gateway')
    .argument('<gatewayUrl>', 'The URL of the gateway')
    .argument('<agentName>', 'The name of the agent')
    .action(async (gatewayUrl, agentName) => {
      try {
        const config: AgentConfig = {
          gatewayUrl,
          agentName,
        }
        const response = await registerAgent(config)
        console.log('Agent registered successfully:', response)
      } catch (error: any) {
        console.error('Failed to register agent:', error.message)
      }
    })

  program
    .command('heartbeat')
    .description('Sends a heartbeat to the gateway')
    .argument('<gatewayUrl>', 'The URL of the gateway')
    .argument('<agentName>', 'The name of the agent')
    .action(async (gatewayUrl, agentName) => {
      try {
        const config: AgentConfig = {
          gatewayUrl,
          agentName,
        }
        const response = await sendHeartbeat(config)
        console.log('Heartbeat sent successfully:', response)
      } catch (error: any) {
        console.error('Failed to send heartbeat:', error.message)
      }
    })

  await program.parseAsync(process.argv)
}

run().catch((err) => {
  console.error('An error occurred:', err)
  process.exit(1)
})
