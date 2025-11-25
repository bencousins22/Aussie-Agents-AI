
import React, { useState, useEffect, useMemo, useTransition, useOptimistic, useActionState, memo } from 'react';
import { Search, Download, Check, Trophy, Zap, Play, Grid, Layers, ShoppingBag, Loader2, Code2, Star, TrendingUp, Clock, Users, Package, Sparkles, Filter, X } from 'lucide-react';
import { fs } from '../services/fileSystem';
import { notify } from '../services/notification';
import { appRegistry } from '../services/appRegistry';
import { AppDefinition } from '../types';
import { bus } from '../services/eventBus';
import { wm } from '../services/windowManager';

type SortOption = 'popular' | 'recent' | 'name' | 'rating';

interface ExtendedAppDefinition extends AppDefinition {
    rating?: number;
    downloads?: number;
    lastUpdated?: string;
}

const CATEGORIES = [
    { id: 'all', label: 'All Apps', icon: Grid, color: 'from-aussie-500 to-emerald-400' },
    { id: 'sports', label: 'Sports', icon: Trophy, color: 'from-yellow-500 to-orange-400' },
    { id: 'finance', label: 'Finance', icon: Zap, color: 'from-blue-500 to-cyan-400' },
    { id: 'utility', label: 'Utilities', icon: Layers, color: 'from-purple-500 to-pink-400' },
    { id: 'dev', label: 'Development', icon: Code2, color: 'from-emerald-500 to-teal-400' },
] as const;

const SORT_OPTIONS: { id: SortOption; label: string; icon: any }[] = [
    { id: 'popular', label: 'Most Popular', icon: TrendingUp },
    { id: 'recent', label: 'Recently Updated', icon: Clock },
    { id: 'rating', label: 'Highest Rated', icon: Star },
    { id: 'name', label: 'Name (A-Z)', icon: Package },
];

// Enhance apps with mock data for demo
const enhanceApp = (app: AppDefinition): ExtendedAppDefinition => ({
    ...app,
    rating: Math.random() > 0.5 ? 4.5 + Math.random() * 0.5 : 4.0 + Math.random() * 0.5,
    downloads: Math.floor(Math.random() * 10000) + 1000,
    lastUpdated: ['2 days ago', '1 week ago', '3 weeks ago', '1 month ago'][Math.floor(Math.random() * 4)],
});

