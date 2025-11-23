
import React, { useState, useEffect } from 'react';
import { Activity, Trophy, PlayCircle, PauseCircle, DollarSign, History, Settings, X } from 'lucide-react';
import { BotAppConfig, BotInstance } from '../../types';
import { botManager } from '../../services/botManager';
import { bus } from '../../services/eventBus';
import { notify } from '../../services/notification';

interface Props {
    config: BotAppConfig;
}

export const BotAppTemplate: React.FC<Props> = ({ config }) => {
    const [bot, setBot] = useState<BotInstance | undefined>(undefined);
    const [showSettings, setShowSettings] = useState(false);
    
    // Settings State
    const [riskLevel, setRiskLevel] = useState('medium');
    const [maxTrades, setMaxTrades] = useState(3);
    
    // Initialize
    useEffect(() => {
        // Register with manager on mount to ensure it exists
        const id = config.title.replace(/\s+/g, '-').toLowerCase();
        botManager.registerBot(id, config.title, config);
        setBot(botManager.getBot(id));

        const unsub = bus.subscribe(e => {
            if (e.type === 'bot-update' && (e.payload.appId === id || e.payload.type === 'tick')) {
                setBot({ ...botManager.getBot(id)! });
            }
        });
        return () => unsub();
    }, [config]);

    if (!bot) return <div className="p-8 flex items-center justify-center h-full text-gray-500 font-mono text-xs animate-pulse bg-[#0f1216]">Initializing Neural Engine...</div>;

    const toggleStatus = () => {
        const newStatus = bot.status === 'running' ? 'paused' : 'running';
        botManager.setBotStatus(bot.id, newStatus);
    };

    const saveSettings = () => {
        // In a real app, this would update internal logic
        notify.success("Settings Saved", `Bot configuration updated. Risk: ${riskLevel}, Max Trades: ${maxTrades}`);
        setShowSettings(false);
    };

    const formatMoney = (val: number) => {
        return val >= 0 ? `$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`;
    };

    // Construct border class safely
    const borderClass = `border-l-4 ${config.themeColor.replace('bg-', 'border-')}`;

    return (
        <div className="flex flex-col h-full bg-[#0f1216] text-white overflow-hidden font-sans w-full min-h-0 relative">
            {/* App Header */}
            <div className={`h-16 shrink-0 flex items-center justify-between px-4 border-b border-gray-800 bg-[#161b22] ${borderClass} select-none`}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${config.themeColor} text-white`}>
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-sm md:text-base leading-tight truncate">{config.title}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{bot.status}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Net P&L</span>
                        <span className={`font-mono font-bold text-sm ${bot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatMoney(bot.pnl)}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-gray-800 mx-1 hidden md:block"></div>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-full transition-all hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={toggleStatus} 
                        className={`p-2 rounded-full transition-all hover:scale-105 active:scale-95 ${bot.status === 'running' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}
                    >
                        {bot.status === 'running' ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* P&L Card */}
                    <div className="bg-[#1c2128] rounded-xl border border-gray-800 p-5 relative overflow-hidden shadow-lg group">
                        <div className={`absolute top-0 left-0 w-full h-1 ${config.themeColor}`} />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Profit</div>
                                <div className={`text-3xl font-black font-mono ${bot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatMoney(bot.pnl)}
                                </div>
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg">
                                <DollarSign className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="flex gap-4 text-xs relative z-10">
                            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-gray-300 font-medium">{bot.wins} Wins</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-gray-300 font-medium">{bot.losses} Losses</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Stats Card */}
                    <div className="bg-[#1c2128] rounded-xl border border-gray-800 p-5 flex flex-col gap-4 shadow-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Performance</h3>
                            <Activity className={`w-4 h-4 ${config.accentColor}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#0f1216] p-3 rounded-lg border border-gray-800">
                                <div className="text-xl font-bold text-white">{(bot.wins / (bot.wins + bot.losses || 1) * 100).toFixed(1)}%</div>
                                <div className="text-[10px] text-gray-500 font-medium uppercase mt-1">Win Rate</div>
                            </div>
                            <div className="bg-[#0f1216] p-3 rounded-lg border border-gray-800">
                                <div className="text-xl font-bold text-white">{bot.trades.length}</div>
                                <div className="text-[10px] text-gray-500 font-medium uppercase mt-1">Total Trades</div>
                            </div>
                        </div>
                        <div className="mt-auto">
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
                                <span>ROI</span>
                                <span className="text-green-400">{bot.roi.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-[#0f1216] h-2 rounded-full overflow-hidden border border-gray-800">
                                <div className="w-[65%] h-full bg-green-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trade History */}
                <div className="bg-[#1c2128] rounded-xl border border-gray-800 flex flex-col shadow-lg overflow-hidden h-[300px] min-h-[200px]">
                    <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#161b22] shrink-0">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-gray-400" />
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Feed</h3>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase bg-black/20 px-2 py-1 rounded">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Connected
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase bg-[#0f1216] border-b border-gray-800 shrink-0">
                            <div className="col-span-2">Asset</div>
                            <div>Side</div>
                            <div>Amt</div>
                            <div className="text-right">P&L</div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {bot.trades.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                    <Activity className="w-8 h-8 opacity-20" />
                                    <span className="text-xs font-medium italic">Waiting for market signals...</span>
                                </div>
                            )}
                            {bot.trades.map((trade) => (
                                <div key={trade.id} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-white/5 transition-colors text-xs group">
                                    <div className="col-span-2 flex flex-col justify-center min-w-0">
                                        <span className="font-bold text-white truncate">{trade.asset}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${trade.type === 'buy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {trade.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-300 font-mono">${trade.amount}</div>
                                    <div className={`flex items-center justify-end font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.pnl >= 0 ? '+' : ''}{formatMoney(trade.pnl)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
                    <div className="bg-[#161b22] border border-gray-700 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><Settings className="w-4 h-4"/> Bot Settings</h3>
                            <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-gray-500 hover:text-white"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Risk Level</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['low', 'medium', 'high'].map(level => (
                                        <button 
                                            key={level}
                                            onClick={() => setRiskLevel(level)}
                                            className={`py-2 rounded border text-sm font-bold capitalize ${riskLevel === level ? 'bg-aussie-500 text-black border-aussie-500' : 'bg-[#0d1117] text-gray-400 border-gray-700 hover:border-gray-500'}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Max Concurrent Trades</label>
                                <input 
                                    type="number" 
                                    value={maxTrades}
                                    onChange={e => setMaxTrades(parseInt(e.target.value))}
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-aussie-500"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                            <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-bold">Cancel</button>
                            <button onClick={saveSettings} className="px-4 py-2 bg-aussie-500 text-black rounded-lg text-sm font-bold hover:bg-aussie-600">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
