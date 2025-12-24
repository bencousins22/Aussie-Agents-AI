
import React from 'react';
import { Search, Settings, Menu, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainView } from '../types';
import { NAV_ITEMS } from '../constants';
import { LAYOUT } from '../constants/ui';

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
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0a0c10]/98 backdrop-blur-xl border-t border-white/10 z-[60] pb-safe flex items-center justify-around px-1">
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
            flex flex-col py-3 bg-[#0a0d12] border-r border-white/[0.06] h-full transition-all duration-200 relative
            ${isCollapsed ? 'w-14' : 'w-[200px]'}
        `}>
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-3 mb-4">
                <div
                    className="w-8 h-8 bg-aussie-500 rounded-lg flex items-center justify-center text-black font-bold text-sm cursor-pointer hover:bg-aussie-400 active:scale-95 transition-all shrink-0"
                    onClick={() => onNavigate('dashboard')}
                    title="Dashboard"
                >
                    A
                </div>
                {!isCollapsed && (
                    <span className="text-sm font-semibold text-white truncate">Aussie OS</span>
                )}
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={onToggleCollapse}
                className={`
                    absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-[#0d1117] border border-white/10 rounded-r flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all z-50
                    ${isCollapsed ? 'left-[54px]' : 'left-[198px]'}
                `}
                title={isCollapsed ? 'Expand' : 'Collapse'}
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Navigation Items */}
            <div className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map(({ view, icon, tooltip }) => (
                    <NavButton
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

            {/* Footer Actions */}
            <div className="flex flex-col gap-0.5 px-2 pt-2 border-t border-white/5 mt-2">
                <NavButton icon={Search} active={false} onClick={onSpotlight} tooltip="Search (⌘K)" isCollapsed={isCollapsed} label="Search" />
                <NavButton icon={Settings} active={activeView === 'settings'} onClick={() => onNavigate('settings')} tooltip="Settings" isCollapsed={isCollapsed} label="Settings" />
            </div>
        </div>
    );
});

const MobileTab = ({ icon: Icon, label, active, onClick }: any) => (
    <button
        onClick={onClick}
        className={`
            flex flex-col items-center justify-center flex-1 py-1.5 transition-all active:scale-90 touch-manipulation
            ${active ? 'text-aussie-400' : 'text-gray-500'}
        `}
    >
        <div className={`
            w-9 h-9 rounded-xl flex items-center justify-center transition-all mb-0.5
            ${active ? 'bg-aussie-500/15 border border-aussie-500/30' : 'bg-transparent'}
        `}>
            <Icon className={`w-5 h-5 ${active ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
        </div>
        <span className={`text-[9px] font-medium ${active ? 'text-aussie-400' : 'text-gray-600'}`}>
            {label}
        </span>
    </button>
);

const NavButton = ({ icon: Icon, active, onClick, tooltip, isCollapsed, label }: any) => (
    <div className="relative group">
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2.5 w-full py-2 px-2.5 rounded-lg transition-all duration-150
                ${active
                    ? 'text-aussie-400 bg-aussie-500/10 border border-aussie-500/20'
                    : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}
            `}
        >
            <Icon className={`w-4 h-4 shrink-0 ${active ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
            {!isCollapsed && (
                <span className="text-xs font-medium truncate">{label}</span>
            )}
            {active && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-aussie-500"></div>
            )}
        </button>

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#161b22] text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-lg transition-opacity">
                {tooltip}
            </div>
        )}
    </div>
);
