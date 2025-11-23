
import { DeployState, DeployStatus, DeploymentProvider } from '../types';
import { config } from './config';

/**
 * Unified Deployment Service
 * Real deployment to multiple cloud providers (Render, Vercel, Replit, Netlify).
 */
class DeploymentService {
    private state: DeployState = {
        id: null,
        provider: 'render',
        status: 'pending',
        logs: [],
        url: null,
    };
    private subscribers: Set<(state: DeployState) => void> = new Set();
    private isRunning = false;

    // Map deployment providers to config keys
    private configKeyMap: Record<DeploymentProvider, 'render' | 'vercel' | 'netlify' | 'replit'> = {
        render: 'render',
        vercel: 'vercel',
        replit: 'replit',
        netlify: 'netlify'
    };

    constructor() {
        // No pre-populated keys - use environment variables or user settings
    }

    public subscribe(callback: (state: DeployState) => void): () => void {
        this.subscribers.add(callback);
        callback(this.state);
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        this.subscribers.forEach(cb => cb({ ...this.state }));
    }

    public getState(): DeployState {
        return { ...this.state };
    }

    public setApiKey(provider: DeploymentProvider, key: string) {
        const configKey = this.configKeyMap[provider];
        config.set(configKey, key);
    }

    public getApiKey(provider: DeploymentProvider): string | null {
        const configKey = this.configKeyMap[provider];
        return config.get(configKey);
    }

    public async deploy(provider: DeploymentProvider, repoUrl: string): Promise<string> {
        if (this.isRunning) {
            throw new Error("A deployment is already in progress.");
        }
        
        const apiKey = this.getApiKey(provider);
        if (!apiKey) {
            throw new Error(`No API Key found for ${provider}. Please configure in Settings.`);
        }

        this.isRunning = true;
        
        // Reset state
        this.state = {
            id: `dpl-${Math.random().toString(36).substring(2, 11)}`,
            provider,
            status: 'pending',
            logs: [],
            url: null,
        };
        this.notify();

        this.addLog(`[${provider.toUpperCase()}] Starting deployment for ${repoUrl}`);
        this.addLog(`Authenticated with key: ${apiKey.substring(0, 8)}...`);

        // Start real deployment
        this.runDeployment(provider, repoUrl);

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
     * Real deployment implementation with actual API calls
     */
    private async runDeployment(provider: DeploymentProvider, repoUrl: string) {
        try {
            const deployer = this.getDeployer(provider);
            await deployer(repoUrl);
        } catch (error) {
            this.setStatus('failed');
            this.addLog(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            this.isRunning = false;
            this.notify();
        }
    }

    private getDeployer(provider: DeploymentProvider) {
        const deployers = {
            render: this.deployRender.bind(this),
            vercel: this.deployVercel.bind(this),
            netlify: this.deployNetlify.bind(this),
            replit: this.deployReplit.bind(this),
        };
        return deployers[provider];
    }

    /**
     * Render.com deployment via REST API
     * API Docs: https://api-docs.render.com/reference/create-service
     */
    private async deployRender(repoUrl: string) {
        const apiKey = this.getApiKey('render');
        if (!apiKey) throw new Error('Render API key not found');

        this.setStatus('build_started');
        this.addLog('Creating service on Render.com...');

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

        // Poll for deployment status
        await this.pollRenderStatus(data.service.id, apiKey);
    }

    private async pollRenderStatus(serviceId: string, apiKey: string) {
        const maxAttempts = 60; // 5 minutes max
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds

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

            attempts++;
        }

        throw new Error('Deployment timeout - please check Render dashboard');
    }

    /**
     * Vercel deployment via REST API
     * API Docs: https://vercel.com/docs/rest-api/endpoints/deployments
     */
    private async deployVercel(repoUrl: string) {
        const apiKey = this.getApiKey('vercel');
        if (!apiKey) throw new Error('Vercel API key not found');

        this.setStatus('build_started');
        this.addLog('Creating deployment on Vercel...');

        const response = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: `aussie-os-${Date.now()}`,
                gitSource: {
                    type: 'github',
                    repo: repoUrl.replace('https://github.com/', ''),
                    ref: 'main',
                },
                target: 'production',
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Vercel API error: ${error}`);
        }

        const data = await response.json();
        this.state.id = data.id;
        this.state.url = `https://${data.url}`;
        this.addLog(`Deployment created: ${data.url}`);

        // Vercel deployments are usually fast, poll for ready state
        await this.pollVercelStatus(data.id, apiKey);
    }

    private async pollVercelStatus(deploymentId: string, apiKey: string) {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 3000));

            const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });

            if (!response.ok) continue;

            const data = await response.json();

            if (data.readyState === 'READY') {
                this.setStatus('live');
                this.addLog('Deployment live!');
                this.isRunning = false;
                this.notify();
                return;
            } else if (data.readyState === 'ERROR' || data.readyState === 'CANCELED') {
                this.setStatus('failed');
                this.addLog(`Deployment failed: ${data.readyState}`);
                this.isRunning = false;
                this.notify();
                return;
            } else {
                this.addLog(`Build state: ${data.readyState}`);
            }

            attempts++;
        }

        throw new Error('Deployment timeout');
    }

    /**
     * Netlify deployment via REST API
     * API Docs: https://docs.netlify.com/api/get-started/
     */
    private async deployNetlify(repoUrl: string) {
        const apiKey = this.getApiKey('netlify');
        if (!apiKey) throw new Error('Netlify API key not found');

        this.setStatus('build_started');
        this.addLog('Creating site on Netlify...');

        // First create site
        const createResponse = await fetch('https://api.netlify.com/api/v1/sites', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: `aussie-os-${Date.now()}`,
                repo: {
                    provider: 'github',
                    repo: repoUrl.replace('https://github.com/', ''),
                    branch: 'main',
                },
            }),
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`Netlify API error: ${error}`);
        }

        const site = await createResponse.json();
        this.state.id = site.id;
        this.state.url = site.url;
        this.addLog(`Site created: ${site.name}`);

        // Deploy site
        const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (!deployResponse.ok) {
            throw new Error('Failed to trigger deployment');
        }

        const deploy = await deployResponse.json();
        this.addLog(`Deployment started: ${deploy.id}`);

        await this.pollNetlifyStatus(deploy.id, apiKey);
    }

    private async pollNetlifyStatus(deployId: string, apiKey: string) {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 5000));

            const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });

            if (!response.ok) continue;

            const data = await response.json();

            if (data.state === 'ready') {
                this.setStatus('live');
                this.addLog('Site is live!');
                this.isRunning = false;
                this.notify();
                return;
            } else if (data.state === 'error') {
                this.setStatus('failed');
                this.addLog('Deployment failed');
                this.isRunning = false;
                this.notify();
                return;
            } else {
                this.addLog(`Build state: ${data.state}`);
            }

            attempts++;
        }

        throw new Error('Deployment timeout');
    }

    /**
     * Replit deployment
     * Note: Replit doesn't have a public REST API for deployments yet
     * This is a placeholder for future implementation
     */
    private async deployReplit(repoUrl: string) {
        const apiKey = this.getApiKey('replit');
        if (!apiKey) throw new Error('Replit API key not found');

        this.addLog('Note: Replit deployment requires manual setup via their web interface');
        this.addLog('Opening Replit import page...');

        // Replit uses GQL API which requires different setup
        window.open(`https://replit.com/github/${repoUrl.replace('https://github.com/', '')}`, '_blank');

        this.setStatus('pending');
        this.addLog('Please complete deployment in the opened Replit tab');
        this.isRunning = false;
    }
}

export const deployment = new DeploymentService();
