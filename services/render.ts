
import { DeployState, DeployStatus, DeployLog } from '../types';
import { config } from './config';

/**
 * Render.com Deployment Service
 * Real API integration with Render.com deployment platform
 */
class RenderService {
    private state: DeployState = {
        id: null,
        provider: 'render',
        status: 'pending',
        logs: [],
        url: null,
    };
    private subscribers: Set<(state: DeployState) => void> = new Set();
    private isRunning = false;

    public subscribe(callback: (state: DeployState) => void): () => void {
        this.subscribers.add(callback);
        callback(this.state); // Immediately send current state
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        this.subscribers.forEach(cb => cb({ ...this.state }));
    }

    public getState(): DeployState {
        return { ...this.state };
    }

    public async createService(repoUrl: string): Promise<string> {
        if (this.isRunning) {
            throw new Error("A deployment is already in progress.");
        }
        this.isRunning = true;
        
        // Reset state
        const apiKey = config.get('render');
        if (!apiKey) {
            throw new Error('Render API key not configured. Please add it in Settings.');
        }

        this.state = {
            id: `dpl-${Math.random().toString(36).substring(2, 11)}`,
            provider: 'render',
            status: 'pending',
            logs: [],
            url: null,
        };
        this.notify();

        this.addLog(`Render API Key detected: ${apiKey.substring(0, 8)}...`);
        this.addLog(`Creating new Web Service for repository: ${repoUrl}`);

        // Start real deployment
        this.deployToRender(repoUrl, apiKey);

        return this.state.id!;
    }

    private addLog(line: string) {
        this.state.logs.push({ timestamp: Date.now(), line });
        this.notify();
    }

    private setStatus(status: DeployStatus) {
        this.state.status = status;
        this.addLog(`==> Status changed to: ${status.toUpperCase()}`);
        this.notify();
    }

    /**
     * Real Render.com deployment via REST API
     */
    private async deployToRender(repoUrl: string, apiKey: string) {
        try {
            this.setStatus('build_started');

            const response = await fetch('https://api.render.com/v1/services', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'web_service',
                    name: `aussie-os-${Date.now()}`,
                    repo: repoUrl,
                    autoDeploy: true,
                    branch: 'main',
                    buildCommand: 'npm install && npm run build',
                    startCommand: 'npm run preview',
                    envVars: [],
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Render API error: ${error}`);
            }

            const data = await response.json();
            this.state.id = data.service.id;
            this.addLog(`Service created: ${data.service.name}`);

            // Poll for status
            await this.pollStatus(data.service.id, apiKey);
        } catch (error) {
            this.setStatus('failed');
            this.addLog(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            this.isRunning = false;
        }
    }

    private async pollStatus(serviceId: string, apiKey: string) {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 5000));

            try {
                const response = await fetch(`https://api.render.com/v1/services/${serviceId}`, {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                });

                if (!response.ok) continue;

                const data = await response.json();
                const status = data.service.state;

                if (status === 'live') {
                    this.setStatus('live');
                    this.state.url = data.service.serviceDetails.url;
                    this.addLog('Deployment successful!');
                    this.isRunning = false;
                    this.notify();
                    return;
                } else if (status === 'build_failed' || status === 'failed') {
                    this.setStatus('failed');
                    this.addLog(`Deployment failed with status: ${status}`);
                    this.isRunning = false;
                    this.notify();
                    return;
                } else {
                    this.addLog(`Status: ${status}`);
                }
            } catch (err) {
                this.addLog(`Error polling status: ${err}`);
            }

            attempts++;
        }

        this.setStatus('failed');
        this.addLog('Deployment timeout - please check Render dashboard');
        this.isRunning = false;
    }
}

export const render = new RenderService();