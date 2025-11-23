
import { BotInstance, BotAppConfig, Trade } from '../types';
import { bus } from './eventBus';

/**
 * BotManager Service
 * Centralizes the state of all trading bots (NBA, Soccer, etc.)
 * Aggregates P&L and manages the "Stacking" of bots.
 */
class BotManagerService {
    private bots: Map<string, BotInstance> = new Map();
    private simulationInterval: any = null;

    constructor() {
        this.startSimulation();
    }

    public registerBot(appId: string, name: string, config: BotAppConfig) {
        if (!this.bots.has(appId)) {
            this.bots.set(appId, {
                id: appId,
                name,
                status: 'stopped',
                pnl: 0,
                roi: 0,
                wins: 0,
                losses: 0,
                activeTrades: 0,
                trades: [],
                config
            });
        }
    }

    public updateBotConfig(appId: string, newConfig: Partial<BotAppConfig>) {
        const bot = this.bots.get(appId);
        if (bot) {
            bot.config = { ...bot.config, ...newConfig };
            this.bots.set(appId, bot);
            bus.emit('bot-update', { appId, bot });
        }
    }

    public getBot(appId: string): BotInstance | undefined {
        return this.bots.get(appId);
    }

    public getAllBots(): BotInstance[] {
        return Array.from(this.bots.values());
    }

    public getTotalPnl(): number {
        let total = 0;
        this.bots.forEach(bot => total += bot.pnl);
        return total;
    }

    public getTotalStats() {
        let pnl = 0;
        let active = 0;
        let wins = 0;
        let losses = 0;
        
        this.bots.forEach(bot => {
            pnl += bot.pnl;
            if (bot.status === 'running') active++;
            wins += bot.wins;
            losses += bot.losses;
        });

        return { pnl, active, wins, losses };
    }

    public setBotStatus(appId: string, status: 'running' | 'paused' | 'stopped') {
        const bot = this.bots.get(appId);
        if (bot) {
            bot.status = status;
            this.bots.set(appId, bot);
            bus.emit('bot-update', { appId, bot });
        }
    }

    private startSimulation() {
        if (this.simulationInterval) return;

        this.simulationInterval = setInterval(() => {
            this.bots.forEach(bot => {
                if (bot.status !== 'running') return;

                // 1. Randomly place a trade if not too many open
                if (Math.random() > 0.7 && bot.activeTrades < 3) {
                    this.placeTrade(bot);
                }

                // 2. Randomly resolve open trades
                // (In this sim, we just resolve immediately for simplicity of the loop)
            });
            
            // Force UI Update
            bus.emit('bot-update', { type: 'tick' });

        }, 2000);
    }

    private placeTrade(bot: BotInstance) {
        // Simulate Trade Logic
        const amount = Math.floor(Math.random() * 100) + 50; // $50 - $150 bet
        const isWin = Math.random() > 0.45; // 55% win rate (good bot!)
        const profit = isWin ? amount * 0.9 : -amount; // 90% payout or loss

        const trade: Trade = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            amount,
            asset: bot.config.sport.toUpperCase() + ' Match',
            pnl: profit,
            status: isWin ? 'won' : 'lost'
        };

        // Update Bot State
        bot.pnl += profit;
        bot.trades.unshift(trade);
        if (bot.trades.length > 20) bot.trades.pop(); // Keep last 20
        
        if (isWin) bot.wins++;
        else bot.losses++;

        // Rough ROI calc based on average trade size ($100)
        const totalInvested = (bot.wins + bot.losses) * 100;
        bot.roi = totalInvested > 0 ? (bot.pnl / totalInvested) * 100 : 0;

        this.bots.set(bot.id, bot);
        bus.emit('bot-update', { appId: bot.id, trade });
    }
}

export const botManager = new BotManagerService();
