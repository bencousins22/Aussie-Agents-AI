
import React, { useState, useEffect } from 'react';
import { Search, Star, Download, Check, Trophy, Zap, ArrowRight, Play, Grid, Layers, ShoppingBag, Loader2 } from 'lucide-react';
import { fs } from '../services/fileSystem';
import { notify } from '../services/notification';
import { appRegistry } from '../services/appRegistry';
import { AppDefinition } from '../types';
import { bus } from '../services/eventBus';
import { wm } from '../services/windowManager';

export const Marketplace: React.FC = () => {
    const [apps, setApps] = useState<AppDefinition[]>([]);
    const [installing, setInstalling] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<'all' | 'sports' | 'finance' | 'utility' | 'dev'>('all');

    const refresh = () => {
        setApps(appRegistry.getAll());
    };

    useEffect(() => {
        refresh();
        const sub = bus.subscribe(e => {
            if (e.type === 'app-created' || e.type === 'app-installed') {
                refresh();
            }
        });
        return () => sub();
    }, []);

    const installApp = async (app: AppDefinition) => {
        setInstalling(app.id);
        
        // Simulate download delay
        await new Promise(r => setTimeout(r, 2000));

        const shortcutPath = `/home/aussie/Desktop/${app.name}.lnk`;
        const content = `app-window:${app.id}`;
        
        try {
            fs.writeFile(shortcutPath, content);
            appRegistry.setInstalled(app.id, true);
            notify.success("App Installed", `${app.name} has been added to your Desktop.`);
        } catch (e) {
            notify.error("Installation Failed", "Could not write to disk.");
        }
        setInstalling(null);
    };

    const openApp = (app: AppDefinition) => {
        wm.openWindow(app.id, app.name);
    };

    const filteredApps = apps.filter(a => 
        (category === 'all' || a.category === category) &&
        (a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
    );

    const featuredApp = apps.find(a => a.id === 'nba-bot') || apps[0];

    return (
        <div className="h-full flex flex-col bg-os-bg overflow-hidden font-sans text-os-text">
            {/* Header - Hidden on mobile as App header covers it */}
            <div className="hidden md:flex h-16 border-b border-os-border bg-os-panel items-center justify-between px-4 md:px-6 shrink-0 z-10 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-aussie-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-aussie-500/10 ring-1 ring-aussie-500/20">
                        <ShoppingBag className="w-6 h-6 text-aussie-500" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-white leading-tight">App Store</h1>
                        <p className="text-[10px] md:text-xs text-os-textDim font-medium uppercase tracking-wide">Enterprise Marketplace</p>
                    </div>
                </div>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        className="bg-[#0a0c10] border border-os-border rounded-full pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-aussie-500 w-64 placeholder-gray-600 transition-all focus:w-72 focus:bg-[#161b22]" 
                        placeholder="Search applications..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories & Content */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Sidebar Filters (Desktop) */}
                <div className="hidden md:flex w-56 flex-col border-r border-os-border bg-[#0f1115] p-4 gap-2 shrink-0">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">Discover</div>
                    {[
                        { id: 'all', label: 'All Apps', icon: Grid },
                        { id: 'sports', label: 'Sports Bots', icon: Trophy },
                        { id: 'finance', label: 'Finance', icon: Zap },
                        { id: 'utility', label: 'Utilities', icon: Layers },
                    ].map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => setCategory(cat.id as any)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${category === cat.id ? 'bg-aussie-500 text-[#0f1216] font-bold shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <cat.icon className={`w-4 h-4 ${category === cat.id ? 'text-black' : 'text-gray-500'}`} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Mobile Category Filter */}
                <div className="md:hidden flex overflow-x-auto p-3 gap-2 border-b border-os-border bg-[#0f1115] scrollbar-hide shrink-0 sticky top-0 z-20">
                     {['all', 'sports', 'finance', 'utility'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategory(cat as any)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border whitespace-nowrap transition-colors ${category === cat ? 'bg-aussie-500 text-black border-aussie-500' : 'bg-transparent text-gray-400 border-gray-700'}`}
                        >
                            {cat}
                        </button>
                     ))}
                </div>

                {/* Main Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#0a0c10]">
                    
                    {/* Hero / Featured */}
                    {category === 'all' && !search && featuredApp && (
                        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f332e] to-[#0a1e3f] border border-aussie-500/20 p-6 md:p-8 text-white flex items-center justify-between relative overflow-hidden shadow-2xl shrink-0 group animate-in slide-in-from-top duration-500">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <div className="relative z-10 max-w-lg">
                                <div className="inline-block px-3 py-1 bg-aussie-500/10 rounded-full text-aussie-500 text-[10px] font-bold uppercase mb-4 border border-aussie-500/20 shadow-sm">
                                    Featured App
                                </div>
                                <h2 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight">{featuredApp.name}</h2>
                                <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed line-clamp-2">{featuredApp.description}</p>
                                <div className="flex gap-3">
                                    {featuredApp.installed ? (
                                         <button onClick={() => openApp(featuredApp)} className="px-6 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg">
                                            <Play className="w-4 h-4 fill-current" /> Open
                                         </button>
                                    ) : (
                                        <button onClick={() => installApp(featuredApp)} disabled={!!installing} className="px-6 py-2.5 bg-aussie-500 text-black rounded-lg font-bold text-sm hover:bg-aussie-600 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,153,0.3)] disabled:opacity-70">
                                            {installing === featuredApp.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                                            {installing === featuredApp.id ? 'Installing...' : 'Install App'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="hidden md:flex relative z-10 gap-4 items-center">
                                <div className="w-32 h-32 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-6xl shadow-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-500 select-none">
                                    {featuredApp.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                    )}

                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 px-1">
                        {search ? `Search Results for "${search}"` : (category === 'all' ? 'Trending Apps' : `${category.charAt(0).toUpperCase() + category.slice(1)} Apps`)}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {filteredApps.map(app => {
                             const Icon = app.icon || Zap;
                             const isInstalled = app.installed;
                             const isInstalling = installing === app.id;

                             return (
                                <div key={app.id} className="bg-[#161b22] border border-os-border rounded-xl p-4 md:p-5 hover:border-aussie-500/40 transition-all group flex flex-col hover:shadow-xl hover:-translate-y-1 duration-300 relative overflow-hidden">
                                    {/* Subtle glow effect on hover */}
                                    <div className="absolute inset-0 bg-aussie-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    
                                    <div className="flex items-start gap-4 mb-4 relative z-10">
                                        <div className="w-14 h-14 bg-[#0d1117] rounded-xl flex items-center justify-center border border-os-border group-hover:border-aussie-500/30 transition-colors shrink-0 shadow-inner">
                                            <Icon className="w-7 h-7 text-gray-400 group-hover:text-aussie-500 transition-colors" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-base text-gray-100 truncate">{app.name}</h3>
                                            <div className="text-xs text-gray-500 mb-1">{app.author}</div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-bold text-gray-300">4.9</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-400 mb-6 line-clamp-2 flex-1 relative z-10">{app.description}</p>
                                    
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800 relative z-10">
                                        <div className="text-xs font-mono text-gray-500">{app.version}</div>
                                        
                                        {isInstalled ? (
                                            <button 
                                                onClick={() => openApp(app)}
                                                className="px-4 py-1.5 bg-[#21262d] text-white text-xs font-bold rounded-lg border border-gray-700 hover:bg-[#30363d] transition-colors flex items-center gap-2"
                                            >
                                                Open
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => installApp(app)}
                                                disabled={!!installing}
                                                className="px-4 py-1.5 bg-aussie-500/10 text-aussie-500 text-xs font-bold rounded-lg border border-aussie-500/20 hover:bg-aussie-500 hover:text-black transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isInstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Get'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                    
                    {filteredApps.length === 0 && (
                        <div className="text-center py-20 opacity-50 flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-gray-600" />
                            <p>No apps found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
