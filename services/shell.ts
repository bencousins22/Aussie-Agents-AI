
import { fs } from './fileSystem';
import { ShellResult } from '../types';
import { apm } from './packageManager';
import { github } from './github';
import { realGit } from './gitReal';
import { swarm } from './swarm';
import { orchestrator } from './orchestrator';

// --- Polyfills for Node.js Environment in Browser ---

const PathPolyfill = {
    sep: '/',
    delimiter: ':',
    resolve: (...segments: string[]) => {
        let resolvedPath = '';
        let resolvedAbsolute = false;
        for (let i = segments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            const path = i >= 0 ? segments[i] : '/workspace'; // Default to CWD if not absolute
            if (path.length === 0) continue;
            resolvedPath = path + '/' + resolvedPath;
            resolvedAbsolute = path.charCodeAt(0) === 47; // '/'
        }
        // Normalize
        const parts = resolvedPath.split('/').filter(p => p.length !== 0);
        const res = [];
        for (const part of parts) {
            if (part === '..') res.pop();
            else if (part !== '.') res.push(part);
        }
        return '/' + res.join('/');
    },
    join: (...args: string[]) => {
        return args.join('/').replace(/\/+/g, '/');
    },
    basename: (path: string) => path.split('/').pop() || '',
    dirname: (path: string) => {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '/';
    },
    extname: (path: string) => {
        const base = path.split('/').pop() || '';
        const idx = base.lastIndexOf('.');
        return idx > 0 ? base.substring(idx) : '';
    }
};

const OSPolyfill = {
    platform: () => 'linux', // Emulate Linux environment for compatibility
    type: () => 'Linux',
    release: () => '5.4.0-aussie-os',
    arch: () => 'x64',
    cpus: () => Array(navigator.hardwareConcurrency || 4).fill({ model: 'Aussie Virtual CPU', speed: 3000, times: { user: 100, nice: 0, sys: 100, idle: 1000, irq: 0 } }),
    totalmem: () => 8 * 1024 * 1024 * 1024, // Simulate 8GB RAM
    freemem: () => 4 * 1024 * 1024 * 1024,
    homedir: () => '/home/aussie',
    tmpdir: () => '/tmp',
    hostname: () => 'aussie-os',
    networkInterfaces: () => ({ 'eth0': [{ address: '127.0.0.1', family: 'IPv4', internal: false }] }),
    EOL: '\n'
};

class ShellService {
    private cwd: string = '/workspace';
    private env: Record<string, string> = {
        PATH: '/usr/bin:/bin',
        HOME: '/home/aussie',
        USER: 'aussie',
        SHELL: '/bin/vsh',
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
        NODE_ENV: 'production'
    };
    
    public getCwd(): string {
        return this.cwd;
    }

