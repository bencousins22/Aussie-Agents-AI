import { fs } from './fileSystem';
import { wm } from './windowManager';
import { scheduler } from './scheduler';
import { shell } from './shell';
import { notify } from './notification';
import { bus } from './eventBus';
import { FileStat, OSWindow, ScheduledTask } from '../types';

type FsAccess = 'none' | 'read' | 'readwrite';
type ShellAccess = 'allow' | 'deny';
type NetworkAccess = 'allow' | 'deny';

export interface KernelPermissions {
    fs: FsAccess;
    shell: ShellAccess;
    network: NetworkAccess;
    notifications: boolean;
    sandboxed: boolean;
}

export interface KernelFS {
    readFile(path: string): string;
    writeFile(path: string, content: string, opts?: { append?: boolean }): void;
    list(path: string): FileStat[];
    stat(path: string): FileStat;
    mkdir(path: string): void;
    delete(path: string): void;
    move(src: string, dest: string): void;
}

export interface KernelWindows {
    open(appId: string, title: string, props?: any): void;
    close(id: string): void;
    focus(id: string): void;
    move(id: string, x: number, y: number): void;
    resize(id: string, width: number, height: number): void;
    list(): OSWindow[];
}

export interface KernelScheduler {
    tasks(): ScheduledTask[];
    add(task: Omit<ScheduledTask, 'id' | 'lastRun' | 'status'>): ScheduledTask;
    remove(id: string): void;
}

export interface KernelShell {
    exec(cmd: string): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

export interface KernelNotify {
    success(title: string, message: string): void;
    error(title: string, message: string): void;
    info(title: string, message: string): void;
    warning(title: string, message: string): void;
}

export interface KernelSystem {
    sandboxed: boolean;
    capabilities: KernelPermissions;
    on(event: string, listener: (payload: any) => void): () => void;
}

export interface KernelAPI {
    fs: KernelFS;
    windows: KernelWindows;
    scheduler: KernelScheduler;
    shell: KernelShell;
    notify: KernelNotify;
    system: KernelSystem;
}

const guard = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
};

export const createKernel = (permissions: Partial<KernelPermissions> = {}): KernelAPI => {
    const caps: KernelPermissions = {
        fs: 'readwrite',
        shell: 'allow',
        network: 'allow',
        notifications: true,
        sandboxed: false,
        ...permissions
    };

    const fsAdapter: KernelFS = {
        readFile: (path) => {
            guard(caps.fs !== 'none', 'FS read not permitted in sandbox');
            return fs.readFile(path);
        },
        writeFile: (path, content, opts) => {
            guard(caps.fs === 'readwrite', 'FS write not permitted in sandbox');
            fs.writeFile(path, content, opts?.append);
        },
        list: (path) => {
            guard(caps.fs !== 'none', 'FS read not permitted in sandbox');
            return fs.readDir(path);
        },
        stat: (path) => {
            guard(caps.fs !== 'none', 'FS read not permitted in sandbox');
            const parts = path.split('/').filter(Boolean);
            const name = parts.pop();
            const parent = '/' + (parts.join('/') || '');
            const node = name ? fs.readDir(parent === '//' ? '/' : parent).find(f => f.name === name) : null;
            if (!node) throw new Error(`Path not found: ${path}`);
            return node;
        },
        mkdir: (path) => {
            guard(caps.fs === 'readwrite', 'FS write not permitted in sandbox');
            fs.mkdir(path);
        },
        delete: (path) => {
            guard(caps.fs === 'readwrite', 'FS write not permitted in sandbox');
            fs.delete(path);
        },
        move: (src, dest) => {
            guard(caps.fs === 'readwrite', 'FS write not permitted in sandbox');
            fs.move(src, dest);
        }
    };

    const windowsAdapter: KernelWindows = {
        open: (appId, title, props) => wm.openWindow(appId, title, props),
        close: (id) => wm.closeWindow(id),
        focus: (id) => wm.focusWindow(id),
        move: (id, x, y) => wm.moveWindow(id, x, y),
        resize: (id, width, height) => wm.resizeWindow(id, width, height),
        list: () => wm.getWindows()
    };

    const schedulerAdapter: KernelScheduler = {
        tasks: () => scheduler.getTasks(),
        add: (task) => {
            guard(caps.fs === 'readwrite', 'Scheduler requires write access');
            return scheduler.addTask(task);
        },
        remove: (id) => {
            guard(caps.fs === 'readwrite', 'Scheduler requires write access');
            scheduler.removeTask(id);
        }
    };

    const shellAdapter: KernelShell = {
        exec: async (cmd) => {
            guard(caps.shell === 'allow', 'Shell access is disabled in sandbox');
            return shell.execute(cmd);
        }
    };

    const notifyAdapter: KernelNotify = {
        success: (t, m) => { if (caps.notifications) notify.success(t, m); },
        error: (t, m) => { if (caps.notifications) notify.error(t, m); },
        info: (t, m) => { if (caps.notifications) notify.info(t, m); },
        warning: (t, m) => { if (caps.notifications) notify.warning(t, m); }
    };

    const systemAdapter: KernelSystem = {
        sandboxed: caps.sandboxed,
        capabilities: caps,
        on: (event, listener) => bus.subscribe((e) => { if (e.type === event) listener(e.payload); })
    };

    return {
        fs: fsAdapter,
        windows: windowsAdapter,
        scheduler: schedulerAdapter,
        shell: shellAdapter,
        notify: notifyAdapter,
        system: systemAdapter
    };
};

class KernelManager {
    private permissions: KernelPermissions;
    private kernelApi: KernelAPI;

    constructor() {
        this.permissions = {
            fs: 'readwrite',
            shell: 'allow',
            network: 'allow',
            notifications: true,
            sandboxed: false
        };
        this.kernelApi = createKernel(this.permissions);
        this.expose();
    }

    private expose() {
        if (typeof window !== 'undefined') {
            (window as any).__AUSSIE_KERNEL__ = this.kernelApi;
        }
    }

    public getKernel() {
        return this.kernelApi;
    }

    public getPermissions() {
        return this.permissions;
    }

    public setPermissions(next: Partial<KernelPermissions>) {
        this.permissions = { ...this.permissions, ...next };
        this.kernelApi = createKernel(this.permissions);
        this.expose();
        bus.emit('kernel-permissions-changed', this.permissions);
        return this.kernelApi;
    }
}

export const kernelManager = new KernelManager();
export const kernel = kernelManager.getKernel();

declare global {
    interface Window {
        __AUSSIE_KERNEL__?: KernelAPI;
    }
}
