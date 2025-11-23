
import React, { useState, useEffect, memo, useRef } from 'react';
import { fs } from '../services/fileSystem';
import { Bot, Terminal, Globe, FileText, Rocket, Github, Folder, FilePlus, StickyNote, RefreshCw, Settings, Trash2, LayoutGrid, Zap, Monitor, Image as ImageIcon, AlignLeft, Grid, Code2, Calendar } from 'lucide-react';
import { MainView, DesktopItem, Widget, OSWindow } from '../types';
import { notify } from '../services/notification';
import { dashboardState, Wallpaper } from '../services/dashboardState';
import { wm } from '../services/windowManager';
import { WindowManager } from './WindowManager';
import { NoteWidget } from './NoteWidget';
import { julesAgent } from '../services/jules';
import { bus } from '../services/eventBus';
import { NAV_ITEMS } from './ActivityBar';
import { SystemInfo } from './SystemInfo';
import { WebOsDock } from './WebOsDock';

interface Props {
    onNavigate: (view: MainView) => void;
    activeView: MainView;
}

interface IconPosition {
    x: number;
    y: number;
}

// Grid config
const GRID_W = 90;
const GRID_H = 100;
const PADDING = 20;
const MOBILE_TOP_PADDING = 120; // Increased to reliably clear the 60px mobile header + safe areas

const ClockWidget: React.FC<{ onClose: () => void }> = memo(({ onClose }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const timer = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(timer); }, []);
    return (
        <div className="bg-os-panel/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl w-[240px] cursor-move select-none group hover:bg-os-panel/60 transition-colors ring-1 ring-white/5">
             <div className="flex justify-between items-start mb-1">
                 <div className="text-[10px] font-bold text-aussie-500 uppercase tracking-widest opacity-80">Local Time</div>
                 <Trash2 className="w-3 h-3 cursor-pointer text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" onClick={onClose} />
             </div>
             <div className="text-4xl font-mono font-bold text-white tracking-tight mb-1 drop-shadow-md">
                 {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
             <div className="text-xs text-gray-400 font-medium">
                 {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
             </div>
        </div>
    );
});

