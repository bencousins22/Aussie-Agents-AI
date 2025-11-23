
import { OSWindow } from '../types';

class WindowManagerService {
    private windows: OSWindow[] = [];
    private listeners: Set<(windows: OSWindow[]) => void> = new Set();
    private topZIndex = 100;

    public subscribe(listener: (windows: OSWindow[]) => void): () => void {
        this.listeners.add(listener);
        listener(this.windows);
        return () => { this.listeners.delete(listener); };
    }

    private notify() {
        this.listeners.forEach(l => l([...this.windows]));
    }

    public openWindow(appId: string, title: string, props?: any) {
        // Check if already open
        const existing = this.windows.find(w => w.appId === appId);
        if (existing) {
            this.focusWindow(existing.id);
            if (existing.isMinimized) this.minimizeWindow(existing.id, false);
            return;
        }

        this.topZIndex++;
        const newWindow: OSWindow = {
            id: Math.random().toString(36).substr(2, 9),
            appId,
            title,
            x: 50 + (this.windows.length * 20),
            y: 50 + (this.windows.length * 20),
            width: 400,
            height: 500,
            isMinimized: false,
            isMaximized: false,
            zIndex: this.topZIndex,
            props
        };

        this.windows.push(newWindow);
        this.notify();
    }

    public closeWindow(id: string) {
        this.windows = this.windows.filter(w => w.id !== id);
        this.notify();
    }

    public focusWindow(id: string) {
        this.topZIndex++;
        this.windows = this.windows.map(w => 
            w.id === id ? { ...w, zIndex: this.topZIndex } : w
        );
        this.notify();
    }

    public moveWindow(id: string, x: number, y: number) {
        this.windows = this.windows.map(w => 
            w.id === id ? { ...w, x, y } : w
        );
        this.notify();
    }

    public resizeWindow(id: string, width: number, height: number) {
        this.windows = this.windows.map(w => 
            w.id === id ? { ...w, width, height } : w
        );
        this.notify();
    }

    public minimizeWindow(id: string, minimized: boolean) {
        this.windows = this.windows.map(w => 
            w.id === id ? { ...w, isMinimized: minimized } : w
        );
        this.notify();
    }

    public maximizeWindow(id: string) {
        this.windows = this.windows.map(w => 
            w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
        );
        this.notify();
    }

    public getWindows() {
        return this.windows;
    }
}

export const wm = new WindowManagerService();
