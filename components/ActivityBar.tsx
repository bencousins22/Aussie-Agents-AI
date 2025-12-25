
import React from 'react';
import { Search, Settings, Menu, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainView } from '../types';
import { NAV_ITEMS } from '../constants';

interface ActivityBarProps {
    activeView: MainView;
    onNavigate: (view: MainView) => void;
    onSpotlight: () => void;
    isMobile: boolean;
    onMenuToggle?: () => void;
    onChatToggle?: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = React.memo(({ activeView, onNavigate, onSpotlight, isMobile, onMenuToggle, onChatToggle, isCollapsed, onToggleCollapse }) => {

    if (isMobile) {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-[70px] bg-[#0f1216]/98 backdrop-blur-xl border-t border-os-border z-[60] pb-safe flex items-center justify-around px-2 sm:px-3 shadow-2xl">
                {NAV_ITEMS.filter(item => item.shortcut).map(({ view, icon, tooltip }) => (
                    <MobileTab
                        key={view}
                        icon={icon}
                        label={tooltip}
                        active={activeView === view}
                        onClick={() => onNavigate(view as MainView)}
                    />
                ))}
                <MobileTab icon={Bot} label="Chat" active={false} onClick={onChatToggle || (() => {})} />
                <MobileTab icon={Menu} label="Menu" active={false} onClick={onMenuToggle || (() => {})} />
            </div>
        );
    }

    return (
        <div className={`
            flex flex-col items-center py-4 bg-gradient-to-b from-[#0c111a] via-[#0b0f18] to-[#0a0d14] backdrop-blur-xl border-r border-white/10 gap-3 z-30 shrink-0 h-full justify-between shadow-[4px_0_40px_rgba(0,0,0,0.45)]
            ${isCollapsed ? 'w-14' : 'w-48'} transition-all duration-300
        `}>
            {/* Logo with collapse toggle */}
            <div className="flex items-center gap-2 w-full px-2">
                <button
                    className={`
                        bg-gradient-to-br from-aussie-500 to-aussie-600 rounded-xl flex items-center justify-center text-os-bg font-bold shadow-lg shadow-aussie-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 relative group appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-aussie-500
                        ${isCollapsed ? 'w-9 h-9 text-lg' : 'w-9 h-9 text-lg'}
                    `}
                    onClick={() => onNavigate('dashboard')}
                    title="Dashboard"
                    aria-label="Go to Dashboard"
                >
                    A
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                {!isCollapsed && (
                    <span className="text-sm font-bold text-white truncate">Aussie OS</span>
                )}
            </div>

            {/* Collapse Toggle Button */}
            <button
                onClick={onToggleCollapse}
                className={`
                    absolute top-1/2 -translate-y-1/2 w-5 h-10 bg-[#161b22] border border-white/10 rounded-r-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-aussie-500/20 hover:border-aussie-500/40 transition-all z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aussie-500
                    ${isCollapsed ? 'left-[52px]' : 'left-[184px]'}
                `}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            <div className="flex flex-col gap-1.5 w-full justify-start flex-1 overflow-y-auto no-scrollbar px-2">
                {NAV_ITEMS.map(({ view, icon, tooltip }) => (
                    <ActivityButton
                        key={view}
                        icon={icon}
                        active={activeView === view}
                        onClick={() => onNavigate(view as MainView)}
                        tooltip={tooltip}
                        isCollapsed={isCollapsed}
                        label={tooltip}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-1.5 w-full items-center pb-2 px-2">
                <div className="h-px w-full bg-white/5 mb-1" />
                <ActivityButton icon={Search} active={false} onClick={onSpotlight} tooltip="Search (Cmd+K)" isCollapsed={isCollapsed} label="Search" />
                <ActivityButton icon={Settings} active={activeView === 'settings'} onClick={() => onNavigate('settings')} tooltip="Settings" isCollapsed={isCollapsed} label="Settings" />
            </div>
        </div>
    );
});

const MobileTab = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={`
            flex flex-col items-center justify-center flex-1 py-2 sm:py-2.5 transition-all active:scale-90 touch-manipulation group
            ${active ? 'text-aussie-400' : 'text-gray-500 hover:text-gray-300'}
        `}
    >
        <div className={`
            p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all shadow-sm mb-1
            ${active ? 'bg-gradient-to-br from-aussie-500/25 to-aussie-500/10 border border-aussie-500/40 shadow-lg shadow-aussie-500/20' : 'bg-white/5 border border-transparent group-hover:bg-white/10 group-hover:border-white/20'}
        `}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
        </div>
        <span className={`text-[9px] sm:text-[10px] font-semibold tracking-tight truncate max-w-12 ${active ? 'text-aussie-400' : 'text-gray-500'}`}>
            {label}
        </span>
        {active && <div className="w-1 h-1 rounded-full bg-aussie-400 mt-1 shadow-glow-sm"></div>}
    </button>
);

const ActivityButton = ({ icon: Icon, active, onClick, tooltip, isCollapsed, label }: any) => (
    <div className="w-full flex items-center justify-center relative group">
        {/* Active Indicator */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-aussie-300 to-aussie-600 rounded-r-full shadow-glow" />
        )}

        <button
            onClick={onClick}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`
                flex items-center gap-2.5 w-full rounded-lg transition-all duration-200 py-2 px-2 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-aussie-500 focus-visible:ring-inset
                ${active
                    ? 'text-aussie-300 bg-gradient-to-br from-aussie-500/20 to-aussie-500/10 shadow-md shadow-aussie-500/15 border border-aussie-500/30 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/15 active:scale-95'}
            `}
        >
            <div className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${active ? 'bg-aussie-500/20' : ''}`}>
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            </div>
            {!isCollapsed && <span className="text-xs font-semibold whitespace-nowrap text-left flex-1 truncate">{label}</span>}
            {active && !isCollapsed && <div className="w-1 h-1 rounded-full bg-aussie-400 shadow-glow"></div>}
        </button>

        {/* Tooltip - only show when collapsed */}
        {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#1a1f2e]/98 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-xl transform translate-x-1 group-hover:translate-x-0 transition-all duration-150 backdrop-blur-xl">
                <span className="flex items-center gap-1.5">
                    {tooltip}
                    {tooltip.includes('Cmd') && <code className="text-[9px] bg-white/10 px-1 py-0.5 rounded font-mono">⌘K</code>}
                </span>
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#1a1f2e] border-l border-b border-white/10 transform rotate-45" />
            </div>
        )}
    </div>
);
