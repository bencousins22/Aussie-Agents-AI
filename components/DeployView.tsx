
import React, { useState, useEffect } from 'react';
import { Rocket, Github, Play, ExternalLink, Cloud, Zap, Box, CheckCircle } from 'lucide-react';
import { deployment } from '../services/deployment';
import { DeployState, DeployStatus, DeploymentProvider } from '../types';
import { notify } from '../services/notification';

const statusConfig: Record<DeployStatus, { label: string; color: string; desc: string }> = {
    pending: { label: 'Pending', color: 'bg-gray-500', desc: 'Waiting to start...' },
    build_started: { label: 'Building', color: 'bg-yellow-500 animate-pulse', desc: 'Build process initiated.' },
    build_success: { label: 'Build OK', color: 'bg-blue-500', desc: 'Build artifacts created.' },
    deploy_started: { label: 'Deploying', color: 'bg-purple-500 animate-pulse', desc: 'Pushing to global infrastructure.' },
    live: { label: 'Live', color: 'bg-green-500', desc: 'Your service is now online.' },
    failed: { label: 'Failed', color: 'bg-red-500', desc: 'Deployment encountered an error.' },
    canceled: { label: 'Canceled', color: 'bg-gray-700', desc: 'Deployment was canceled.' },
};

const providers: { id: DeploymentProvider, name: string, icon: any, color: string }[] = [
    { id: 'render', name: 'Render', icon: Cloud, color: 'text-purple-400' },
    { id: 'vercel', name: 'Vercel', icon: Zap, color: 'text-white' },
    { id: 'replit', name: 'Replit', icon: Box, color: 'text-orange-400' },
    { id: 'netlify', name: 'Netlify', icon: Cloud, color: 'text-cyan-400' }
];

export const DeployView: React.FC = () => {
    const [repo, setRepo] = useState('https://github.com/bencousins22/Aussie-OS.git');
    const [selectedProvider, setSelectedProvider] = useState<DeploymentProvider>('render');
    const [deployState, setDeployState] = useState<DeployState>(deployment.getState());
    const [isDeploying, setIsDeploying] = useState(false);

    useEffect(() => {
        const unsubscribe = deployment.subscribe(setDeployState);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if(deployState.status === 'live' || deployState.status === 'failed' || deployState.status === 'canceled') {
            setIsDeploying(false);
        }
    }, [deployState.status]);

    const handleDeploy = async () => {
        if (!deployment.getApiKey(selectedProvider)) {
            notify.error('Missing API Key', `Please configure ${selectedProvider} in Settings.`);
            return;
        }
        setIsDeploying(true);
        try {
            await deployment.deploy(selectedProvider, repo);
        } catch(e: any) {
            notify.error('Deployment Failed', e.message);
            setIsDeploying(false);
        }
    };

    return (
        <div className="h-full bg-os-bg flex flex-col overflow-hidden">
            {/* Header - Hidden on mobile */}
            <div className="hidden md:flex p-4 md:p-6 border-b border-os-border bg-os-panel items-center gap-3 shrink-0">
                <Rocket className="w-6 h-6 text-aussie-500" />
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-white">Deploy Service</h2>
                    <p className="text-xs md:text-sm text-os-textDim">Ship your code to the cloud instantly.</p>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 overflow-y-auto pb-24 md:pb-8">
                {/* Left: Config */}
                <div className="col-span-1 flex flex-col gap-6">
                    {/* Provider Selector */}
                    <div className="bg-os-panel border border-os-border rounded-xl p-4">
                        <label className="text-sm font-bold text-white mb-3 block">Select Provider</label>
                        <div className="grid grid-cols-2 gap-3">
                            {providers.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedProvider(p.id)}
                                    className={`
                                        p-3 rounded-xl border flex flex-col items-center gap-2 transition-all touch-manipulation active:scale-95
                                        ${selectedProvider === p.id 
                                            ? 'bg-aussie-500/20 border-aussie-500' 
                                            : 'bg-os-bg border-os-border hover:border-os-textDim/50'}
                                    `}
                                >
                                    <p.icon className={`w-6 h-6 ${p.color}`} />
                                    <span className={`text-xs font-bold ${selectedProvider === p.id ? 'text-white' : 'text-os-textDim'}`}>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-os-panel border border-os-border rounded-xl p-4">
                         <div className="flex items-center gap-2 mb-2">
                             <Github className="w-4 h-4 text-os-textDim" />
                             <label className="text-sm font-bold text-white">GitHub Repository</label>
                         </div>
                         <input
                            value={repo}
                            onChange={e => setRepo(e.target.value)}
                            placeholder="https://github.com/user/repo.git"
                            className="w-full bg-os-bg border border-os-border rounded-lg p-3 text-base md:text-sm font-mono outline-none focus:border-aussie-500"
                        />
                    </div>
                    
                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying || !repo}
                        className="w-full py-4 md:py-3 bg-aussie-500 hover:bg-aussie-600 text-[#0f1216] font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-aussie-500/20 disabled:opacity-50 transition-all active:scale-95"
                    >
                       {isDeploying ? 'Deploying...' : <><Play className="w-4 h-4 fill-current"/> Deploy to {providers.find(p => p.id === selectedProvider)?.name}</>}
                    </button>
                    
                    {deployState.status === 'live' && (
                         <a href={deployState.url || '#'} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-aussie-500 hover:bg-aussie-600 text-[#0f1216] font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-aussie-500/20">
                             <ExternalLink className="w-4 h-4" /> Visit Live Site
                         </a>
                    )}
                </div>

                {/* Right: Status & Logs */}
                <div className="col-span-1 lg:col-span-2 bg-os-panel border border-os-border rounded-xl flex flex-col overflow-hidden min-h-[400px] lg:h-[600px]">
                    <div className="p-4 border-b border-os-border flex justify-between items-center bg-[#161b22]">
                        <div>
                            <h3 className="font-bold text-white">Deployment Status</h3>
                            <p className="text-xs text-os-textDim font-mono mt-1">{deployState.id || 'Ready to deploy'}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusConfig[deployState.status].color.replace('bg-', 'text-').replace('animate-pulse', '')} bg-white/5 border border-white/10`}>
                            {statusConfig[deployState.status].label}
                        </div>
                    </div>
                    
                    {/* Logs */}
                    <div className="flex-1 bg-black/50 p-4 overflow-y-auto font-mono text-xs text-os-textDim relative custom-scrollbar">
                        {deployState.logs.length === 0 && <div className="opacity-50 flex items-center justify-center h-full">Logs will appear here...</div>}
                        {deployState.logs.map((log, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:gap-4 mb-2 md:mb-1 animate-in fade-in duration-200 border-b md:border-none border-white/5 pb-1 md:pb-0">
                                <span className="opacity-30 select-none text-[10px] md:text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="flex-1 text-gray-300 break-words">{log.line}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
