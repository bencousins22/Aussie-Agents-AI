
import git from 'isomorphic-git';
import { fs } from './fileSystem';
import { bus } from './eventBus';
import { GEMINI_FLOW_FILES } from './repoHydrator';
import { GitStatusItem } from '../types';

/**
 * Real Git Service
 * Uses isomorphic-git to perform actual git operations against the VFS.
 */
class RealGitService {
    private fsAdapter: any;

    constructor() {
        this.fsAdapter = fs.gitFs;
    }

    public async clone(url: string, dir: string = '/workspace') {
        bus.emit('shell-output', `Cloning into '${dir}'...`);
        
        try {
            // Since we are in a browser without a proxy, we cannot hit GitHub directly.
            // We will perform a "Hydrated Clone" if it's the known repo.
            if (url.includes('gemini-flow')) {
                // 1. Init
                await this.init(dir);
                
                // 2. Hydrate Files
                for (const [filepath, content] of Object.entries(GEMINI_FLOW_FILES)) {
                    const fullPath = `${dir}/${filepath}`;
                    // Ensure dir exists for nested files
                    const dirName = fullPath.substring(0, fullPath.lastIndexOf('/'));
                    if (!fs.exists(dirName)) {
                        // Naive recursive mkdir for simulation
                        const parts = dirName.split('/').filter(p => p);
                        let current = '/';
                        for (const p of parts) {
                            current += (current === '/' ? '' : '/') + p;
                            if (!fs.exists(current)) fs.mkdir(current);
                        }
                    }
                    fs.writeFile(fullPath, content);
                }

                // 3. Add & Commit to make it a real repo
                await this.add(dir, '.');
                await this.commit(dir, 'Initial clone from GitHub');
                
                bus.emit('shell-output', `remote: Enumerating objects: 45, done.`);
                bus.emit('shell-output', `remote: Total 45 (delta 0), reused 0 (delta 0), pack-reused 45`);
                bus.emit('shell-output', `Unpacking objects: 100% (45/45), 12.40 KiB | 1.55 MiB/s, done.`);
                return { success: true };
            } else {
                return { error: "CORS Proxy required for external git clone. (Only gemini-flow repo is pre-cached in this demo)" };
            }
        } catch (e: any) {
            return { error: e.message };
        }
    }

    public async init(dir: string = '/workspace') {
        try {
            await git.init({
                fs: this.fsAdapter,
                dir
            });
            bus.emit('shell-output', `Initialized empty Git repository in ${dir}/.git/`);
            return { success: true };
        } catch (e: any) {
            return { error: e.message };
        }
    }

    public async status(dir: string = '/workspace') {
        try {
            const status = await git.statusMatrix({
                fs: this.fsAdapter,
                dir
            });
            // status is [filepath, head, worktree, stage]
            
            const formatted = status.map(([filepath, head, worktree, stage]) => {
                let state = '';
                if (head === 0 && worktree === 2) state = 'New';
                else if (head === 1 && worktree === 2) state = 'Modified';
                else if (head === 1 && worktree === 0) state = 'Deleted';
                else if (head === 1 && worktree === 1 && stage === 1) state = 'Unmodified';
                else state = `Unknown (${head},${worktree},${stage})`;
                return `${filepath}: ${state}`;
            }).filter(s => !s.includes('Unmodified')).join('\n');

            return { stdout: formatted || 'On branch main\nNothing to commit, working tree clean', stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    public async getStatusJson(dir: string = '/workspace'): Promise<GitStatusItem[]> {
        try {
            const status = await git.statusMatrix({
                fs: this.fsAdapter,
                dir
            });

            const items: GitStatusItem[] = [];
            for (const [filepath, head, worktree, stage] of status) {
                if (head === 1 && worktree === 1 && stage === 1) continue; // Unmodified
                
                let type: GitStatusItem['status'] = 'unmodified';
                if (head === 0 && worktree === 2) type = 'new';
                else if (head === 1 && worktree === 2) type = 'modified';
                else if (head === 1 && worktree === 0) type = 'deleted';

                items.push({
                    path: filepath,
                    status: type,
                    staged: stage === 2 || (head === 0 && stage === 2) // simplified staged check
                });
            }
            return items;
        } catch (e) {
            return [];
        }
    }

    public async add(dir: string = '/workspace', filepath: string = '.') {
        try {
            await git.add({
                fs: this.fsAdapter,
                dir,
                filepath
            });
            return { stdout: '', stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    public async commit(dir: string = '/workspace', message: string) {
        try {
            const sha = await git.commit({
                fs: this.fsAdapter,
                dir,
                message,
                author: {
                    name: 'Aussie Agent',
                    email: 'agent@aussie.os'
                }
            });
            return { stdout: `[main ${sha.slice(0,7)}] ${message}`, stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: '', stderr: e.message, exitCode: 1 };
        }
    }

    public async log(dir: string = '/workspace') {
        try {
            const commits = await git.log({
                fs: this.fsAdapter,
                dir,
                depth: 10
            });
            const output = commits.map(c => {
                return `commit ${c.oid.slice(0,7)}\nAuthor: ${c.commit.author.name}\nDate: ${new Date(c.commit.author.timestamp * 1000).toISOString()}\n\n    ${c.commit.message}\n`;
            }).join('\n');
            return { stdout: output, stderr: '', exitCode: 0 };
        } catch (e: any) {
            return { stdout: '', stderr: `fatal: ${e.message}`, exitCode: 128 };
        }
    }
}

export const realGit = new RealGitService();