export const Marketplace: React.FC = memo(() => {
    const [apps, setApps] = useState<ExtendedAppDefinition[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<'all' | 'sports' | 'finance' | 'utility' | 'dev'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [showFilters, setShowFilters] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Optimistic app installations
    const [optimisticApps, addOptimisticInstall] = useOptimistic(
        apps,
        (state: ExtendedAppDefinition[], appId: string) =>
            state.map(app => app.id === appId ? { ...app, installed: true } : app)
    ) as [ExtendedAppDefinition[], (appId: string) => void];

    // Install action with useActionState
    const [installingAppId, installAction, isInstalling] = useActionState(
        async (_prevState: string | null, formData: FormData) => {
            const appId = formData.get('appId') as string;
            const app = apps.find(a => a.id === appId);
            if (!app) return null;

            // Optimistically update UI
            addOptimisticInstall(appId);

            // Simulate network delay
            await new Promise(r => setTimeout(r, 1500));

            const shortcutPath = `/home/aussie/Desktop/${app.name}.lnk`;
            const content = `app-window:${appId}`;

            try {
                fs.writeFile(shortcutPath, content);
                appRegistry.setInstalled(appId, true);
                notify.success("App Installed", `${app.name} is ready to use!`);
                bus.emit('app-installed', { appId });
            } catch (e) {
                notify.error("Installation Failed", "Could not write to disk.");
            }
            return null;
        },
        null
    );

    const refresh = () => {
        const rawApps = appRegistry.getAll();
        setApps(rawApps.map(enhanceApp));
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

    // Filtered and sorted apps with useMemo for performance
    const processedApps = useMemo(() => {
        let filtered = optimisticApps.filter(a =>
            (category === 'all' || a.category === category) &&
            (search === '' ||
             a.name.toLowerCase().includes(search.toLowerCase()) ||
             a.description.toLowerCase().includes(search.toLowerCase()) ||
             a.author.toLowerCase().includes(search.toLowerCase()))
        );

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'popular':
                    return (b.downloads || 0) - (a.downloads || 0);
                case 'recent':
                    return (b.lastUpdated || '').localeCompare(a.lastUpdated || '');
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [optimisticApps, category, search, sortBy]);

    const featuredApp = useMemo(() =>
        optimisticApps.find(a => a.id === 'nba-bot') || optimisticApps[0],
        [optimisticApps]
    );

    const stats = useMemo(() => ({
        total: optimisticApps.length,
        installed: optimisticApps.filter(a => a.installed).length,
        avgRating: (optimisticApps.reduce((sum, a) => sum + (a.rating || 0), 0) / optimisticApps.length).toFixed(1),
        categories: CATEGORIES.length - 1,
    }), [optimisticApps]);

    const openApp = (app: AppDefinition) => {
        bus.emit('switch-view', { view: 'agentos' });
        wm.openWindow(app.id, app.name);
    };

    const handleCategoryChange = (cat: typeof category) => {
        startTransition(() => {
            setCategory(cat);
        });
    };

    const handleSearchChange = (value: string) => {
        startTransition(() => {
            setSearch(value);
        });
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0e14] via-[#0d1117] to-[#0a0e14] overflow-hidden font-sans text-os-text">
            {/* Header */}
            <div className="relative flex h-20 border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-xl items-center justify-between px-4 md:px-6 shrink-0 z-20 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-aussie-500/30 to-aussie-500/10 rounded-2xl flex items-center justify-center shadow-xl shadow-aussie-500/20 ring-1 ring-aussie-500/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-aussie-500/0 via-aussie-500/20 to-aussie-500/0 animate-pulse"></div>
                        <ShoppingBag className="w-6 h-6 text-aussie-400 relative z-10 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight flex items-center gap-2">
                            App Marketplace
                            <span className="px-2 py-0.5 bg-aussie-500/15 text-aussie-300 text-[10px] font-bold rounded-full border border-aussie-500/30">BETA</span>
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Discover & Install Apps</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Stats */}
                    <div className="hidden lg:flex items-center gap-2 text-xs">
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-aussie-400" />
                            <span className="font-semibold text-white">{stats.total}</span>
                            <span className="text-gray-500">apps</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span className="font-semibold">{stats.installed}</span>
                            <span className="text-emerald-400/70">installed</span>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            className="bg-[#0a0c10] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-aussie-500/50 w-64 placeholder-gray-600 transition-all focus:w-80 focus:bg-[#161b22] shadow-inner"
                            placeholder="Search apps, developers..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                        />
                    </div>
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showFilters ? 'bg-aussie-500/20 text-aussie-300 border border-aussie-500/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white hover:border-white/20'}`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden md:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden p-3 border-b border-white/10 bg-[#0f1115]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        className="w-full bg-[#0a0c10] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-aussie-500/50 placeholder-gray-600"
                        placeholder="Search apps..."
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Sidebar */}
                <div className={`${showFilters ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-64 border-r border-white/10 bg-[#0f1115] shrink-0 overflow-y-auto`}>
                    <div className="p-4 space-y-6">
                        {/* Categories */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-2 flex items-center justify-between">
                                <span>Categories</span>
                                <span className="text-aussie-400">{processedApps.length}</span>
                            </div>
                            <div className="space-y-1">
                                {CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    const isActive = category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategoryChange(cat.id as any)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-gradient-to-r ' + cat.color + ' text-black shadow-lg shadow-black/30'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-500'}`} />
                                            {cat.label}
                                            {isActive && <Sparkles className="w-3 h-3 ml-auto" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sort */}
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase mb-3 px-2">Sort By</div>
                            <div className="space-y-1">
                                {SORT_OPTIONS.map(opt => {
                                    const Icon = opt.icon;
                                    const isActive = sortBy === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSortBy(opt.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-aussie-500/15 text-aussie-300 border border-aussie-500/30'
                                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-aussie-500/10 to-aussie-500/5 border border-aussie-500/20 space-y-2">
                            <div className="text-[10px] font-bold text-aussie-300 uppercase">Marketplace Stats</div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-gray-300">
                                    <span>Total Apps</span>
                                    <span className="font-bold text-white">{stats.total}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Installed</span>
                                    <span className="font-bold text-emerald-300">{stats.installed}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Avg Rating</span>
                                    <span className="font-bold text-yellow-300 flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" />{stats.avgRating}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0c10]">
                    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

                        {/* Featured Hero */}
                        {category === 'all' && !search && featuredApp && (
                            <div className="relative rounded-3xl bg-gradient-to-br from-[#0f332e] via-[#0a1e3f] to-[#0d1621] border border-aussie-500/30 p-6 md:p-10 overflow-hidden group animate-in slide-in-from-top duration-500 shadow-2xl">
                                {/* Animated background */}
                                <div className="absolute inset-0 opacity-30">
                                    <div className="absolute inset-0" style={{
                                        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 229, 153, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(90, 203, 255, 0.1) 0%, transparent 50%)',
                                    }} />
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="max-w-2xl space-y-4 text-center md:text-left">
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-aussie-500/15 rounded-full text-aussie-400 text-xs font-bold uppercase border border-aussie-500/30">
                                                <Sparkles className="w-3 h-3" />
                                                Featured App
                                            </span>
                                            {featuredApp.rating && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 rounded-full text-yellow-300 text-xs font-bold border border-yellow-500/20">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    {featuredApp.rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                                            {featuredApp.name}
                                        </h2>
                                        <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                                            {featuredApp.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 justify-center md:justify-start">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                {featuredApp.downloads?.toLocaleString()}+ installs
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                Updated {featuredApp.lastUpdated}
                                            </div>
                                        </div>
                                        <div className="flex justify-center md:justify-start gap-3 pt-2">
                                            {featuredApp.installed ? (
                                                 <button
                                                    onClick={() => openApp(featuredApp)}
                                                    className="px-8 py-4 bg-white text-black rounded-xl font-bold text-base hover:bg-gray-100 transition-all flex items-center gap-2.5 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    <Play className="w-5 h-5 fill-current" />
                                                    Open App
                                                 </button>
                                            ) : (
                                                <form action={installAction}>
                                                    <input type="hidden" name="appId" value={featuredApp.id} />
                                                    <button
                                                        type="submit"
                                                        disabled={isInstalling}
                                                        className="px-8 py-4 bg-gradient-to-r from-aussie-500 to-emerald-400 text-black rounded-xl font-bold text-base hover:shadow-[0_0_30px_rgba(0,229,153,0.4)] transition-all flex items-center gap-2.5 shadow-xl disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                                                    >
                                                        {isInstalling && installingAppId === featuredApp.id ? (
                                                            <><Loader2 className="w-5 h-5 animate-spin"/> Installing...</>
                                                        ) : (
                                                            <><Download className="w-5 h-5" /> Install Now</>
                                                        )}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden lg:flex relative shrink-0">
                                        <div className="w-48 h-48 bg-gradient-to-br from-aussie-500/20 to-aussie-500/5 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center shadow-2xl transform rotate-6 group-hover:rotate-12 transition-all duration-700 select-none">
                                            <div className="text-8xl font-black text-aussie-400">{featuredApp.name.charAt(0)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {search ? (
                                    <>Search Results <span className="text-aussie-400">"{search}"</span></>
                                ) : (
                                    <>
                                        {category === 'all' ? 'All Apps' : `${CATEGORIES.find(c => c.id === category)?.label}`}
                                        <span className="text-sm font-normal text-gray-500">({processedApps.length})</span>
                                    </>
                                )}
                            </h3>
                            {isPending && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Filtering...
                                </div>
                            )}
                        </div>

                        {/* Apps Grid */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                            {processedApps.map((app, index) => {
                                const Icon = app.icon || Zap;
                                const isInstalled = app.installed;
                                const isCurrentlyInstalling = isInstalling && installingAppId === app.id;

                                return (
                                    <AppCard
                                        key={app.id}
                                        app={app}
                                        Icon={Icon}
                                        isInstalled={isInstalled}
                                        isInstalling={isCurrentlyInstalling}
                                        onOpen={openApp}
                                        installAction={installAction}
                                        index={index}
                                    />
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {processedApps.length === 0 && (
                            <div className="text-center py-20 flex flex-col items-center gap-4 opacity-60">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Search className="w-8 h-8 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-gray-400 mb-1">No apps found</p>
                                    <p className="text-sm text-gray-600">Try adjusting your filters or search terms</p>
                                </div>
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:text-white hover:border-aussie-500/40 transition-all flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

// Memoized App Card Component
const AppCard = memo<{
    app: ExtendedAppDefinition;
    Icon: any;
    isInstalled: boolean;
    isInstalling: boolean;
    onOpen: (app: AppDefinition) => void;
    installAction: any;
    index: number;
}>(({ app, Icon, isInstalled, isInstalling, onOpen, installAction, index }) => {
    return (
        <div
            className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-white/10 rounded-2xl p-5 hover:border-aussie-500/40 transition-all group flex flex-col hover:shadow-2xl hover:-translate-y-1 duration-300 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-aussie-500/0 via-aussie-500/5 to-aussie-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className="relative w-14 h-14 bg-gradient-to-br from-[#1f2937] to-[#0d1117] rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-aussie-500/40 transition-all shrink-0 shadow-lg overflow-hidden">
                        <Icon className="w-7 h-7 text-gray-400 group-hover:text-aussie-400 transition-colors relative z-10" strokeWidth={1.5} />
                        {isInstalled && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold border-2 border-[#161b22] shadow-lg" title="Installed">
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-white truncate group-hover:text-aussie-300 transition-colors">{app.name}</h3>
                        <div className="text-xs text-gray-500 font-medium">{app.author}</div>
                        {app.rating && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-semibold text-yellow-300">{app.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-600 ml-1">({app.downloads?.toLocaleString()})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {app.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex flex-col gap-0.5">
                        <div className="text-[10px] font-mono text-gray-600">v{app.version}</div>
                        {app.lastUpdated && (
                            <div className="text-[10px] text-gray-600 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {app.lastUpdated}
                            </div>
                        )}
                    </div>

                    {isInstalled ? (
                        <button
                            onClick={() => onOpen(app)}
                            className="px-4 py-2 bg-gradient-to-r from-aussie-500/20 to-emerald-500/10 text-aussie-300 text-xs font-bold rounded-lg border border-aussie-500/40 hover:border-aussie-500/60 hover:shadow-lg hover:shadow-aussie-500/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" /> Open
                        </button>
                    ) : (
                        <form action={installAction}>
                            <input type="hidden" name="appId" value={app.id} />
                            <button
                                type="submit"
                                disabled={isInstalling}
                                className="px-4 py-2 bg-gradient-to-r from-aussie-500 to-emerald-400 text-black text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-aussie-500/40 transition-all flex items-center gap-2 disabled:opacity-60 active:scale-95"
                            >
                                {isInstalling ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin"/> Installing</>
                                ) : (
                                    <><Download className="w-3.5 h-3.5" /> Install</>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
});
