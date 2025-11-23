
import { Widget } from '../types';

const DASHBOARD_KEY = 'aussie_os_dashboard_state_v2';

export type WallpaperType = 'gradient' | 'image' | 'solid';

export interface Wallpaper {
    id: string;
    type: WallpaperType;
    value: string; // CSS class or Image URL
    name: string;
}

export const WALLPAPERS: Wallpaper[] = [
    { id: 'default', name: 'Deep Space', type: 'gradient', value: 'bg-gradient-to-br from-[#14161b] to-[#0f1115]' },
    { id: 'aussie', name: 'Aussie Green', type: 'gradient', value: 'bg-gradient-to-br from-[#0f332e] to-[#0a0c10]' },
    { id: 'ocean', name: 'Ocean Blue', type: 'gradient', value: 'bg-gradient-to-br from-[#0f172a] to-[#1e3a8a]' },
    { id: 'sunset', name: 'Sunset', type: 'gradient', value: 'bg-gradient-to-br from-[#4c1d95] to-[#be185d]' },
    { id: 'midnight', name: 'Midnight', type: 'solid', value: 'bg-[#000000]' },
];

interface DashboardState {
    wallpaper: Wallpaper;
    widgets: Widget[];
}

class DashboardStateService {
    private state: DashboardState;
    private listeners: Set<(state: DashboardState) => void> = new Set();

    constructor() {
        this.state = this.load() || {
            wallpaper: WALLPAPERS[0],
            widgets: [
                { id: 'w1', type: 'clock', x: 1000, y: 40 },
                { id: 'w3', type: 'network', x: 1000, y: 280 }
            ]
        };
    }

    public subscribe(listener: (state: DashboardState) => void): () => void {
        this.listeners.add(listener);
        // Send initial state
        listener(this.state);
        return () => { this.listeners.delete(listener); };
    }

    private notify() {
        this.listeners.forEach(l => l({ ...this.state }));
        this.save();
    }

    private load(): DashboardState | null {
        try {
            const raw = localStorage.getItem(DASHBOARD_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    private save() {
        localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.state));
    }

    public getWidgets(): Widget[] {
        return [...this.state.widgets];
    }

    public addWidget(type: Widget['type'], x: number = 200, y: number = 200) {
        const newWidget: Widget = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x,
            y,
            data: type === 'note' ? { content: '', color: 'bg-[#1c2128]' } : type === 'todo' ? { items: [] } : undefined
        };
        this.state.widgets.push(newWidget);
        this.notify();
        return newWidget;
    }

    public removeWidget(id: string) {
        this.state.widgets = this.state.widgets.filter(w => w.id !== id);
        this.notify();
    }

    public updateWidget(id: string, updates: Partial<Widget>) {
        this.state.widgets = this.state.widgets.map(w => {
            if (w.id === id) {
                const newData = updates.data ? { ...w.data, ...updates.data } : w.data;
                return { ...w, ...updates, data: newData };
            }
            return w;
        });
        this.notify();
    }

    public getWallpaper() {
        return this.state.wallpaper;
    }

    public setWallpaper(wallpaper: Wallpaper) {
        this.state.wallpaper = wallpaper;
        this.notify();
    }
}

export const dashboardState = new DashboardStateService();
