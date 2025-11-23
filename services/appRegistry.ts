
import { AppDefinition, BotAppConfig } from '../types';
import { Trophy, Activity, Users, Zap, Box, Layers } from 'lucide-react';
import { bus } from './eventBus';
import { BotAppTemplate } from '../components/apps/BotAppTemplate';
import { BotDashboard } from '../components/apps/BotDashboard';
import { HyperliquidApp } from '../components/apps/HyperliquidApp';

const REGISTRY_STORAGE_KEY = 'aussie_os_app_registry_v1';

class AppRegistryService {
    private apps: Map<string, AppDefinition> = new Map();

    constructor() {
        this.registerDefaults();
        this.loadFromStorage();
    }

    private registerDefaults() {
        const defaults: AppDefinition[] = [
            {
                id: 'hyperliquid-terminal',
                name: 'Hyperliquid Terminal',
                description: 'Professional high-frequency trading terminal for Hyperliquid L1. Features backtesting and live execution simulation.',
                category: 'finance',
                version: '1.2.0',
                author: 'Jules System',
                installed: true,
                icon: Zap,
                price: '$0.00',
                component: HyperliquidApp
            },
            {
                id: 'bot-dashboard',
                name: 'Command Center',
                description: 'Central hub for managing all active trading bots and P&L.',
                category: 'finance',
                version: '1.0.0',
                author: 'Jules System',
                installed: true,
                icon: Layers,
                price: '$0.00',
                component: BotDashboard
            },
            { 
                id: 'nba-bot', 
                name: 'NBA Courtside AI', 
                description: 'Real-time NBA prediction and stats engine.', 
                category: 'sports', 
                version: '2.1.0', 
                author: 'Aussie Sports', 
                installed: false, 
                icon: Trophy, 
                price: '$0.00', 
                component: BotAppTemplate,
                botConfig: { sport: 'nba', title: 'NBA Courtside', themeColor: 'bg-orange-500', accentColor: 'text-orange-500' }
            },
            { 
                id: 'soccer-bot', 
                name: 'Global Soccer Scout', 
                description: 'Live match tracking for EPL, La Liga, and MLS.', 
                category: 'sports', 
                version: '1.4.2', 
                author: 'Aussie Sports', 
                installed: false, 
                icon: Activity, 
                price: '$0.00', 
                component: BotAppTemplate,
                botConfig: { sport: 'soccer', title: 'Soccer Scout', themeColor: 'bg-green-500', accentColor: 'text-green-500' }
            },
            { 
                id: 'nfl-bot', 
                name: 'Gridiron Analytics', 
                description: 'Advanced NFL stats and play prediction.', 
                category: 'sports', 
                version: '3.0.1', 
                author: 'Aussie Sports', 
                installed: false, 
                icon: Users, 
                price: '$0.00', 
                component: BotAppTemplate,
                botConfig: { sport: 'nfl', title: 'Gridiron AI', themeColor: 'bg-blue-600', accentColor: 'text-blue-500' }
            },
            { 
                id: 'tennis-bot', 
                name: 'Ace Tennis Tracker', 
                description: 'Point-by-point analysis for Grand Slams.', 
                category: 'sports', 
                version: '1.0.5', 
                author: 'Aussie Sports', 
                installed: false, 
                icon: Activity, 
                price: '$0.00', 
                component: BotAppTemplate,
                botConfig: { sport: 'tennis', title: 'Ace Tracker', themeColor: 'bg-yellow-500', accentColor: 'text-yellow-500' }
            },
            { 
                id: 'tt-bot', 
                name: 'Ping Pong Pro', 
                description: 'Table tennis live scoring and tournament brackets.', 
                category: 'sports', 
                version: '1.1.0', 
                author: 'Aussie Sports', 
                installed: false, 
                icon: Trophy, 
                price: '$0.00', 
                component: BotAppTemplate,
                botConfig: { sport: 'tt', title: 'Ping Pong Pro', themeColor: 'bg-purple-500', accentColor: 'text-purple-500' }
            },
        ];

        defaults.forEach(app => this.apps.set(app.id, app));
    }

    private loadFromStorage() {
        try {
            const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
            if (raw) {
                const storedApps: any[] = JSON.parse(raw);
                storedApps.forEach(stored => {
                    const existing = this.apps.get(stored.id);
                    if (existing) {
                        existing.installed = stored.installed;
                    } else {
                        // Restore Custom Apps
                        const newApp: AppDefinition = {
                            ...stored,
                            component: BotAppTemplate,
                            icon: Zap
                        };
                        this.apps.set(stored.id, newApp);
                    }
                });
            }
        } catch (e) {
            console.error("Failed to load app registry", e);
        }
    }

    private saveToStorage() {
        try {
            const exportable = Array.from(this.apps.values()).map(app => ({
                id: app.id,
                name: app.name,
                description: app.description,
                category: app.category,
                version: app.version,
                author: app.author,
                installed: app.installed,
                price: app.price,
                botConfig: app.botConfig
            }));
            localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(exportable));
        } catch (e) {
            console.error("Failed to save app registry", e);
        }
    }

    public getAll(): AppDefinition[] {
        return Array.from(this.apps.values());
    }

    public get(id: string): AppDefinition | undefined {
        return this.apps.get(id);
    }

    public setInstalled(id: string, installed: boolean) {
        const app = this.apps.get(id);
        if (app) {
            app.installed = installed;
            this.apps.set(id, app);
            this.saveToStorage();
            bus.emit('app-installed', { id, installed });
        }
    }

    public createBotApp(config: { name: string, description: string, sport: string, themeColor?: string }): AppDefinition {
        const id = config.name.toLowerCase().replace(/\s+/g, '-') + '-bot-' + Date.now().toString().slice(-4);
        
        const newApp: AppDefinition = {
            id,
            name: config.name,
            description: config.description,
            category: 'sports',
            version: '1.0.0',
            author: 'Jules Agent',
            installed: true, // Auto install custom bots
            icon: Zap,
            price: '$0.00',
            component: BotAppTemplate,
            botConfig: {
                sport: config.sport,
                title: config.name,
                themeColor: config.themeColor || 'bg-aussie-500',
                accentColor: config.themeColor?.replace('bg-', 'text-') || 'text-aussie-500'
            }
        };

        this.apps.set(id, newApp);
        this.saveToStorage();
        bus.emit('app-created', { app: newApp });
        return newApp;
    }
}

export const appRegistry = new AppRegistryService();
