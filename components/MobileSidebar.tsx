
import React from 'react';
import { X, Settings, User, ChevronRight, LogOut, Shield, LayoutGrid } from 'lucide-react';
import { MainView } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeView: MainView;
    onNavigate: (view: MainView) => void;
    menuItems: ReadonlyArray<{ view: MainView; icon: any; tooltip: string }>;
}

export const MobileSidebar: React.FC<Props> = ({ isOpen, onClose, activeView, onNavigate, menuItems }) => {
    // Define navigation groups for better organization
    const groups = {
        'Apps': ['dashboard', 'marketplace', 'projects', 'browser'],
        'Development': ['code', 'flow', 'github', 'deploy', 'scheduler'],
        'System': ['settings']
    };

    // Helper to find icon for a view
    const getIcon = (view: MainView) => {
        const item = menuItems.find(i => i.view === view);
        if (item) return item.icon;
        if (view === 'settings') return Settings;
        return LayoutGrid;
    };

    const getLabel = (view: MainView) => {
        const item = menuItems.find(i => i.view === view);
        if (item) return item.tooltip;
        return view.charAt(0).toUpperCase() + view.slice(1);
    };

    return (
        <>
            {/* Backdrop - Blur Effect */}
            <div 
                className={`fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            />

            {/* Left Drawer */}
            <div className={`
                fixed inset-y-0 left-0 w-[85%] max-w-[300px] bg-[#0f1216]/95 backdrop-blur-2xl border-r border-os-border z-[80] 
                transform transition-transform duration-300 ease-out flex flex-col shadow-2xl
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* User Header */}
                <div className="relative px-6 pt-safe pb-6 border-b border-os-border bg-gradient-to-b from-[#161b22] to-[#0f1216] shrink-0 flex items-start justify-between">
                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-aussie-500 to-emerald-600 flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-aussie-500/20 ring-2 ring-white/5">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#0f1216] rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-base leading-tight">Admin User</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Shield className="w-3 h-3 text-aussie-500" />
                                <span className="text-[10px] text-aussie-500 font-medium tracking-wide uppercase">System Admin</span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose} 
                        className="p-2 -mr-2 text-gray-400 hover:text-white active:scale-95 transition-transform"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Groups */}
                <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-6 pb-safe">
                    {Object.entries(groups).map(([groupName, views]) => (
                        <div key={groupName}>
                            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                {groupName}
                                <div className="h-px bg-gray-800 flex-1" />
                            </div>
                            <div className="space-y-1">
                                {views.map(view => {
                                    const viewKey = view as MainView;
                                    const Icon = getIcon(viewKey);
                                    const isActive = activeView === viewKey;
                                    
                                    return (
                                        <button
                                            key={view}
                                            onClick={() => { onNavigate(viewKey); onClose(); }}
                                            className={`
                                                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 active:scale-[0.98]
                                                ${isActive 
                                                    ? 'bg-aussie-500/10 text-aussie-500 border border-aussie-500/20 shadow-sm' 
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}
                                            `}
                                        >
                                            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                                            <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                {getLabel(viewKey)}
                                            </span>
                                            {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-os-border bg-[#0a0c10] pb-safe shrink-0">
                    <button className="w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group border border-transparent hover:border-red-500/20">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm">Log Out</span>
                    </button>
                    <div className="mt-4 text-center text-[10px] text-gray-600 font-mono flex justify-center items-center gap-2">
                        <span>Aussie OS v2.2.1</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span>Mobile</span>
                    </div>
                </div>
            </div>
        </>
    );
};
