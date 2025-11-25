/**
 * Hyperliquid API client that works in both browser (via Vite env)
 * and Node (via HYPERLIQUID_API env). Intended for real API access
 * through a proxy or direct endpoint.
 */

export interface HlOrder {
    coin: string;
    is_buy: boolean;
    sz: number;
    limit_px: number;
    order_type: { limit: { tif: 'Gtc' } };
    reduce_only: boolean;
}

class HyperliquidService {
    private walletAddress: string | null = null;
    private baseUrl: string | null;
    private extraHeaders: Record<string, string> = {};

    constructor() {
        const browserBase = (import.meta as any)?.env?.VITE_HYPERLIQUID_API;
        const nodeBase = typeof process !== 'undefined' ? process.env.HYPERLIQUID_API : undefined;
        this.baseUrl = nodeBase || browserBase || null;
    }

    public isConfigured() {
        return !!this.baseUrl;
    }

    private ensureConfigured() {
        if (!this.baseUrl) {
            throw new Error('Hyperliquid API not configured. Set VITE_HYPERLIQUID_API to a proxy/endpoint.');
        }
    }

    public connect(wallet: string) {
        this.walletAddress = wallet;
        return { status: 'connected', account: wallet };
    }

    /**
     * Configure the client at runtime (useful for Node bot).
     */
    public configure(config: { apiBase?: string; headers?: Record<string, string>; wallet?: string }) {
        if (config.apiBase) this.baseUrl = config.apiBase;
        if (config.headers) this.extraHeaders = config.headers;
        if (config.wallet) this.walletAddress = config.wallet;
    }

    public async getInfo(type: 'meta' | 'spotMeta' | 'clearinghouseState'): Promise<any> {
        this.ensureConfigured();
        const res = await fetch(`${this.baseUrl}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.extraHeaders },
            body: JSON.stringify({ type, wallet: this.walletAddress })
        });
        if (!res.ok) throw new Error(`Hyperliquid info failed: ${res.status}`);
        return res.json();
    }

    public async postExchange(action: any): Promise<any> {
        this.ensureConfigured();
        const res = await fetch(`${this.baseUrl}/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.extraHeaders },
            body: JSON.stringify(action)
        });
        if (!res.ok) throw new Error(`Hyperliquid exchange failed: ${res.status}`);
        return res.json();
    }

    public async runBacktest(strategyParams: any): Promise<{ equityCurve: number[] }> {
        this.ensureConfigured();
        const res = await fetch(`${this.baseUrl}/backtest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.extraHeaders },
            body: JSON.stringify(strategyParams)
        });
        if (!res.ok) throw new Error(`Hyperliquid backtest failed: ${res.status}`);
        return res.json();
    }
}

export const hyperliquid = new HyperliquidService();