    public async execute(command: string): Promise<ShellResult> {
        const args: string[] = [];
        let current = '';
        let inQuote = false;
        
        for (let i = 0; i < command.length; i++) {
            const char = command[i];
            if (char === '"' || char === "'") {
                inQuote = !inQuote;
            } else if (char === ' ' && !inQuote) {
                if (current) args.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        if (current) args.push(current);

        if (args.length === 0) return { stdout: '', stderr: '', exitCode: 0 };

        const cmd = args[0];
        const params = args.slice(1);

        try {
            switch (cmd) {
                case 'ls': return this.ls(params);
                case 'cd': return this.cd(params);
                case 'pwd': return { stdout: this.cwd, stderr: '', exitCode: 0 };
                case 'cat': return this.cat(params);
                case 'echo': return this.echo(params);
                case 'mkdir': return this.mkdir(params);
                case 'rm': return this.rm(params);
                case 'apm': return await this.apm(params);
                case 'git': return await this.git(params);
                case 'gemini-flow': return await this.geminiFlow(params);
                case 'node': 
                case 'js':
                    return await this.runJs(params);
                case 'help':
                    return { stdout: 'Aussie OS v2.1 Commands:\n  ls, cd, pwd, cat, echo, mkdir, rm\n  apm install <pkg>\n  git <clone|status|init|commit|push>\n  gemini-flow <jules|hive-mind|veo3|imagen4>\n  node <file>', stderr: '', exitCode: 0 };
                default:
                    return { stdout: '', stderr: `vsh: command not found: ${cmd}`, exitCode: 127 };
            }
        } catch (e: any) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    private resolvePath(path: string): string {
        if (!path) return this.cwd;
        if (path.startsWith('/')) return path;
        
        const parts = this.cwd.split('/').filter(p => p);
        const pathParts = path.split('/').filter(p => p);

        for (const part of pathParts) {
            if (part === '.') continue;
            if (part === '..') {
                parts.pop();
            } else {
                parts.push(part);
            }
        }
        const res = '/' + parts.join('/');
        return res === '//' ? '/' : res;
    }

    // --- Commands ---

    private ls(args: string[]): ShellResult {
        const target = args[0] ? this.resolvePath(args[0]) : this.cwd;
        try {
            const files = fs.readDir(target);
            const output = files.map(f => {
                return f.type === 'directory' ? `${f.name}/` : f.name;
            }).join('\n');
            return { stdout: output, stderr: '', exitCode: 0 };
        } catch (e) {
            return { stdout: '', stderr: `ls: cannot access '${target}'`, exitCode: 1 };
        }
    }

    private cd(args: string[]): ShellResult {
        const target = args[0] ? this.resolvePath(args[0]) : '/workspace';
        try {
            fs.readDir(target); 
            this.cwd = target;
            return { stdout: '', stderr: '', exitCode: 0 };
        } catch (e) {
            return { stdout: '', stderr: `cd: no such directory: ${args[0]}`, exitCode: 1 };
        }
    }

    private cat(args: string[]): ShellResult {
        if (!args[0]) return { stdout: '', stderr: 'usage: cat <file>', exitCode: 1 };
        try {
            const content = fs.readFile(this.resolvePath(args[0]));
            return { stdout: content, stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    private echo(args: string[]): ShellResult {
        const redirectIdx = args.indexOf('>');
        let text = '';
        
        if (redirectIdx !== -1) {
            text = args.slice(0, redirectIdx).join(' ');
            const file = args[redirectIdx + 1];
            if (file) {
                fs.writeFile(this.resolvePath(file), text);
                return { stdout: '', stderr: '', exitCode: 0 };
            }
        } else {
            text = args.join(' ');
        }
        return { stdout: text, stderr: '', exitCode: 0 };
    }

    private mkdir(args: string[]): ShellResult {
        if (!args[0]) return { stdout: '', stderr: 'usage: mkdir <path>', exitCode: 1 };
        try {
            fs.mkdir(this.resolvePath(args[0]));
            return { stdout: '', stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    private rm(args: string[]): ShellResult {
        if (!args[0]) return { stdout: '', stderr: 'usage: rm <path>', exitCode: 1 };
        const path = args[0] === '-rf' ? args[1] : args[0];
        if (!path) return { stdout: '', stderr: 'usage: rm <path>', exitCode: 1 };
        
        fs.delete(this.resolvePath(path));
        return { stdout: '', stderr: '', exitCode: 0 };
    }

    private async apm(args: string[]): Promise<ShellResult> {
        if (args[0] !== 'install' || !args[1]) {
            return { stdout: '', stderr: 'usage: apm install <package>', exitCode: 1 };
        }
        try {
            const msg = await apm.install(args[1]);
            return { stdout: msg, stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    private async git(args: string[]): Promise<ShellResult> {
        const sub = args[0];
        
        if (sub === 'clone') {
            const url = args[1];
            if (!url) return { stdout: '', stderr: 'usage: git clone <url>', exitCode: 1 };
            
            const repoName = url.split('/').pop()?.replace('.git', '') || 'repo';
            const targetDir = this.resolvePath(args[2] || repoName);
            
            // Create dir if not exists
            if (!fs.exists(targetDir)) fs.mkdir(targetDir);
            
            const result = await realGit.clone(url, targetDir);
            if ('error' in result && result.error) {
                 return { stdout: '', stderr: String(result.error), exitCode: 1 };
            }
            return { stdout: `Cloned '${url}' into '${targetDir}'`, stderr: '', exitCode: 0 };
        }

        const fullPath = this.resolvePath(args[args.length - 1] === '.' ? '.' : '');

        // Use Real Git Service
        switch(sub) {
            case 'init':
                const resInit = await realGit.init(fullPath);
                if ('error' in resInit && resInit.error) {
                    return { stdout: '', stderr: String(resInit.error), exitCode: 1 };
                }
                return { stdout: 'Initialized Git repo', stderr: '', exitCode: 0 };
            case 'status':
                return await realGit.status(fullPath);
            case 'add':
                return await realGit.add(fullPath, args[1] || '.');
            case 'commit':
                // Simple parsing for -m "msg"
                const mIdx = args.indexOf('-m');
                const msg = mIdx !== -1 ? args[mIdx+1] : 'update';
                return await realGit.commit(fullPath, msg.replace(/['"]/g, ''));
            case 'log':
                return await realGit.log(fullPath);
            default:
                return { stdout: '', stderr: 'git: ' + sub + ' command not fully supported yet.', exitCode: 1 };
        }
    }

    private async geminiFlow(args: string[]): Promise<ShellResult> {
        const sub = args[0];

        if (sub === 'jules') {
            const task = args.slice(3).filter(a => !a.startsWith('--')).join(' ');
            const quantum = args.includes('--quantum');
            
            try {
                const result = await swarm.executeTask(task || "General Task", "feature", { enableQuantum: quantum });
                return { 
                    stdout: result.status === 'success' ? result.message + '\n' + result.details : '',
                    stderr: result.status === 'failure' ? result.message : '', 
                    exitCode: result.status === 'success' ? 0 : 1 
                };
            } catch (e: any) {
                 return { stdout: '', stderr: e.message, exitCode: 1 };
            }
        }

        if (sub === 'hive-mind' || sub === 'swarm') {
            const objective = args.find((a, i) => args[i-1] === '--objective') || 'General objective';
            const result = await swarm.executeTask(objective, "swarm-op", { topology: 'hierarchical' });
             return { 
                stdout: `[HiveMind] Swarm Spawned.\n${result.message}`,
                stderr: '', 
                exitCode: 0 
            };
        }

        if (sub === 'veo3' || sub === 'imagen4' || sub === 'lyria') {
            const prompt = args.find((a, i) => args[i-1] === '--prompt') || 'Demo content';
            const result = await orchestrator.generateMedia(sub, prompt, '{}');
            return {
                stdout: result.status === 'success' ? `Generated: ${result.file}` : '',
                stderr: result.error || '',
                exitCode: result.status === 'success' ? 0 : 1
            };
        }

        if (sub === 'init') {
             return { stdout: 'Initialized gemini-flow with protocols: A2A, MCP', stderr: '', exitCode: 0 };
        }

        return { stdout: '', stderr: 'Usage: gemini-flow <jules|hive-mind|veo3|imagen4|init> ...', exitCode: 1 };
    }

    private async runJs(args: string[]): Promise<ShellResult> {
        if (!args[0]) return { stdout: '', stderr: 'usage: node <file> or js <code>', exitCode: 1 };

        let code = '';
        if (args[0].endsWith('.js')) {
             try {
                 code = fs.readFile(this.resolvePath(args[0]));
             } catch(e) {
                 return { stdout: '', stderr: `File not found: ${args[0]}`, exitCode: 1 };
             }
        } else {
            code = args.join(' ');
        }

        const logs: string[] = [];
        
        // --- Construct the Runtime Environment ---
        
        const mockConsole = {
            log: (...msg: any[]) => logs.push(msg.map(m => String(m)).join(' ')),
            error: (...msg: any[]) => logs.push('[ERR] ' + msg.map(m => String(m)).join(' ')),
            warn: (...msg: any[]) => logs.push('[WARN] ' + msg.map(m => String(m)).join(' ')),
            info: (...msg: any[]) => logs.push('[INFO] ' + msg.map(m => String(m)).join(' '))
        };

        // Process Polyfill
        const mockProcess = {
            env: { ...this.env, API_KEY: process.env.API_KEY || '' },
            cwd: () => this.cwd,
            argv: ['node', ...args],
            exit: (code: number) => { throw new Error(`Process exited with code ${code}`); },
            platform: 'linux',
            nextTick: (fn: any) => setTimeout(fn, 0),
            version: 'v20.11.0'
        };

        // Require Function with Built-in Real Implementations
        const requireLoader = async (pkgName: string) => {
            // 1. Core Node Modules (Polyfilled)
            if (pkgName === 'os') return OSPolyfill;
            if (pkgName === 'path') return PathPolyfill;
            
            if (pkgName === 'fs') {
                return {
                    ...fs.gitFs.promises, // Default to promises
                    // Sync methods mapped to FS service
                    readFileSync: (path: string, enc: any) => fs.readFile(path),
                    writeFileSync: (path: string, data: string) => fs.writeFile(path, data),
                    existsSync: (path: string) => fs.exists(path),
                    mkdirSync: (path: string) => fs.mkdir(path),
                    promises: fs.gitFs.promises
                };
            }
            
            if (pkgName === 'fs/promises') return fs.gitFs.promises;
            
            if (pkgName === 'util') return { 
                promisify: (fn: any) => (...args: any[]) => new Promise((resolve, reject) => {
                    fn(...args, (err: any, res: any) => err ? reject(err) : resolve(res));
                })
            };
            
            if (pkgName === 'events') {
                // Simple EventEmitter Polyfill
                return { 
                    EventEmitter: class EventEmitter { 
                        listeners: Record<string, Function[]> = {};
                        on(ev: string, fn: Function) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); return this; }
                        emit(ev: string, ...args: any[]) { (this.listeners[ev] || []).forEach(fn => fn(...args)); }
                        removeListener(ev: string, fn: Function) { if(this.listeners[ev]) this.listeners[ev] = this.listeners[ev].filter(f => f !== fn); }
                    } 
                };
            }
            
            if (pkgName === 'child_process') {
                // Map exec to Aussie Shell
                return {
                    exec: (cmd: string, cb: any) => {
                        this.execute(cmd).then(res => {
                            if (cb) cb(res.exitCode === 0 ? null : new Error(res.stderr), res.stdout, res.stderr);
                        });
                    },
                    spawn: () => { logs.push("[WARN] spawn not supported in browser, use exec"); return { on: () => {}, stdout: { on: () => {} }, stderr: { on: () => {} } }; }
                };
            }

            // 2. Internal Services
            if (pkgName === '@clduab11/gemini-flow') {
                 return { 
                     GitHubA2AIntegrationManager: class Mock { async initialize() {} async processGitHubOperation() { return "op-123"; } },
                     GoogleAIOrchestrator: class Mock { async createWorkflow() { return { status: 'created' }; } }
                 };
            }

            // 3. External Packages (via APM/ESM)
            const url = apm.getPackageUrl(pkgName);
            if (url) {
                return await import(/* @vite-ignore */ url);
            }
            
            // Fallback: Try to install on the fly?
            try {
                await apm.install(pkgName);
                const newUrl = apm.getPackageUrl(pkgName);
                if (newUrl) return await import(/* @vite-ignore */ newUrl);
            } catch(e) {}

            throw new Error(`Package '${pkgName}' not found. Run 'apm install ${pkgName}' first.`);
        };

        try {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            // We inject 'require' as a function that returns a promise (async require)
            // Users must use `const fs = await require('fs')` in this env, OR we can wrap it.
            // But for compatibility with "CommonJS" style code that expects sync require, we are limited.
            // However, 'node' runtime here is async.
            
            const fn = new AsyncFunction('console', 'process', 'require', 'module', 'exports', code);
            
            const module = { exports: {} };
            
            await fn(mockConsole, mockProcess, requireLoader, module, module.exports);
            
            return { stdout: logs.join('\n'), stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: logs.join('\n'), stderr: `Runtime Error: ${e.message}`, exitCode: 1 };
        }
    }
}

export const shell = new ShellService();
