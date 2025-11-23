
/**
 * Hyperliquid API Mock Service
 * Simulates the functionality of the Hyperliquid L1 for high-frequency trading.
 */

export interface HlOrder {
    coin: string;
    is_buy: boolean;
    sz: number;
    limit_px: number;
    order_type: { limit: { tif: 'Gtc' } };
    reduce_only: boolean;
}

export interface HlPosition {
    coin: string;
    szi: number; // size
    entry_px: number;
    position_value: number;
    unrealized_pnl: number;
    leverage: number;
}

class HyperliquidService {
    private walletAddress: string | null = null;
    private positions: HlPosition[] = [];
    
    public connect(wallet: string) {
        this.walletAddress = wallet;
        return { status: 'connected', account: wallet };
    }

    public async getInfo(type: 'meta' | 'spotMeta' | 'clearinghouseState'): Promise<any> {
        // Simulating POST https://api.hyperliquid.xyz/info
        await new Promise(r => setTimeout(r, 300)); // Network latency

        if (type === 'meta') {
            return {
                universe: [
                    { name: 'BTC', szDecimals: 5, maxLeverage: 50 },
                    { name: 'ETH', szDecimals: 4, maxLeverage: 50 },
                    { name: 'SOL', szDecimals: 2, maxLeverage: 25 },
                ]
            };
        }
        
        if (type === 'clearinghouseState') {
            if (!this.walletAddress) throw new Error("Wallet not connected");
            return {
                marginSummary: {
                    accountValue: 10000.00,
                    totalMarginUsed: this.positions.reduce((acc, p) => acc + (p.position_value / p.leverage), 0),
                    totalNtlPos: this.positions.reduce((acc, p) => acc + p.position_value, 0),
                    totalRawUsd: 10000.00
                },
                crossMarginSummary: {
                    accountValue: 10000.00,
                    totalMarginUsed: 0,
                    totalNtlPos: 0,
                },
                assetPositions: this.positions.map(p => ({
                    position: {
                        coin: p.coin,
                        szi: p.szi,
                        entryPx: p.entry_px,
                        positionValue: p.position_value,
                        returnOnEquity: 0.05, // Mock ROE
                        unrealizedPnl: p.unrealized_pnl
                    }
                }))
            };
        }
    }

    public async postExchange(action: any): Promise<any> {
        // Simulating POST https://api.hyperliquid.xyz/exchange
        await new Promise(r => setTimeout(r, 500));
        
        if (action.type === 'order') {
            const order = action.orders[0];
            // Mock execution
            const filledPx = order.limit_px; 
            const newPos: HlPosition = {
                coin: order.coin,
                szi: order.sz * (order.is_buy ? 1 : -1),
                entry_px: filledPx,
                position_value: order.sz * filledPx,
                unrealized_pnl: (Math.random() * 10) - 2, // Random slight PnL
                leverage: 10
            };
            this.positions.push(newPos);
            
            return {
                status: 'ok',
                response: {
                    type: 'order',
                    data: {
                        statuses: [{ filled: { totalSz: order.sz, avgPx: filledPx, oid: Math.floor(Math.random() * 100000) } }]
                    }
                }
            };
        }
        
        throw new Error("Unknown action type");
    }

    public async runBacktest(strategyParams: any): Promise<{ equityCurve: number[] }> {
        // Simulating a backtest engine run
        const days = 30;
        const startEquity = 10000;
        let equity = startEquity;
        const curve = [equity];
        
        const volatility = strategyParams.leverage * 0.02; // Higher leverage = wilder swings

        for (let i = 0; i < days; i++) {
            const dailyReturn = (Math.random() - 0.45) * volatility; // Slight positive bias
            equity = equity * (1 + dailyReturn);
            curve.push(equity);
        }
        
        await new Promise(r => setTimeout(r, 2000)); // Compute time
        return { equityCurve: curve };
    }
}

export const hyperliquid = new HyperliquidService();
