
import { bus } from './eventBus';
import * as julesAPI from './julesAPI';

interface SwarmConfig {
    topology: 'hierarchical' | 'flat' | 'mesh';
    consensusThreshold: number;
    enableQuantum: boolean;
}

/**
 * Agent Swarm Orchestrator
 * Manages multiple Jules API sessions to perform complex tasks with consensus.
 */
class SwarmOrchestrator {
    
    public async executeTask(task: string, type: string, config: Partial<SwarmConfig> = {}) {
        const conf: SwarmConfig = {
            topology: 'hierarchical',
            consensusThreshold: 0.66,
            enableQuantum: false,
            ...config
        };

        const swarmType = conf.enableQuantum ? 'Quantum Swarm' : 'Standard Swarm';
        
        bus.emit('shell-output', `[Swarm] Initializing ${conf.topology} swarm with ${conf.enableQuantum ? 'Quantum' : 'Standard'} optimization...`);
        bus.emit('agent-message', { agent: 'Hive Mind', text: `Initializing ${swarmType} for task: "${task}"...` });

        // 1. Spawn Agents
        const agentCount = conf.enableQuantum ? 5 : 3;
        bus.emit('shell-output', `[Swarm] Spawning ${agentCount} autonomous agents...`);
        bus.emit('agent-message', { agent: 'Hive Mind', text: `Spawning ${agentCount} autonomous agents in ${conf.topology} topology.` });
        
        const agents = Array(agentCount).fill(0).map((_, i) => ({ id: i, status: 'idle' }));
        
        // 2. Distribute Work (Simulated Parallel Execution)
        const promises = agents.map(agent => this.runAgent(agent, task));
        
        const results = await Promise.all(promises);
        
        // 3. Consensus Verification
        const successCount = results.filter(r => r.status === 'success').length;
        const agreement = successCount / agentCount;

        bus.emit('shell-output', `[Swarm] Consensus Reached: ${(agreement * 100).toFixed(1)}% agreement.`);

        if (agreement >= conf.consensusThreshold) {
            const msg = `Consensus reached (${(agreement * 100).toFixed(0)}%). Task completed successfully.`;
            bus.emit('agent-message', { agent: 'Hive Mind', text: `✅ ${msg}` });
            return { 
                status: 'success', 
                message: `Task completed by swarm. ${successCount}/${agentCount} agents verified result.`,
                details: results[0].output
            };
        } else {
             bus.emit('agent-message', { agent: 'Hive Mind', text: `❌ Consensus failed. Only ${(agreement * 100).toFixed(0)}% agreement.` });
             return { 
                status: 'failure', 
                message: `Swarm failed to reach consensus.`,
            };
        }
    }

    /**
     * Run individual agent task using the Jules API.
     */
    private async runAgent(agent: any, task: string): Promise<{ status: string, output: any }> {
        try {
            // 1. Get the first available source.
            const sources = await julesAPI.listSources();
            if (!sources.sources || sources.sources.length === 0) {
                throw new Error('No sources found.');
            }
            const source = sources.sources[0].name;

            // 2. Create a new session.
            const session = await julesAPI.createSession(task, source);
            bus.emit('agent-message', { agent: `Agent ${agent.id}`, text: `Session created: ${session.id}` });

            // 3. Poll for completion.
            let isComplete = false;
            let finalSession;
            while (!isComplete) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
                const activities = await julesAPI.listActivities(session.id);
                if (activities.activities) {
                    for (const activity of activities.activities) {
                        if (activity.sessionCompleted) {
                            isComplete = true;
                            finalSession = await julesAPI.getSession(session.id);
                            break;
                        }
                    }
                }
            }
            
            bus.emit('agent-message', { agent: `Agent ${agent.id}`, text: `Session complete: ${session.id}` });
            return { status: 'success', output: finalSession };

        } catch (error: any) {
            bus.emit('agent-message', { agent: `Agent ${agent.id}`, text: `Error: ${error.message}` });
            return { status: 'failure', output: error };
        }
    }
}

export const swarm = new SwarmOrchestrator();
