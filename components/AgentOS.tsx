/**
 * Agent-OS - Web OS Desktop Environment
 * Separate desktop with icons, widgets, and window management
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Globe, Terminal, FileText, Rocket, Github, Folder, StickyNote, Settings, Trash2, Zap, LayoutGrid, MonitorSmartphone, ScreenShare, Power, Search, Wifi, HardDrive } from 'lucide-react';
import { fs } from '../services/fileSystem';
import { MainView, DesktopItem, Widget, OSWindow } from '../types';
import { notify } from '../services/notification';
import { dashboardState, Wallpaper } from '../services/dashboardState';
import { wm } from '../services/windowManager';
import { WindowManager } from './WindowManager';
import { NoteWidget } from './NoteWidget';
import { bus } from '../services/eventBus';
import { appRegistry } from '../services/appRegistry';

interface Props {
    onNavigate: (view: MainView) => void;
}

export const AgentOS: React.FC<Props> = ({ onNavigate }) => {
    const [icons, setIcons] = useState<DesktopItem[]>([]);
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [wallpaper, setWallpaper] = useState<Wallpaper>(dashboardState.getWallpaper());
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [windows, setWindows] = useState<OSWindow[]>(wm.getWindows());
    const [showLauncher, setShowLauncher] = useState(false);
    const [launcherQuery, setLauncherQuery] = useState('');
    const [clock, setClock] = useState(() => new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        refreshDesktop();
        const i = setInterval(refreshDesktop, 5000);

        const unsub = dashboardState.subscribe((state) => {
            setWidgets(state.widgets);
            setWallpaper(state.wallpaper);
        });

        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);

        const handleResize = () => {
            if (containerRef.current) {
                setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const offBus = bus.subscribe((e) => {
            if (e.type === 'agent-create-widget') {
                const targetX = Math.min(containerSize.width - 220, Math.max(40, (e.payload?.x ?? Math.random() * containerSize.width)));
                const targetY = Math.min(containerSize.height - 220, Math.max(80, (e.payload?.y ?? Math.random() * containerSize.height)));
                dashboardState.addWidget(e.payload?.widgetType || 'note', targetX, targetY);
            }
        });

        return () => {
            clearInterval(i);
            unsub();
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('resize', handleResize);
            offBus();
        };
    }, [containerSize.width, containerSize.height]);

    useEffect(() => {
        const unsub = wm.subscribe(setWindows);
        return () => unsub();
    }, []);

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

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
        } catch (e) {
            console.error(e);
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

    const addWidget = (type: Widget['type']) => {
        const centerX = (containerSize.width / 2) - 100;
        const centerY = (containerSize.height / 2) - 100;
        dashboardState.addWidget(type, centerX, centerY);
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

    const runningWindows = useMemo(() => [...windows].sort((a, b) => a.zIndex - b.zIndex), [windows]);
    const focusedWindowId = useMemo(() => {
        const visible = windows.filter(w => !w.isMinimized);
        if (visible.length === 0) return null;
        return visible.reduce((top, w) => w.zIndex > top.zIndex ? w : top).id;
    }, [windows]);

    const pinnedLaunchers = useMemo(() => ([
        { id: 'browser', label: 'Browser', description: 'Navigate & research', icon: Globe, action: () => onNavigate('browser') },
        { id: 'workspace', label: 'Workspace', description: 'Edit and ship code', icon: FileText, action: () => onNavigate('code') },
        { id: 'terminal', label: 'Terminal', description: 'Shell access', icon: Terminal, action: () => bus.emit('switch-view', { view: 'code' }) },
        { id: 'dashboard', label: 'Dashboard', description: 'Command center', icon: Rocket, action: () => onNavigate('dashboard') },
        { id: 'settings', label: 'Settings', description: 'System preferences', icon: Settings, action: () => onNavigate('settings') },
    ]), [onNavigate]);

    const filteredLauncherApps = useMemo(() => {
        const query = launcherQuery.toLowerCase();
        const registryApps = appRegistry.getAll().map(app => ({
            id: app.id,
            label: app.name,
            description: app.description || app.category,
            icon: app.icon || MonitorSmartphone,
            action: () => handleLaunchApp(app.id)
        }));
        const all = [...pinnedLaunchers, ...registryApps];
        if (!query) return all;
        return all.filter(item =>
            item.label.toLowerCase().includes(query) ||
            (item.description || '').toLowerCase().includes(query)
        );
    }, [launcherQuery, pinnedLaunchers]);

    const handleLaunchApp = (appId: string) => {
        const app = appRegistry.get(appId);
        if (!app) {
            notify.error('App not found', appId);
            return;
        }
        if (app.installed === false) {
            notify.info('Install app first', `${app.name} is not installed`);
            return;
        }
        wm.openWindow(app.id, app.name, { title: app.name });
        setShowLauncher(false);
    };

    const toggleWindowFromDock = (win: OSWindow) => {
        if (win.isMinimized) {
            wm.toggleMinimize(win.id);
            wm.focusWindow(win.id);
            return;
        }
        if (focusedWindowId === win.id) {
            wm.toggleMinimize(win.id);
            return;
        }
        wm.focusWindow(win.id);
    };

    const handleShowDesktop = () => {
        wm.minimizeAll();
        setShowLauncher(false);
    };

    return (
        <div
            ref={containerRef}
            className="h-full w-full relative overflow-hidden bg-os-bg select-none"
            onClick={() => { setSelectedIcon(null); setContextMenu(null); setShowLauncher(false); }}
            onContextMenu={handleContextMenu}
        >
            {/* Wallpaper */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div
                    className={`absolute inset-0 ${wallpaper.type === 'gradient' || wallpaper.type === 'solid' ? wallpaper.value : ''}`}
                    style={wallpaper.type === 'image' ? { backgroundImage: `url(${wallpaper.value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>

            {/* Header - Compact */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-md border-b border-white/10 z-20 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-aussie-500/20 border border-aussie-500/30 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-aussie-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white">Agent-OS</h1>
                        <p className="text-[10px] text-gray-500">Desktop</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="px-3 py-1.5 rounded-lg bg-aussie-500 hover:bg-aussie-600 text-black font-semibold text-xs transition-all"
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => onNavigate('settings')}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Desktop Icons Grid - Actual Desktop Style */}
            <div className="absolute inset-0 pt-20 pb-24 px-6 overflow-hidden pointer-events-none">
                <div className="grid grid-cols-[repeat(auto-fill,90px)] gap-2 content-start items-start justify-start h-full overflow-y-auto custom-scrollbar pr-2">
                    {icons.map((icon) => {
                        const IconComp = getIconComponent(icon.name, icon.type);
                        const isSelected = selectedIcon === icon.name;

                        return (
                            <div
                                key={icon.name}
                                onClick={(e) => { e.stopPropagation(); setSelectedIcon(icon.name); }}
                                onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(icon); }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedIcon(icon.name);
                                    setContextMenu({ x: e.clientX, y: e.clientY });
                                }}
                                className={`
                                    flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-150 group select-none cursor-pointer pointer-events-auto w-[84px]
                                    ${isSelected ? 'bg-aussie-500/25 ring-1 ring-aussie-500/40' : 'hover:bg-white/10'}
                                `}
                                style={{ touchAction: 'manipulation' }}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 flex items-center justify-center shadow-lg transition-all ${isSelected ? 'scale-105 border-aussie-500/40 shadow-aussie-500/20' : 'group-hover:scale-105 group-hover:border-white/30'}`}>
                                    <IconComp className="w-6 h-6 text-white drop-shadow" />
                                </div>
                                <span className={`text-[10px] text-center font-medium line-clamp-2 leading-tight max-w-[76px] drop-shadow-sm px-0.5 ${isSelected ? 'text-aussie-200' : 'text-white/90'}`}>
                                    {icon.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Widgets */}
            {widgets.map(widget => (
                <div
                    key={widget.id}
                    className="absolute z-30 pointer-events-auto"
                    style={{ top: widget.y, left: widget.x }}
                >
                    {widget.type === 'note' && <NoteWidget id={widget.id} initialContent={widget.data?.content} color={widget.data?.color} onClose={() => removeWidget(widget.id)} />}
                </div>
            ))}

            {/* Window Manager */}
            <WindowManager />

            {/* Dock / Taskbar - Compact */}
            <div className="absolute left-0 right-0 bottom-2 flex justify-center z-40 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0c1017]/95 border border-white/10 rounded-xl shadow-2xl px-2 py-1.5 max-w-[min(94vw,1100px)] backdrop-blur-md">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowLauncher(v => !v); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${showLauncher ? 'bg-aussie-500 text-black border-aussie-500/60' : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Start
                    </button>

                    <div className="h-5 w-px bg-white/10 mx-1" />

                    <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
                        {runningWindows.length === 0 ? (
                            <div className="text-[10px] text-gray-500 px-2">No windows</div>
                        ) : (
                            runningWindows.map(win => {
                                const appDef = appRegistry.get(win.appId);
                                const Icon = appDef?.icon || MonitorSmartphone;
                                const isFocused = focusedWindowId === win.id;
                                const isMinimized = win.isMinimized;
                                return (
                                    <button
                                        key={win.id}
                                        onClick={(e) => { e.stopPropagation(); toggleWindowFromDock(win); }}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all whitespace-nowrap ${isFocused ? 'bg-aussie-500 text-black border-aussie-500/60 shadow-md shadow-aussie-500/25' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                                        title={win.title}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-semibold max-w-[100px] truncate">{win.title}</span>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isMinimized ? 'bg-gray-500' : 'bg-emerald-400'}`} />
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="h-5 w-px bg-white/10 mx-1" />

                    <button
                        onClick={(e) => { e.stopPropagation(); handleShowDesktop(); }}
                        className="p-1.5 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                        title="Show desktop"
                    >
                        <ScreenShare className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[10px] text-gray-400 font-medium px-1.5 whitespace-nowrap">
                        {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Launcher */}
            {showLauncher && (
                <div
                    className="absolute left-4 bottom-24 z-50 w-[min(640px,92vw)] pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-[#0c1017]/97 border border-white/10 rounded-3xl shadow-2xl p-4 md:p-6 backdrop-blur-xl space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <LayoutGrid className="w-5 h-5 text-aussie-400" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Start</p>
                                    <h3 className="text-lg font-bold text-white">Launch apps</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLauncher(false)}
                                className="px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all"
                            >
                                Close
                            </button>
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                            <Search className="w-4 h-4 text-gray-500" />
                            <input
                                autoFocus
                                value={launcherQuery}
                                onChange={(e) => setLauncherQuery(e.target.value)}
                                placeholder="Search apps, tools, files..."
                                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-600"
                            />
                            {launcherQuery && (
                                <button onClick={() => setLauncherQuery('')} className="text-xs text-gray-500 hover:text-white transition-colors">Clear</button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto custom-scrollbar">
                            {filteredLauncherApps.map(item => {
                                const Icon = item.icon || MonitorSmartphone;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={item.action}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-aussie-500/10 hover:border-aussie-500/30 transition-all text-left"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-aussie-500/10 border border-aussie-500/30 flex items-center justify-center text-aussie-300">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-white truncate">{item.label}</div>
                                            <div className="text-[11px] text-gray-500 truncate">{item.description}</div>
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredLauncherApps.length === 0 && (
                                <div className="col-span-full text-center text-sm text-gray-500">No matches</div>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> Connected</span>
                                <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Virtual FS</span>
                            </div>
                            <button
                                onClick={() => setShowLauncher(false)}
                                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                            >
                                <Power className="w-3.5 h-3.5" /> Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            <ContextItem icon={Settings} label="Settings" onClick={() => { onNavigate('settings'); setContextMenu(null); }} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const ContextItem = ({ icon: Icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-aussie-500 hover:text-black text-gray-300 transition-colors group"
    >
        <Icon className="w-4 h-4 text-gray-500 group-hover:text-black" />
        <span className="text-xs font-bold">{label}</span>
    </button>
);
