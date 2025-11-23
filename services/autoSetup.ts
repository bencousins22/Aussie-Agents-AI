
import { fs } from './fileSystem';
import { shell } from './shell';
import { bus } from './eventBus';

export const autoSetup = {
    isInstalled: () => {
        return fs.exists('/workspace/gemini-flow/package.json');
    },

    installSystem: async () => {
        bus.emit('shell-output', '[AutoSetup] Starting One-Click Installation...');
        
        // 1. Clone Repo
        bus.emit('shell-output', '[AutoSetup] 1/4 Cloning Core Repository...');
        const cloneRes = await shell.execute('git clone https://github.com/clduab11/gemini-flow.git');
        if (cloneRes.exitCode !== 0) throw new Error(cloneRes.stderr);
        
        // 2. Install Dependencies (Mock)
        bus.emit('shell-output', '[AutoSetup] 2/4 Installing System Dependencies...');
        await shell.execute('apm install @google/genai');
        await shell.execute('apm install isomorphic-git');
        
        // 3. Initialize Environment
        bus.emit('shell-output', '[AutoSetup] 3/4 Initializing Jules Environment...');
        await shell.execute('gemini-flow init --protocols a2a,mcp');
        
        // 4. Create Default Flows
        bus.emit('shell-output', '[AutoSetup] 4/4 Generating Default Workflows...');
        if (!fs.exists('/workspace/flows')) fs.mkdir('/workspace/flows');
        
        // Create a sample flow
        const sampleFlow = {
            id: 'demo-flow',
            name: 'Demo Video Gen',
            nodes: [
                { id: '1', type: 'trigger', label: 'Start', x: 50, y: 100 },
                { id: '2', type: 'action', label: 'Veo3 Gen', prompt: 'Create a 5s video of a futuristic city', x: 250, y: 100 }
            ],
            edges: [{ id: 'e1', source: '1', target: '2' }]
        };
        fs.writeFile('/workspace/flows/Demo_Video_Gen.json', JSON.stringify(sampleFlow, null, 2));

        bus.emit('shell-output', '[AutoSetup] ✅ System Ready!');
    }
};
