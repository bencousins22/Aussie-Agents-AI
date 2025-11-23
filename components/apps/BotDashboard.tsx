
import React, { useState, useEffect } from 'react';
import { botManager } from '../../services/botManager';
import { bus } from '../../services/eventBus';
import { BotInstance } from '../../types';
import { TrendingUp, Activity, DollarSign, Pause, Play, Layers, Shield, ArrowUpRight, ArrowRight, Wallet } from 'lucide-react';
import { wm } from '../../services/windowManager';

export const BotDashboard: React.FC = () => {
    const [bots, setBots] = useState<BotInstance[]>([]);
    const [summary, setSummary] = useState({ pnl: 0, active: 0, wins: 0, losses: 0 });
    const [walletBalance, setWalletBalance] = useState(24500.00);

    useEffect(() => {
        const refresh = () => {
            setBots(botManager.getAllBots());
            const stats = botManager.getTotalStats();
            setSummary(stats);
            setWalletBalance(24500.00 + stats.pnl);
        };
        refresh();
        const unsub = bus.subscribe(e => {
            if (e.type === 'bot-update') refresh();
        });
        return () => unsub();
    }, []);

    const formatMoney = (val: number) => {
        return val >= 0 ? `$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`;
    };

    const openBot = (appId: string, name: string) => {
        wm.openWindow(appId, name);
    };

    return (
        <div className="flex flex-col h-full bg-[#0b0d11] text-white overflow-hidden font-sans w-full">
            {/* Header */}
            <div className="h-16 border-b border-gray-800 bg-[#161b22] flex items-center justify-between px-4 md:px-6 shrink-0 z-10 select-none">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-aussie-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-aussie-500/10 shrink-0">
                        <Layers className="w-6 h-6 text-aussie-500" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-bold text-white leading-tight truncate">Command Center</h1>
                        <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wide truncate">Jules Automation</p>
                    </div>
                </div>
                <div className="flex items-center shrink-0">
                     <div className="bg-[#0f1216] px-3 py-2 rounded-lg border border-gray-700 flex flex-col items-end shadow-inner min-w-[100px] md:min-w-[120px]">
                         <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1">
                             <Wallet className="w-3 h-3" /> Wallet
                         </span>
                         <span className={`text-sm font-mono font-bold ${walletBalance >= 24500 ? 'text-white' : 'text-red-400'}`}>
                             {formatMoney(walletBalance)}
                         </span>
                     </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar min-h-0">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total P&L */}
                        <div className="bg-[#1c2128] rounded-xl border border-gray-800 p-5 relative overflow-hidden shadow-xl group hover:border-gray-600 transition-all">
                            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity transform rotate-12"><DollarSign className="w-32 h-32 text-aussie-500" /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 rounded bg-green-500/10"><DollarSign className="w-4 h-4 text-green-500"/></div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</span>
                                </div>
                                <div className={`text-3xl md:text-4xl font-black font-mono mb-2 ${summary.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatMoney(summary.pnl)}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${summary.pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        <ArrowUpRight className={`w-3 h-3 ${summary.pnl < 0 ? 'rotate-180' : ''}`} /> 
                                        {walletBalance > 0 ? ((summary.pnl / 24500) * 100).toFixed(2) : '0.00'}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active Bots */}
                        <div className="bg-[#1c2128] rounded-xl border border-gray-800 p-5 relative overflow-hidden shadow-xl group hover:border-gray-600 transition-all">
                            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity transform rotate-12"><Activity className="w-32 h-32 text-blue-500" /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 rounded bg-blue-500/10"><Activity className="w-4 h-4 text-blue-500"/></div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Stack</span>
                                </div>
                                <div className="text-3xl md:text-4xl font-black text-white mb-2">{summary.active}<span className="text-lg text-gray-600 font-normal">/{bots.length}</span></div>
                                <div className="text-xs text-gray-500 font-medium">Running Strategies</div>
                            </div>
                        </div>

                        {/* Win Rate */}
                        <div className="bg-[#1c2128] rounded-xl border border-gray-800 p-5 relative overflow-hidden shadow-xl group hover:border-gray-600 transition-all">
                            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity transform rotate-12"><TrendingUp className="w-32 h-32 text-purple-500" /></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 rounded bg-purple-500/10"><TrendingUp className="w-4 h-4 text-purple-500"/></div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Win Rate</span>
                                </div>
                                <div className="text-3xl md:text-4xl font-black text-white mb-2">
                                    {summary.wins + summary.losses > 0 ? ((summary.wins / (summary.wins + summary.losses)) * 100).toFixed(1) : '0.0'}%
                                </div>
                                <div className="text-xs text-gray-500 font-medium">{summary.wins}W • {summary.losses}L</div>
                            </div>
                        </div>
                    </div>

                    {/* Bot Stack List */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 px-1">
                            <Layers className="w-5 h-5 text-aussie-500" /> Active Strategies
                        </h3>
                        
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                            {/* Desktop Header Grid - Precise alignment */}
                            <div className="hidden md:grid grid-cols-[3fr_100px_100px_120px_120px] gap-4 p-4 bg-[#0f1216] border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider items-center">
                                <div className="pl-2">Strategy Name</div>
                                <div className="text-center">Status</div>
                                <div className="text-center">Win Rate</div>
                                <div className="text-right">Net P&L</div>
                                <div className="text-right pr-2">Actions</div>
                            </div>
                            
                            {bots.length === 0 && (
                                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500 bg-[#0f1216]">
                                    <Shield className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm font-medium">No active strategies initialized.</p>
                                    <p className="text-xs opacity-50 mt-1">Use Jules to create or open a bot app.</p>
                                </div>
                            )}
                            
                            {/* Bot Rows */}
                            <div className="divide-y divide-gray-800/50">
                                {bots.map(bot => (
                                    <div key={bot.id} className="flex flex-col md:grid md:grid-cols-[3fr_100px_100px_120px_120px] gap-4 p-4 bg-[#161b22] hover:bg-[#1c2128] transition-colors group items-center relative">
                                        {/* Name & Icon */}
                                        <div className="flex items-center gap-3 w-full min-w-0">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shrink-0 ${bot.config.themeColor}`}>
                                                {bot.config.title.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-white text-sm truncate">{bot.name}</div>
                                                <div className="text-xs text-gray-500 font-medium truncate">{bot.config.sport.toUpperCase()} Engine</div>
                                            </div>
                                        </div>
                                        
                                        {/* Status */}
                                        <div className="w-full md:w-auto flex md:justify-center items-center justify-between md:mt-0 mt-2">
                                            <span className="md:hidden text-[10px] font-bold text-gray-500 uppercase">Status</span>
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1.5 ${bot.status === 'running' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-700/30 text-gray-400 border-gray-600/30'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                                                {bot.status}
                                            </span>
                                        </div>

                                        {/* Win Rate */}
                                        <div className="w-full md:w-auto flex md:justify-center items-center justify-between md:mt-0 mt-1">
                                            <span className="md:hidden text-[10px] font-bold text-gray-500 uppercase">Win Rate</span>
                                            <div className="text-sm font-mono text-gray-300 font-medium">
                                                {(bot.wins + bot.losses > 0 ? ((bot.wins / (bot.wins + bot.losses)) * 100).toFixed(1) : '0.0')}%
                                            </div>
                                        </div>

                                        {/* P&L */}
                                        <div className="w-full md:w-auto flex md:justify-end items-center justify-between md:mt-0 mt-1">
                                            <span className="md:hidden text-[10px] font-bold text-gray-500 uppercase">Net Profit</span>
                                            <div className={`font-mono font-bold text-sm ${bot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {formatMoney(bot.pnl)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="w-full md:w-auto flex items-center justify-end gap-2 md:mt-0 mt-3 pt-3 md:pt-0 border-t border-gray-800 md:border-none">
                                            <button 
                                                onClick={() => botManager.setBotStatus(bot.id, bot.status === 'running' ? 'paused' : 'running')}
                                                className="flex-1 md:flex-none p-2 rounded-lg bg-[#0d1117] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all active:scale-95 flex justify-center items-center"
                                                title={bot.status === 'running' ? 'Pause Strategy' : 'Start Strategy'}
                                            >
                                                {bot.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                <span className="md:hidden ml-2 text-xs font-bold">Toggle</span>
                                            </button>
                                            <button 
                                                onClick={() => openBot(bot.id, bot.name)}
                                                className="flex-1 md:flex-none p-2 rounded-lg bg-aussie-500/10 border border-aussie-500/30 text-aussie-500 hover:bg-aussie-500 hover:text-black transition-all active:scale-95 flex justify-center items-center"
                                                title="Open Terminal"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                                <span className="md:hidden ml-2 text-xs font-bold">Open</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
