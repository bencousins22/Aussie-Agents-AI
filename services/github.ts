
import { notify } from './notification';

const GITHUB_API = 'https://api.github.com';
const TOKEN_KEY = 'aussie_os_github_pat';

class GitHubService {
    private token: string | null = null;

    constructor() {
        this.loadToken();
    }

    private loadToken() {
        this.token = localStorage.getItem(TOKEN_KEY);
    }

    public saveToken(token: string) {
        this.token = token;
        localStorage.setItem(TOKEN_KEY, token);
    }

    public hasToken(): boolean {
        return !!this.token;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        if (!this.token) {
            throw new Error("GitHub token not set. Please add it in Settings.");
        }

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await fetch(`${GITHUB_API}${endpoint}`, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `GitHub API request failed with status ${response.status}`);
        }

        return response.json();
    }

    public async getUser() {
        return this.request('/user');
    }

    public async getRepo(repoFullName: string) {
        return this.request(`/repos/${repoFullName}`);
    }
    
    // ProcessOperation is now a high-level wrapper around the API
    public async processOperation(op: string, dataStr: string) {
        let data;
        try { data = JSON.parse(dataStr); } catch (e) { return { error: "Invalid JSON data" }; }
        
        notify.info("GitHub", `Processing operation: ${op}`);
        
        switch (op) {
            case 'repo_sync':
                // This is a more complex operation involving multiple git commands,
                // better handled by the agent using the shell. This is a simplified API version.
                return await this.getRepo(data.repo);

            case 'issue_create':
                return await this.request(`/repos/${data.repo}/issues`, {
                    method: 'POST',
                    body: JSON.stringify({
                        title: data.title,
                        body: data.body,
                    }),
                });
            default:
                throw new Error(`Operation ${op} not supported via direct API call.`);
        }
    }
}

export const github = new GitHubService();
