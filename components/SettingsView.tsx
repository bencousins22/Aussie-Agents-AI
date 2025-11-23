
import React, { useState, useEffect } from 'react';
import { Settings, Github, Key, CheckCircle, Cloud, Box, Zap, Lock, Monitor, Image as ImageIcon, CreditCard, Info } from 'lucide-react';
import { github } from '../services/github';
import { deployment } from '../services/deployment';
import { notify } from '../services/notification';
import { DeploymentProvider } from '../types';
import { dashboardState, WALLPAPERS, Wallpaper } from '../services/dashboardState';

export const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'appearance'>('general');
    const [pat, setPat] = useState('');
    const [user, setUser] = useState<any>(null);
    const [isLoadingGh, setIsLoadingGh] = useState(false);
    const [keys, setKeys] = useState({ render: '', vercel: '', replit: '', netlify: '' });
    const [julesKey, setJulesKey] = useState('');
    const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(dashboardState.getWallpaper());

    useEffect(() => {
        if (github.hasToken()) {
            setIsLoadingGh(true);
            github.getUser().then(setUser).catch(() => setUser(null)).finally(() => setIsLoadingGh(false));
        }
        setKeys({
            render: deployment.getApiKey('render') || '',
            vercel: deployment.getApiKey('vercel') || '',
            replit: deployment.getApiKey('replit') || '',
            netlify: deployment.getApiKey('netlify') || ''
        });
        setJulesKey(localStorage.getItem('jules_trading_key') || '');
        
        const unsub = dashboardState.subscribe(state => setCurrentWallpaper(state.wallpaper));
        return () => unsub();
    }, []);

    const handleGitHubSave = async () => {
        if (!pat) return;
        setIsLoadingGh(true);
        github.saveToken(pat);
        try {
            const userData = await github.getUser();
            setUser(userData);
            notify.success('GitHub Connected', `Authenticated as ${userData.login}.`);
            setPat('');
        } catch (e: any) {
            setUser(null);
            notify.error('Authentication Failed', e.message);
        } finally { setIsLoadingGh(false); }
    };

    const handleKeySave = (provider: DeploymentProvider, value: string) => {
        deployment.setApiKey(provider, value);
        setKeys(prev => ({ ...prev, [provider]: value }));
        notify.success('Key Saved', `${provider} API Key updated.`);
    };

    const handleJulesKeySave = () => {
        localStorage.setItem('jules_trading_key', julesKey);
        notify.success('Jules Key Saved', 'Trading API Key securely stored.');
    };

    const handleWallpaperChange = (wp: Wallpaper) => {
        dashboardState.setWallpaper(wp);
        notify.info("Wallpaper Updated", `Changed to ${wp.name}`);
    };

    return (
        <div className="h-full bg-os-bg flex flex-col text-os-text overflow-hidden">
            {/* Header - Hidden on mobile */}
            <div className="hidden md:flex p-4 md:p-6 border-b border-os-border bg-os-panel items-center gap-4 shrink-0 sticky top-0 z-10">
                <div className="p-2 bg-aussie-500/10 rounded-lg"><Settings className="w-6 h-6 text-aussie-500" /></div>
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-white">System Settings</h2>
                    <p className="text-xs md:text-sm text-os-textDim">Manage preferences and identity.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-os-border bg-[#0f1216] sticky top-0 z-10">
                <TabButton label="General" icon={Lock} active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                <TabButton label="Appearance" icon={ImageIcon} active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    
                    {activeTab === 'general' && (
                        <>
                            {/* Core System */}
                            <div className="bg-os-panel border border-os-border rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-aussie-500/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"/>
                                <div className="flex items-center gap-3 mb-4 relative z-10">
                                    <Lock className="w-5 h-5 text-green-400" />
                                    <h3 className="font-bold text-lg text-white">Security & Keys</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                    <div className="bg-[#0a0c10] rounded-lg border border-os-border p-4 flex flex-col justify-between gap-2">
                                        <div><div className="text-xs font-bold text-os-textDim uppercase">Kernel API Key</div><div className="text-sm text-green-400 flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>Active (Environment)</div></div>
                                        <div className="font-mono text-xs text-gray-500 bg-white/5 px-3 py-2 rounded border border-white/5 truncate max-w-full">{process.env.API_KEY ? `••••••••${process.env.API_KEY.slice(-4)}` : 'N/A'}</div>
                                    </div>

                                    <div className="bg-[#0a0c10] rounded-lg border border-os-border p-4 flex flex-col justify-between gap-2">
                                        <div>
                                            <div className="text-xs font-bold text-os-textDim uppercase">Jules Trading API Key</div>
                                            <p className="text-[10px] text-gray-500">Required for Bot Execution</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="password" value={julesKey} onChange={e => setJulesKey(e.target.value)} className="flex-1 bg-transparent border-b border-gray-700 py-1 text-xs font-mono text-white outline-none focus:border-aussie-500" placeholder="Enter Key..." />
                                            <button onClick={handleJulesKeySave} className="text-xs font-bold text-aussie-500 hover:text-white">SAVE</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* GitHub */}
                            <div className="bg-os-panel border border-os-border rounded-xl p-6 flex flex-col">
                                <div className="flex items-center gap-3 mb-4"><Github className="w-6 h-6 text-white"/><h3 className="font-bold text-lg text-white">GitHub Integration</h3></div>
                                {user ? (
                                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-center gap-4">
                                        <img src={user.avatar_url} className="w-12 h-12 rounded-full" alt="avatar" />
                                        <div className="flex-1 min-w-0"><div className="text-xs text-green-400 font-bold uppercase">Connected</div><div className="font-bold text-white truncate">{user.login}</div></div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <input type="password" value={pat} onChange={e => setPat(e.target.value)} placeholder="Personal Access Token" className="w-full bg-os-bg border border-os-border rounded-lg p-3 text-[16px] md:text-sm font-mono outline-none focus:border-aussie-500" />
                                        <button onClick={handleGitHubSave} disabled={isLoadingGh || !pat} className="w-full py-3 bg-white text-black font-bold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">{isLoadingGh ? 'Connecting...' : 'Connect'}</button>
                                        <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-xs text-aussie-500 hover:underline block text-center">Generate Token</a>
                                    </div>
                                )}
                            </div>

                            {/* Deployment */}
                            <div className="bg-os-panel border border-os-border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-6"><Cloud className="w-6 h-6 text-purple-400"/><h3 className="font-bold text-lg text-white">Cloud Providers</h3></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <APIKeyInput label="Render" icon={Cloud} value={keys.render} onChange={(v: string) => handleKeySave('render', v)} color="text-purple-400"/>
                                    <APIKeyInput label="Vercel" icon={Zap} value={keys.vercel} onChange={(v: string) => handleKeySave('vercel', v)} color="text-white"/>
                                    <APIKeyInput label="Replit" icon={Box} value={keys.replit} onChange={(v: string) => handleKeySave('replit', v)} color="text-orange-400"/>
                                    <APIKeyInput label="Netlify" icon={Cloud} value={keys.netlify} onChange={(v: string) => handleKeySave('netlify', v)} color="text-cyan-400"/>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="bg-os-panel border border-os-border rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Monitor className="w-6 h-6 text-blue-400" />
                                <h3 className="font-bold text-lg text-white">Desktop Wallpaper</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {WALLPAPERS.map(wp => (
                                    <div 
                                        key={wp.id}
                                        onClick={() => handleWallpaperChange(wp)}
                                        className={`
                                            aspect-video rounded-lg cursor-pointer border-2 relative overflow-hidden group transition-all
                                            ${currentWallpaper.id === wp.id ? 'border-aussie-500 shadow-[0_0_15px_rgba(0,229,153,0.3)] scale-[1.02]' : 'border-transparent hover:border-gray-500'}
                                        `}
                                    >
                                        <div className={`w-full h-full ${wp.value}`} style={wp.type === 'image' ? { backgroundImage: `url(${wp.value})`, backgroundSize: 'cover' } : {}} />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            {wp.name}
                                        </div>
                                        {currentWallpaper.id === wp.id && (
                                            <div className="absolute top-2 right-2 bg-aussie-500 text-black rounded-full p-1">
                                                <CheckCircle className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

const TabButton = ({ label, icon: Icon, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-colors border-b-2 ${active ? 'text-aussie-500 border-aussie-500 bg-white/5' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'}`}
    >
        <Icon className="w-4 h-4" /> {label}
    </button>
);

const APIKeyInput = ({ label, icon: Icon, value, onChange, color }: any) => (
    <div className="bg-[#0a0c10] border border-os-border rounded-lg p-4 focus-within:border-aussie-500/50 transition-colors">
        <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${color}`} /><label className="text-sm font-bold text-gray-300">{label}</label>{value && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}</div>
        <input type="password" value={value} onChange={e => onChange(e.target.value)} placeholder="Enter API Key" className="w-full bg-transparent border-b border-gray-700 py-2 text-[16px] md:text-sm font-mono text-white outline-none placeholder-gray-700 focus:border-aussie-500" />
    </div>
);
