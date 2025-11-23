
import React, { useState, useEffect } from 'react';
import { Activity, Settings, Play, RefreshCw, Zap, TrendingUp, Wallet, ChevronDown, AlertCircle, BarChart } from 'lucide-react';
import { hyperliquid } from '../../services/hyperliquid';
import { notify } from '../../services/notification';

const COINS = ['BTC', 'ETH', 'SOL', 'ARB', 'TIA'];

export const HyperliquidApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'trade' | 'backtest' | 'settings'>('trade');
    const [wallet, setWallet] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [selectedCoin, setSelectedCoin] = useState('BTC');
    const [price, setPrice] = useState(64000);
    const [positions, setPositions] = useState<any[]>([]);
    
    // Trade State
    const [orderSize, setOrderSize] = useState(0.1);
    const [leverage, setLeverage] = useState(10);

    // Backtest State
    const [backtestResult, setBacktestResult] = useState<number[] | null>(null);
    const [isBacktesting, setIsBacktesting] = useState(false);

    useEffect(() => {
        // Mock Live Price Feed
        const interval = setInterval(() => {
            setPrice(prev => prev * (1 + (Math.random() - 0.5) * 0.001));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const connectWallet = () => {
        if (!wallet) {
            notify.error("Connection Failed", "Please enter a wallet address (e.g. 0x...)");
            return;
        }
        hyperliquid.connect(wallet);
        setIsConnected(true);
        notify.success("Hyperliquid", "Connected to Mainnet.");
    };

    const placeOrder = async (side: 'buy' | 'sell') => {
        if (!isConnected) return notify.error("Error", "Connect Wallet first");
        
        try {
            const res = await hyperliquid.postExchange({
                type: 'order',
                orders: [{
                    coin: selectedCoin,
                    is_buy: side === 'buy',
                    sz: orderSize,
                    limit_px: price,
                    order_type: { limit: { tif: 'Gtc' } },
                    reduce_only: false
                }]
            });
            
            if (res.status === 'ok') {
                notify.success("Order Filled", `${side.toUpperCase()} ${orderSize} ${selectedCoin} @ ${price.toFixed(2)}`);
                refreshPositions();
            }
        } catch (e) {
            notify.error("Order Failed", "API Execution Error");
        }
    };

    const refreshPositions = async () => {
        if (!isConnected) return;
        const state = await hyperliquid.getInfo('clearinghouseState');
        if (state && state.assetPositions) {
            setPositions(state.assetPositions);
        }
    };

    const runBacktest = async () => {
        setIsBacktesting(true);
        setBacktestResult(null);
        const res = await hyperliquid.runBacktest({ leverage });
        setBacktestResult(res.equityCurve);
        setIsBacktesting(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#0b0d11] text-white font-sans w-full">
            {/* Header */}
            <div className="h-14 border-b border-gray-800 bg-[#161b22] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-aussie-500 fill-aussie-500" />
                    <span className="font-bold tracking-tight">Hyperliquid Terminal</span>
                    <span className="text-[10px] bg-aussie-500/10 text-aussie-500 px-1.5 py-0.5 rounded font-bold uppercase border border-aussie-500/20">Mainnet</span>
                </div>
                <div className="flex gap-1 bg-[#0f1216] p-1 rounded-lg">
                    {['trade', 'backtest', 'settings'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t as any)}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${activeTab === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                
                {/* TRADE TAB */}
                {activeTab === 'trade' && (
                    <div className="h-full flex flex-col md:flex-row">
                        {/* Left: Chart & Orderbook */}
                        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800">
                            <div className="h-12 border-b border-gray-800 flex items-center px-4 gap-4 bg-[#0f1216]">
                                <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded transition-colors">
                                    <span className="font-bold text-lg">{selectedCoin}-USD</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="font-mono text-xl font-bold text-green-400">${price.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">24h Vol: $142M</div>
                            </div>
                            <div className="flex-1 bg-[#0f1216] relative p-4 flex items-center justify-center text-gray-600 overflow-hidden group">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}></div>
                                <Activity className="w-32 h-32 opacity-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                
                                {/* Mock Depth Chart / Candles */}
                                <div className="w-full h-full flex items-end gap-1 z-10">
                                    {Array.from({length: 60}).map((_, i) => {
                                        const h = Math.max(10, Math.min(90, 50 + Math.sin(i * 0.2) * 30 + (Math.random() - 0.5) * 20));
                                        const isGreen = i > 0 ? h > (50 + Math.sin((i-1) * 0.2) * 30) : true;
                                        return (
                                            <div 
                                                key={i} 
                                                style={{height: `${h}%`}} 
                                                className={`flex-1 rounded-sm opacity-60 hover:opacity-100 transition-opacity ${isGreen ? 'bg-green-500' : 'bg-red-500'}`} 
                                            />
                                        );
                                    })}
                                </div>
                                <span className="absolute bottom-4 right-4 text-xs opacity-50 bg-black/50 px-2 py-1 rounded z-20">Simulated Market Data</span>
                            </div>
                            
                            {/* Positions Panel */}
                            <div className="h-48 border-t border-gray-800 bg-[#161b22] flex flex-col">
                                <div className="px-4 py-2 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
                                    <span>Open Positions</span>
                                    <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">{positions.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {positions.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-600 text-xs italic">No open positions</div>
                                    ) : (
                                        positions.map((p, i) => (
                                            <div key={i} className="px-4 py-2 border-b border-gray-800/50 flex justify-between text-xs font-mono items-center hover:bg-white/5 transition-colors">
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-white font-bold text-sm">{p.position.coin}</span>
                                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">{p.position.leverage}x</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <span className="text-gray-400">{p.position.szi} Sz</span>
                                                    <span className={`font-bold ${p.position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {p.position.unrealizedPnl >= 0 ? '+' : ''}{p.position.unrealizedPnl.toFixed(2)} PnL
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Order Entry */}
                        <div className="w-full md:w-72 bg-[#161b22] flex flex-col p-4 gap-4 shrink-0 border-l border-gray-800">
                            {!isConnected ? (
                                <div className="text-center space-y-4 mt-10">
                                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <p className="text-sm text-gray-400">Connect wallet to trade</p>
                                    <input 
                                        value={wallet} 
                                        onChange={e => setWallet(e.target.value)} 
                                        placeholder="0x..." 
                                        className="w-full bg-black/20 border border-gray-700 rounded-lg p-3 text-xs text-center outline-none focus:border-aussie-500"
                                    />
                                    <button onClick={connectWallet} className="w-full py-2.5 bg-aussie-500 text-black font-bold rounded-lg hover:bg-aussie-600 transition-colors shadow-lg">Connect</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2 p-1 bg-black/20 rounded-lg">
                                        <button className="flex-1 py-2 bg-green-500/20 text-green-400 text-xs font-bold rounded shadow-sm border border-green-500/20">Buy</button>
                                        <button className="flex-1 py-2 hover:bg-white/5 text-gray-400 text-xs font-bold rounded transition-colors">Sell</button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Size ({selectedCoin})</label>
                                            <input 
                                                type="number" 
                                                value={orderSize} 
                                                onChange={e => setOrderSize(parseFloat(e.target.value))}
                                                className="w-full bg-[#0f1216] border border-gray-700 rounded-lg p-3 text-sm text-white outline-none focus:border-aussie-500 transition-colors font-mono" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Leverage ({leverage}x)</label>
                                            <input 
                                                type="range" min="1" max="50" 
                                                value={leverage} 
                                                onChange={e => setLeverage(parseInt(e.target.value))}
                                                className="w-full accent-aussie-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                                            />
                                        </div>
                                    </div>

                                    <button onClick={() => placeOrder('buy')} className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg mt-4 shadow-lg shadow-green-900/20 transition-all active:scale-95">
                                        Buy / Long
                                    </button>
                                    <button onClick={() => placeOrder('sell')} className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-black font-bold rounded-lg shadow-lg shadow-red-900/20 transition-all active:scale-95">
                                        Sell / Short
                                    </button>
                                    
                                    <div className="mt-auto text-xs text-gray-500 text-center border-t border-gray-800 pt-4">
                                        <span className="block mb-1 uppercase tracking-wider font-bold text-[9px]">Available Balance</span>
                                        <span className="font-mono text-white">$10,000.00</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* BACKTEST TAB */}
                {activeTab === 'backtest' && (
                    <div className="p-8 h-full overflow-y-auto bg-[#0f1216]">
                        <div className="max-w-4xl mx-auto w-full space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-3"><TrendingUp className="w-6 h-6 text-aussie-500"/> Strategy Backtester</h2>
                                <button 
                                    onClick={runBacktest}
                                    disabled={isBacktesting}
                                    className="px-6 py-2 bg-aussie-500 text-black font-bold rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-lg hover:bg-aussie-600 transition-all active:scale-95"
                                >
                                    {isBacktesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Run Simulation
                                </button>
                            </div>

                            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
                                <h3 className="font-bold mb-4 text-sm uppercase text-gray-500 tracking-wider">Configuration</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs mb-2 font-bold text-gray-400">Leverage</label>
                                        <input value={leverage} type="number" readOnly className="bg-black/20 border border-gray-700 rounded-lg p-3 w-full text-gray-400 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-2 font-bold text-gray-400">Strategy Type</label>
                                        <select className="bg-black/20 border border-gray-700 rounded-lg p-3 w-full outline-none text-white">
                                            <option>Mean Reversion</option>
                                            <option>Momentum Breakout</option>
                                            <option>Arbitrage</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 min-h-[300px] flex flex-col relative shadow-xl">
                                <h3 className="font-bold mb-4 text-sm uppercase text-gray-500 tracking-wider">Equity Curve</h3>
                                {backtestResult ? (
                                    <div className="flex-1 flex items-end gap-1 border-b border-l border-gray-800 pb-2 pl-2 h-[200px] w-full">
                                        {backtestResult.map((val, i) => {
                                            // Normalize to fit container
                                            const maxVal = Math.max(...backtestResult);
                                            const minVal = Math.min(...backtestResult);
                                            const range = maxVal - minVal || 1;
                                            const height = Math.max(5, ((val - minVal) / range) * 100);
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    style={{ height: `${height}%` }} 
                                                    className="flex-1 bg-aussie-500/50 hover:bg-aussie-500 transition-colors rounded-t-sm relative group min-w-[4px]"
                                                >
                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none border border-gray-700 z-10">
                                                        Day {i}: ${val.toFixed(2)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                                        <BarChart className="w-16 h-16 opacity-20 mb-4" />
                                        <p className="text-sm">Ready to start simulation</p>
                                    </div>
                                )}
                                {backtestResult && (
                                    <div className="mt-6 flex justify-between text-sm font-bold bg-black/20 p-3 rounded-lg border border-gray-800">
                                        <span className="text-gray-400">Start: $10,000</span>
                                        <span className={backtestResult[backtestResult.length-1] >= 10000 ? 'text-green-400' : 'text-red-400'}>
                                            End: ${backtestResult[backtestResult.length-1].toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="p-8 h-full overflow-y-auto bg-[#0f1216]">
                        <div className="max-w-xl mx-auto w-full space-y-6">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Settings className="w-6 h-6"/> Terminal Settings</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-400">API Secret (Mock)</label>
                                    <input type="password" placeholder="••••••••••••••••" className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-4 outline-none focus:border-aussie-500 transition-colors" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-400">Default Leverage</label>
                                    <input type="number" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-4 outline-none focus:border-aussie-500 transition-colors" />
                                </div>

                                <div className="pt-4 border-t border-gray-800">
                                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                        <div className="text-xs text-yellow-200 leading-relaxed">
                                            <strong className="block mb-1 font-bold text-yellow-500">Simulation Mode</strong>
                                            This is a simulated terminal using mock Hyperliquid L1 endpoints.
                                            Real trading requires a backend proxy for signing transactions securely. 
                                            Do not enter real private keys.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