export const Dashboard: React.FC<Props> = memo(({ onNavigate, activeView }) => {
    const [icons, setIcons] = useState<DesktopItem[]>([]);
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [wallpaper, setWallpaper] = useState<Wallpaper>(dashboardState.getWallpaper());
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [iconPositions, setIconPositions] = useState<Record<string, IconPosition>>({});
    const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [openWindows, setOpenWindows] = useState<OSWindow[]>([]);
    
    const [dragTarget, setDragTarget] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        refreshDesktop();
        const i = setInterval(refreshDesktop, 5000); 
        
        const unsub = dashboardState.subscribe((state) => {
            setWidgets(state.widgets);
            setWallpaper(state.wallpaper);
        });

        try {
            const saved = localStorage.getItem('desktop_icon_positions');
            if (saved) setIconPositions(JSON.parse(saved));
        } catch (e) {}

        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);

        const handleResize = () => {
            if (containerRef.current) {
                setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const unsubWindows = wm.subscribe((wins) => setOpenWindows(wins));

        return () => {
            clearInterval(i);
            unsub();
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('resize', handleResize);
            unsubWindows();
        };
    }, []);

    useEffect(() => {
        if (Object.keys(iconPositions).length > 0) {
            localStorage.setItem('desktop_icon_positions', JSON.stringify(iconPositions));
        }
    }, [iconPositions]);

    const refreshDesktop = () => {
        try {
            const files = fs.readDir('/home/aussie/Desktop');
            const desktopIcons: DesktopItem[] = files.map(f => {
                let type: DesktopItem['type'] = f.type === 'directory' ? 'folder' : 'file';
                let appTarget: MainView | undefined;
                let windowAppId: string | undefined;

                if (f.name.endsWith('.lnk')) {
                    const content = fs.readFile(f.path);
                    if (content.startsWith('app:')) {
                        type = 'app';
                        appTarget = content.split(':')[1] as MainView;
                    } else if (content.startsWith('app-window:')) {
                        type = 'app';
                        windowAppId = content.split(':')[1];
                    }
                }
                return { name: f.name.replace('.lnk', ''), path: f.path, type, appTarget, windowAppId };
            });
            setIcons(desktopIcons);
        } catch (e) { console.error(e); }
    };

    const getIconPosition = (name: string, index: number) => {
        if (iconPositions[name]) return iconPositions[name];
        
        const isMobile = window.innerWidth < 768;
        const startY = isMobile ? PADDING + MOBILE_TOP_PADDING : PADDING;

        // Auto Grid Layout
        const availableHeight = Math.max(300, containerSize.height - (startY * 2));
        const maxRows = Math.floor(availableHeight / GRID_H);
        const safeRows = maxRows > 0 ? maxRows : 1;
        
        // Column-major (fills top-down, then left-right) for Desktop
        if (!isMobile) {
            const col = Math.floor(index / safeRows);
            const row = index % safeRows;
            return { x: PADDING + (col * GRID_W), y: PADDING + (row * GRID_H) };
        } else {
            // Row major for mobile with generous top margin
            const cols = Math.floor(containerSize.width / GRID_W);
            const safeCols = Math.max(1, cols);
            const mobileCol = index % safeCols;
            const mobileRow = Math.floor(index / safeCols);
            return { x: PADDING + mobileCol * GRID_W, y: startY + mobileRow * GRID_H };
        }
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, name: string, currentX: number, currentY: number) => {
        e.stopPropagation();
        
        setSelectedIcon(name);
        setDragTarget(name);
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        setDragOffset({
            x: clientX - currentX,
            y: clientY - currentY
        });
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (dragTarget) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

            const newX = clientX - dragOffset.x;
            const newY = clientY - dragOffset.y;
            
            setIconPositions(prev => ({
                ...prev,
                [dragTarget]: { x: newX, y: newY }
            }));
        }
    };

    const handleEnd = () => {
        if (dragTarget) {
            const pos = iconPositions[dragTarget];
            if (pos) {
                const snapW = GRID_W / 2;
                const snapH = GRID_H / 2;
                
                const snappedX = Math.round(pos.x / snapW) * snapW;
                const snappedY = Math.round(pos.y / snapH) * snapH;
                
                const maxX = Math.max(100, containerSize.width - 80);
                const maxY = Math.max(100, containerSize.height - 80);
                
                const boundedX = Math.max(10, Math.min(maxX, snappedX));
                const boundedY = Math.max(10, Math.min(maxY, snappedY));

                setIconPositions(prev => ({
                    ...prev,
                    [dragTarget]: { x: boundedX, y: boundedY }
                }));
            }
            setDragTarget(null);
        }
    };

    const handleDoubleClick = (icon: DesktopItem) => {
        if (icon.type === 'app') {
            if (icon.windowAppId) {
                wm.openWindow(icon.windowAppId, icon.name);
            } else if (icon.appTarget) {
                onNavigate(icon.appTarget);
            }
        } else if (icon.type === 'file') {
            notify.info(icon.name, fs.readFile(icon.path).substring(0, 100));
        } else if (icon.type === 'folder') {
            bus.emit('switch-view', { view: 'code' });
        }
        setContextMenu(null);
    };
    
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const menuW = 220; 
        const menuH = 320;

        let x = e.clientX;
        let y = e.clientY;

        if (x + menuW > vw) x = vw - menuW - 10;
        if (y + menuH > vh) y = vh - menuH - 10;
        
        setContextMenu({ x, y });
    };

    // Actions
    const addWidget = (type: Widget['type']) => {
        const centerX = (containerSize.width / 2) - 100;
        const centerY = (containerSize.height / 2) - 100;
        dashboardState.addWidget(type, centerX, centerY); 
        setContextMenu(null);
    };

    const createBotApp = () => {
        julesAgent.processInput("Create a new NBA Bot app called 'Lakers Analytics'");
        setContextMenu(null);
    };

    const removeWidget = (id: string) => dashboardState.removeWidget(id);

    const createTextFile = () => {
        const name = `New File ${Date.now()}.txt`;
        fs.writeFile(`/home/aussie/Desktop/${name}`, '');
        refreshDesktop();
        setContextMenu(null);
    };

    const createFolder = () => {
        const name = `New Folder ${Date.now()}`;
        fs.mkdir(`/home/aussie/Desktop/${name}`);
        refreshDesktop();
        setContextMenu(null);
    };

    const getIconComponent = (name: string, type: string) => {
        if (name.includes('Hyperliquid')) return Zap;
        if (name.includes('NBA') || name.includes('Soccer') || name.includes('Store')) return Bot;
        switch (name) {
            case 'Browser': return Globe;
            case 'Terminal': return Terminal;
            case 'Jules Flow': return Rocket;
            case 'GitHub': return Github;
            case 'Deploy': return Rocket;
            case 'My Projects': return Folder;
            default: return type === 'folder' ? Folder : FileText;
        }
    };

    return (
        <div 
            ref={containerRef}
            className="h-full w-full relative overflow-hidden bg-os-bg select-none touch-none font-sans" 
            onClick={() => setSelectedIcon(null)}
            onContextMenu={handleContextMenu}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
        >
            {/* Command Center Overlay */}
            <div className="absolute inset-x-4 sm:inset-x-6 top-4 sm:top-6 pb-20 z-20 pointer-events-none">
                <div className="max-w-6xl mx-auto space-y-4 pointer-events-auto">
                    {/* Hero */}
                    <div className="w-full rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b1f1a] via-[#0f1423] to-[#0c0f18] p-6 md:p-8 shadow-2xl shadow-black/40 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-aussie-500">Aussie OS Command Center</div>
                            <div className="text-2xl md:text-3xl font-bold text-white leading-tight">All components, one launchpad.</div>
                            <div className="text-sm text-gray-400 max-w-xl">Jump into any workspace: code, browser, flow, scheduler, deploy, marketplace, GitHub, and chat/agent.</div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => onNavigate('code')} className="px-4 py-2 rounded-lg bg-aussie-500 text-black font-bold text-sm shadow-lg shadow-aussie-500/20 hover:bg-aussie-600 active:scale-95 transition-transform">Open Code</button>
                                <button onClick={() => onNavigate('browser')} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm hover:border-aussie-500/40 hover:bg-aussie-500/5">Open Browser</button>
                                <button onClick={() => onNavigate('marketplace')} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm hover:border-aussie-500/40 hover:bg-aussie-500/5">App Store</button>
                            </div>
                        </div>
                    <div className="grid grid-cols-2 gap-3 w-full md:w-[320px] text-xs">
                        <QuickStat label="Open Windows" value={openWindows.length.toString()} />
                        <QuickStat label="Widgets" value={widgets.length.toString()} />
                        <QuickStat label="Desktop Items" value={icons.length.toString()} />
                        <QuickStat label="Active View" value={activeView.toUpperCase()} />
                    </div>
                </div>

                    {/* App Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...NAV_ITEMS].map(item => (
                            <button
                                key={item.view}
                                onClick={() => onNavigate(item.view as MainView)}
                                className={`group w-full text-left rounded-2xl border border-white/10 bg-[#0e111a]/85 backdrop-blur-xl p-4 flex items-center gap-3 hover:border-aussie-500/40 hover:bg-aussie-500/5 transition-colors shadow-lg shadow-black/30 ${activeView === item.view ? 'ring-1 ring-aussie-500/40' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-aussie-500">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{item.tooltip}</div>
                                    <div className="text-[11px] text-gray-500 uppercase tracking-wider">Launch</div>
                                </div>
                                <div className="text-[10px] text-gray-500 group-hover:text-aussie-500">→</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Left Sidebar: All components quick-launch */}
            <div className="absolute inset-y-4 left-4 w-64 bg-[#0f1216]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/30 z-30 hidden xl:flex flex-col">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-aussie-500" />
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">All Components</div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar p-3 space-y-2">
                    {[...NAV_ITEMS].map(item => (
                        <button
                            key={item.view}
                            onClick={() => onNavigate(item.view as MainView)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm border border-transparent hover:border-aussie-500/40 hover:bg-aussie-500/5 transition-colors ${activeView === item.view ? 'bg-aussie-500/10 border-aussie-500 text-white' : 'text-gray-300'}`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="truncate">{item.tooltip}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Sidebar: System snapshot and quick actions */}
            <div className="absolute inset-y-4 right-4 w-80 bg-[#0f1216]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/30 z-30 hidden 2xl:flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">System Snapshot</div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <SystemInfo />
                </div>
                <div className="border-t border-white/5 p-3 bg-[#0c0f15]">
                    <div className="text-[11px] text-gray-500 font-bold uppercase mb-2">Quick Actions</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onNavigate('browser')} className="px-3 py-2 rounded-lg bg-white/5 text-gray-200 hover:bg-aussie-500 hover:text-black transition-colors text-sm flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Browser
                        </button>
                        <button onClick={() => onNavigate('code')} className="px-3 py-2 rounded-lg bg-white/5 text-gray-200 hover:bg-aussie-500 hover:text-black transition-colors text-sm flex items-center gap-2">
                            <Code2 className="w-4 h-4" /> Editor
                        </button>
                        <button onClick={() => onNavigate('scheduler')} className="px-3 py-2 rounded-lg bg-white/5 text-gray-200 hover:bg-aussie-500 hover:text-black transition-colors text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Scheduler
                        </button>
                        <button onClick={() => onNavigate('deploy')} className="px-3 py-2 rounded-lg bg-white/5 text-gray-200 hover:bg-aussie-500 hover:text-black transition-colors text-sm flex items-center gap-2">
                            <Rocket className="w-4 h-4" /> Deploy
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Wallpaper */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className={`absolute inset-0 ${wallpaper.type === 'gradient' || wallpaper.type === 'solid' ? wallpaper.value : ''}`} 
                     style={wallpaper.type === 'image' ? { backgroundImage: `url(${wallpaper.value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} 
                />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>

            {/* Web OS Dock */}
            <div className="absolute top-4 left-4 xl:left-72 z-30 hidden md:block">
                <WebOsDock onNavigate={onNavigate} />
            </div>

            {/* Desktop Icons Layer */}
            <div className="absolute inset-0 z-10 overflow-hidden">
                {icons.map((icon, index) => {
                    const IconComp = getIconComponent(icon.name, icon.type);
                    const isSelected = selectedIcon === icon.name;
                    const isDragging = dragTarget === icon.name;
                    const pos = getIconPosition(icon.name, index);

                    return (
                        <div 
                            key={icon.name}
                            style={{ 
                                position: 'absolute', 
                                left: pos.x, 
                                top: pos.y,
                                width: '80px',
                                touchAction: 'none' 
                            }}
                            onMouseDown={(e) => handleMouseDown(e, icon.name, pos.x, pos.y)}
                            onTouchStart={(e) => handleMouseDown(e, icon.name, pos.x, pos.y)}
                            onClick={(e) => { e.stopPropagation(); setSelectedIcon(icon.name); }}
                            onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(icon); }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedIcon(icon.name);
                                setContextMenu({ x: 'touches' in e ? (e as unknown as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX, y: 'touches' in e ? (e as unknown as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY });
                            }}
                            className={`
                                flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 group select-none
                                ${isSelected ? 'bg-aussie-500/20 backdrop-blur-sm ring-1 ring-aussie-500/50' : 'hover:bg-white/10'}
                                ${isDragging ? 'opacity-90 scale-105 z-50 cursor-grabbing' : 'cursor-pointer'}
                            `}
                        >
                            <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center shadow-xl shrink-0 relative overflow-hidden transition-transform duration-200
                                ${icon.name.includes('Hyperliquid') ? 'bg-gradient-to-br from-[#1a1d24] to-[#000000] text-aussie-500 border border-aussie-500/30' :
                                  icon.name.includes('NBA') ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white' : 
                                  icon.name.includes('Bot') ? 'bg-gradient-to-br from-aussie-500 to-emerald-700 text-white' :
                                  'bg-[#1c2128]/90 border border-white/5 text-gray-400'}
                                ${isSelected ? 'scale-105' : ''}
                            `}>
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none"></div>
                                <IconComp className={`w-6 h-6 drop-shadow-md ${isSelected && !icon.name.includes('Bot') ? 'text-aussie-500' : ''}`} strokeWidth={1.5} />
                            </div>
                            <span className={`
                                text-[11px] font-medium text-center leading-tight line-clamp-2 w-full break-words px-1.5 py-0.5 rounded text-shadow select-none transition-colors
                                ${isSelected ? 'text-white font-bold' : 'text-gray-200 drop-shadow-md'}
                            `} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{icon.name}</span>
                        </div>
                    );
                })}
            </div>
            
            {/* Widgets */}
            {widgets.map(widget => (
                 <div key={widget.id} className="absolute z-20 pointer-events-auto" style={{ top: widget.y, left: widget.x }}>
                    {widget.type === 'clock' && <ClockWidget onClose={() => removeWidget(widget.id)} />}
                    {widget.type === 'note' && <NoteWidget id={widget.id} initialContent={widget.data?.content} color={widget.data?.color} onClose={() => removeWidget(widget.id)} />}
                 </div>
            ))}

            <WindowManager />

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed z-[9999] w-56 bg-[#161b22]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in duration-100 ring-1 ring-black/50"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                    onContextMenu={e => e.preventDefault()}
                >
                    {selectedIcon ? (
                        <>
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1 truncate">{selectedIcon}</div>
                            <ContextItem icon={Zap} label="Open" onClick={() => {
                                const icon = icons.find(i => i.name === selectedIcon);
                                if (icon) handleDoubleClick(icon);
                                setContextMenu(null);
                            }} />
                            <div className="h-px bg-white/5 my-1.5 mx-2" />
                            <ContextItem icon={Trash2} label="Delete" onClick={() => {
                                const icon = icons.find(i => i.name === selectedIcon);
                                if (icon) {
                                    fs.delete(icon.path);
                                    refreshDesktop();
                                }
                                setContextMenu(null);
                            }} />
                        </>
                    ) : (
                        <>
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Create</div>
                            <ContextItem icon={StickyNote} label="New Sticky Note" onClick={() => addWidget('note')} />
                            <ContextItem icon={Folder} label="New Folder" onClick={createFolder} />
                            <ContextItem icon={FileText} label="New Text File" onClick={createTextFile} />
                            <div className="h-px bg-white/5 my-1.5 mx-2" />
                            <ContextItem icon={Bot} label="Create Bot App" onClick={createBotApp} />
                            <div className="h-px bg-white/5 my-1.5 mx-2" />
                            <ContextItem icon={Settings} label="Settings" onClick={() => { onNavigate('settings'); setContextMenu(null); }} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

const ContextItem = ({ icon: Icon, label, onClick }: any) => (
    <button 
        onClick={onClick} 
        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-aussie-500 hover:text-black text-gray-300 transition-colors group"
    >
        <Icon className="w-4 h-4 text-gray-500 group-hover:text-black" />
        <span className="text-xs font-bold">{label}</span>
    </button>
);

const QuickStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
    </div>
);
