
import { Project, Collaborator } from '../types';
import { fs } from './fileSystem';
import { bus } from './eventBus';

const PROJECTS_FILE = '/workspace/system/projects.json';

// Mock collaborators
const MOCK_USERS: Collaborator[] = [
    { id: 'u1', name: 'Sarah Chen', role: 'Frontend Lead', avatar: 'SC', status: 'coding', color: '#ef4444' },
    { id: 'u2', name: 'Mike Ross', role: 'DevOps', avatar: 'MR', status: 'idle', color: '#3b82f6' },
    { id: 'u3', name: 'Aussie Bot', role: 'AI Assistant', avatar: 'AB', status: 'online', color: '#00e599' },
    { id: 'u4', name: 'Jessica Wu', role: 'Product Owner', avatar: 'JW', status: 'reviewing', color: '#a855f7' }
];

class CollaborationService {
    private projects: Project[] = [];
    private activeCollaborators: Map<string, Collaborator> = new Map();
    private simulationInterval: any;

    constructor() {
        this.loadProjects();
        this.startSimulation();
    }

    private loadProjects() {
        try {
            if (fs.exists(PROJECTS_FILE)) {
                this.projects = JSON.parse(fs.readFile(PROJECTS_FILE));
            } else {
                // Default projects
                this.projects = [
                    { 
                        id: 'p1', 
                        name: 'Aussie OS Kernel', 
                        description: 'Core operating system services and shell environment.', 
                        stack: ['react', 'node'], 
                        lastUpdated: Date.now(), 
                        path: '/workspace' 
                    },
                    { 
                        id: 'p2', 
                        name: 'Gemini Flow Agents', 
                        description: 'Autonomous agent swarm orchestration layer.', 
                        stack: ['node', 'gemini'], 
                        lastUpdated: Date.now() - 86400000, 
                        path: '/workspace/gemini-flow' 
                    }
                ];
                this.saveProjects();
            }
        } catch (e) {
            console.error('Failed to load projects', e);
        }
    }

    private saveProjects() {
        if (!fs.exists('/workspace/system')) fs.mkdir('/workspace/system');
        fs.writeFile(PROJECTS_FILE, JSON.stringify(this.projects, null, 2));
    }

    public getProjects() {
        return this.projects;
    }

    public createProject(name: string, description: string, stack: any[]) {
        const id = Math.random().toString(36).substr(2, 9);
        const path = `/workspace/projects/${name.toLowerCase().replace(/\s+/g, '-')}`;
        
        if (!fs.exists(path)) fs.mkdir(path);
        
        // Init files
        fs.writeFile(`${path}/README.md`, `# ${name}\n\n${description}`);
        
        const newProject: Project = {
            id,
            name,
            description,
            stack,
            lastUpdated: Date.now(),
            path
        };
        
        this.projects.unshift(newProject);
        this.saveProjects();
        return newProject;
    }

    // --- Live Collaboration Simulation ---

    private startSimulation() {
        // Initial set
        MOCK_USERS.forEach(u => this.activeCollaborators.set(u.id, { ...u }));

        this.simulationInterval = setInterval(() => {
            this.activeCollaborators.forEach(user => {
                // Randomly change status
                if (Math.random() > 0.7) {
                    const statuses: Collaborator['status'][] = ['online', 'coding', 'idle', 'reviewing'];
                    user.status = statuses[Math.floor(Math.random() * statuses.length)];
                }

                // Randomly move cursor if coding
                if (user.status === 'coding') {
                    user.cursor = {
                        lineNumber: Math.floor(Math.random() * 30) + 1,
                        column: Math.floor(Math.random() * 50) + 1
                    };
                    // Simulate typing event occasionally
                    if (Math.random() > 0.8) {
                        // SILENCED TO PREVENT CHAT SPAM
                        /* 
                        bus.emit('agent-message', { 
                            agent: user.name, 
                            text: `Updated ${user.file || 'file'}...` 
                        });
                        */
                    }
                } else {
                    user.cursor = undefined;
                }
            });
        }, 2000);
    }

    public getCollaborators(): Collaborator[] {
        return Array.from(this.activeCollaborators.values());
    }
}

export const collaboration = new CollaborationService();
