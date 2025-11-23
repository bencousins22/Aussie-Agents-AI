
import React from 'react';
import { Home, Code2, Globe, Github, Calendar, Rocket, Search, Settings, Briefcase, Zap, ShoppingBag, Menu, LayoutGrid } from 'lucide-react';
import { MainView } from '../types';

interface ActivityBarProps {
    activeView: MainView;
    onNavigate: (view: MainView) => void;
    onSpotlight: () => void;
    isMobile: boolean;
    onChatToggle: () => void;
    onMenuToggle?: () => void;
}

export const NAV_ITEMS = [
    { view: 'dashboard', icon: Home, tooltip: 'Dashboard' },
    { view: 'projects', icon: Briefcase, tooltip: 'Projects' },
    { view: 'marketplace', icon: ShoppingBag, tooltip: 'Marketplace' },
    { view: 'code', icon: Code2, tooltip: 'Code' },
    { view: 'browser', icon: Globe, tooltip: 'Browser' },
    { view: 'flow', icon: Zap, tooltip: 'Flow' },
    { view: 'github', icon: Github, tooltip: 'GitHub' },
    { view: 'scheduler', icon: Calendar, tooltip: 'Scheduler' },
    { view: 'deploy', icon: Rocket, tooltip: 'Deploy' },
] as const;

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onNavigate, onSpotlight, isMobile, onMenuToggle }) => {
    
    if (isMobile) {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#0f1216]/95 backdrop-blur-xl border-t border-os-border z-[60] pb-safe flex items-center justify-around px-2 shadow-2xl">
                <MobileTab icon={Home} label="Home" active={activeView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
                <MobileTab icon={ShoppingBag} label="Store" active={activeView === 'marketplace'} onClick={() => onNavigate('marketplace')} />
                <MobileTab icon={Code2} label="Code" active={activeView === 'code'} onClick={() => onNavigate('code')} />
                <MobileTab icon={Globe} label="Web" active={activeView === 'browser'} onClick={() => onNavigate('browser')} />
                <MobileTab icon={Menu} label="Menu" active={false} onClick={onMenuToggle || (() => {})} />
            </div>
        );
    }

    return (
        <div className="w-16 flex flex-col items-center py-5 bg-os-bg border-r border-os-border gap-4 z-30 shrink-0 h-full justify-between">
            {/* Logo */}
            <div className="w-10 h-10 bg-aussie-500 rounded-xl flex items-center justify-center text-os-bg font-bold text-lg mb-2 shadow-lg shadow-aussie-500/20 cursor-pointer hover:scale-105 transition-transform shrink-0 relative group">
                A
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex flex-col gap-3 w-full items-center justify-start flex-1 overflow-y-auto no-scrollbar px-2">
                {NAV_ITEMS.map(({ view, icon, tooltip }) => (
                     <ActivityButton 
                        key={view}
                        icon={icon} 
                        active={activeView === view} 
                        onClick={() => onNavigate(view as MainView)} 
                        tooltip={tooltip}
                    />
                ))}
            </div>
            
            <div className="flex flex-col gap-3 w-full items-center pb-2">
                <ActivityButton icon={Search} active={false} onClick={onSpotlight} tooltip="Search (Cmd+K)" />
                <ActivityButton icon={Settings} active={activeView === 'settings'} onClick={() => onNavigate('settings')} tooltip="Settings" />
            </div>
        </div>
    );
};

const MobileTab = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center w-16 gap-1 ${active ? 'text-aussie-500' : 'text-gray-500'}`}
    >
        <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-aussie-500/10' : ''}`}>
            <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} strokeWidth={active ? 2 : 1.5} />
        </div>
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

const ActivityButton = ({ icon: Icon, active, onClick, tooltip }: any) => (
    <div className="w-full flex items-center justify-center relative group">
        {/* Active Indicator */}
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-aussie-500 rounded-r-full shadow-[0_0_10px] shadow-aussie-500/50" />}
        
        <button 
            onClick={onClick}
            className={`
                p-3 rounded-xl transition-all duration-200 relative
                ${active 
                    ? 'text-aussie-500 bg-aussie-500/10' 
                    : 'text-os-textDim hover:text-white hover:bg-white/5'}
            `}
        >
            <Icon className={`w-6 h-6 ${active ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
        </button>

        {/* Tooltip */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1c2128] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-os-border shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all">
            {tooltip}
            {/* Arrow */}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1c2128] border-l border-b border-os-border transform rotate-45" />
        </div>
    </div>
);
