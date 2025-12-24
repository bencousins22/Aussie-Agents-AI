import React, { useState, useEffect, useRef, lazy, Suspense, useTransition } from 'react';
import { Mic, MicOff, Headphones, Trash2, Plus, ArrowUp, ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react';
import { useAgent } from './services/useAgent';
import { scheduler } from './services/scheduler';
import { MainView } from './types';
import { bus } from './services/eventBus';
import { KernelShield } from './components/KernelShield';
import { initWebOsBridge } from './services/webOsBridge';

// Code splitting: Load components lazily
const ChatInterface = lazy(() => import('./components/ChatInterface').then(m => ({ default: m.ChatInterface })));
const AgentStatus = lazy(() => import('./components/AgentStatus').then(m => ({ default: m.AgentStatus })));
const MediaPlayer = lazy(() => import('./components/MediaPlayer').then(m => ({ default: m.MediaPlayer })));
const NotificationCenter = lazy(() => import('./components/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const ActivityBar = lazy(() => import('./components/ActivityBar').then(m => ({ default: m.ActivityBar })));
const StatusBar = lazy(() => import('./components/StatusBar').then(m => ({ default: m.StatusBar })));
const MobileSidebar = lazy(() => import('./components/MobileSidebar').then(m => ({ default: m.MobileSidebar })));
const Workspace = lazy(() => import('./components/Workspace').then(m => ({ default: m.Workspace })));
const TerminalView = lazy(() => import('./components/TerminalView').then(m => ({ default: m.TerminalView })));
const AgentOpsPanel = lazy(() => import('./components/AgentOpsPanel').then(m => ({ default: m.AgentOpsPanel })));
const AgentOS = lazy(() => import('./components/AgentOS').then(m => ({ default: m.AgentOS })));

// Loading fallback component
const ComponentLoader = () => (
    <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aussie-500"></div>
    </div>
);

const BootLoader = () => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const bootSequence = [
            { t: 100, msg: 'Initializing Kernel...' },
            { t: 400, msg: 'Mounting Virtual FS...' },
            { t: 800, msg: 'Starting Network Stack...' },
            { t: 1200, msg: 'Connecting to Gemini Node...' },
            { t: 1600, msg: 'Hydrating React DOM...' },
            { t: 2000, msg: 'Loading User Preferences...' },
            { t: 2200, msg: 'System Check OK.' },
            { t: 2400, msg: 'Booting Interface...' }
        ];

        let mounted = true;

        bootSequence.forEach(({t, msg}) => {
            setTimeout(() => {
                if(mounted) setLogs(prev => [...prev.slice(-5), msg]);
            }, t);
        });

        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) return 100;
                const diff = Math.random() * 10;
                return Math.min(p + diff, 100);
            });
        }, 150);

        return () => { mounted = false; clearInterval(interval); };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] font-mono select-none overflow-hidden" style={{
            background: 'radial-gradient(circle at 20% 20%, rgba(0, 229, 153, 0.08), transparent 20%), radial-gradient(circle at 80% 10%, rgba(90, 203, 255, 0.06), transparent 22%), linear-gradient(160deg, #0b101a 0%, #0c1424 40%, #0a0f18 100%)'
        }}>
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aussie-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-float" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="w-80 flex flex-col items-center">
                    {/* Logo */}
                    <div className="mb-12 relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-aussie-500/30 to-aussie-500/10 border border-aussie-500/50 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl" style={{boxShadow: '0 0 40px rgba(0, 229, 153, 0.3)'}}>
                            <div className="absolute inset-0 bg-gradient-to-r from-aussie-500/0 via-aussie-500/20 to-aussie-500/0 animate-pulse"></div>
                            <div className="text-4xl font-black text-aussie-500">A</div>
                        </div>
                        {/* Pulsing ring */}
                        <div className="absolute inset-0 w-20 h-20 border border-aussie-500/30 rounded-2xl animate-pulse" style={{animationDuration: '2s'}}></div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <div className="text-4xl font-black tracking-[0.15em] mb-2 bg-gradient-to-r from-aussie-400 via-aussie-500 to-emerald-400 bg-clip-text text-transparent">AUSSIE OS</div>
                        <div className="text-xs text-aussie-500/60 uppercase tracking-[0.1em] font-semibold">Version 2.2.1 — Phase 6</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full mb-8">
                        <div className="relative h-2 bg-gray-900/80 rounded-full overflow-hidden border border-aussie-500/20 backdrop-blur-sm">
                            <div
                                className="h-full bg-gradient-to-r from-aussie-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-300"
                                style={{width: `${progress}%`, boxShadow: '0 0 20px rgba(0, 229, 153, 0.5)'}}
                            ></div>
                        </div>
                        <div className="text-center mt-3 text-xs text-aussie-500/70 font-medium">{Math.floor(progress)}%</div>
                    </div>

                    {/* Boot Messages */}
                    <div className="w-full h-40 bg-black/40 border border-aussie-500/20 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl" style={{boxShadow: 'inset 0 0 30px rgba(0, 229, 153, 0.05)'}}>
                        <div className="h-full p-4 flex flex-col justify-end text-[11px] font-medium text-aussie-500/80 space-y-1 font-mono">
                            {logs.map((log, i) => (
                                <div key={i} className="truncate flex gap-3 animate-in slide-in-from-bottom-1 fade-in duration-300">
                                    <span className="text-gray-600 flex-shrink-0">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span>
                                    <span className="text-aussie-400">{log}</span>
                                </div>
                            ))}
                            <div className="flex gap-3">
                                <span className="text-gray-600 flex-shrink-0">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span>
                                <span className="animate-pulse text-aussie-500">▮</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom accent line */}
                    <div className="mt-8 w-24 h-1 bg-gradient-to-r from-aussie-500/0 via-aussie-500 to-aussie-500/0 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

const SIDEBAR_KEY = 'aussie_sidebar_open';
const VIEW_KEY = 'aussie_last_view';
const VIEW_TITLES: Record<MainView, string> = {
    dashboard: 'Dashboard',
    agentos: 'Agent OS',
    code: 'Code',
    flow: 'Flow Builder',
    browser: 'Browser',
    scheduler: 'Scheduler',
    github: 'GitHub',
    settings: 'Settings',
    deploy: 'Deploy',
    projects: 'Projects',
    marketplace: 'Marketplace',
    linux: 'WASM Linux',
};

const App: React.FC = () => {
const [activeView, setActiveView] = useState<MainView>(() => {
        try {
            const stored = localStorage.getItem(VIEW_KEY) as MainView | null;
            return stored || 'agentos';
        } catch {
            return 'agentos';
        }
    });
    const [input, setInput] = useState('');
    const [activePanel, setActivePanel] = useState<'terminal' | 'problems'>('terminal');
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [booting, setBooting] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [chatOpen, setChatOpen] = useState(() => window.innerWidth >= 768);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mobileCodeView, setMobileCodeView] = useState<'editor' | 'terminal' | 'files'>('editor');
    const [isNavPending, startNavTransition] = useTransition();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        try {
            const stored = localStorage.getItem(SIDEBAR_KEY);
            return stored ? stored === 'true' : true; // Default to collapsed for thinner sidebar
        } catch {
            return true;
        }
    });
    const [mobileChatWidth, setMobileChatWidth] = useState('min(420px,78vw)');
    const [cursorLocation, setCursorLocation] = useState<{ line: number; column: number; path: string | null }>({
        line: 1,
        column: 1,
        path: null
    });
    const [showAgentOps, setShowAgentOps] = useState(false);
    const [chatWidth, setChatWidth] = useState(400);
    const [isResizingChat, setIsResizingChat] = useState(false);
    const chatResizeRef = useRef<HTMLDivElement>(null);


    const { messages, isProcessing, workflowPhase, terminalBlocks, editorTabs, activeTabPath, setActiveTabPath, openFile, mediaFile, setMediaFile, processUserMessage, isLive, isTtsEnabled, toggleLive, toggleTts, clearMessages, handleFileUpload, runShellCommand } = useAgent();

    const handleNavigate = (view: MainView) => {
        if (view === 'code' && activeTabPath === null && editorTabs.length > 0) {
            setActiveTabPath(editorTabs[0].path);
        }
        startNavTransition(() => setActiveView(view));
        try { localStorage.setItem(VIEW_KEY, view); } catch {}
        if (window.innerWidth < 768) {
            if (view === 'browser') setChatOpen(true);
            if (view === 'dashboard') setChatOpen(false);
            setShowMobileMenu(false);
        }
        if (isSidebarCollapsed) setIsSidebarCollapsed(false);
    };

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim() && !isLive) return;
        setInput('');
        setChatOpen(true);
        await processUserMessage(text);
    };

    useEffect(() => {
        // Boot sequence timer
        const bootTime = window.innerWidth < 768 ? 2500 : 2800; 
        setTimeout(() => setBooting(false), bootTime);
        
        initWebOsBridge();
        scheduler.start();
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile && !chatOpen) setChatOpen(true);
            if (!mobile && showMobileMenu) setShowMobileMenu(false);

        };
        window.addEventListener('resize', handleResize);
        handleResize();
        
        const unsub = bus.subscribe((e) => {
            if (e.type === 'switch-view') handleNavigate(e.payload.view || 'dashboard');
            if (e.type === 'browser-navigate') handleNavigate('browser');
            if (e.type === 'open-project') {
                handleNavigate('code');
                setChatOpen(true);
                if (e.payload?.path) {
                    runShellCommand?.(`cd ${e.payload.path}`);
                }
                setActivePanel('terminal');
            }
            if (e.type === 'mobile-split-toggle') {
                const payload = e.payload;
                const open = typeof payload === 'boolean' ? payload : payload?.open;
                const width = typeof payload === 'object' && payload?.width ? payload.width : null;
                if (width) setMobileChatWidth(width);
                if (window.innerWidth < 768 && typeof open === 'boolean') {
                    setChatOpen(open);
                }
            }
        });
        return () => { scheduler.stop(); window.removeEventListener('resize', handleResize); unsub(); };
    }, [chatOpen, showMobileMenu]);

    useEffect(() => {
        const handleShellCmd = (event: Event) => {
            const cmd = (event as CustomEvent<string>).detail;
            if (cmd) runShellCommand?.(cmd);
        };
        window.addEventListener('shell-cmd', handleShellCmd as EventListener);
        return () => window.removeEventListener('shell-cmd', handleShellCmd as EventListener);
    }, [runShellCommand]);

    useEffect(() => {
        if (isMobile && messages.length > 0 && messages[messages.length - 1].role === 'model') setChatOpen(true);
    }, [messages.length, isMobile]);

    useEffect(() => {
        if (!isMobile && !chatOpen) {
            setChatOpen(true);
        }
    }, [isMobile, chatOpen]);

    useEffect(() => {
        if (activeTabPath) {
            setCursorLocation(prev => ({ ...prev, path: activeTabPath }));
        }
    }, [activeTabPath]);



    useEffect(() => {
        try { localStorage.setItem(SIDEBAR_KEY, String(isSidebarCollapsed)); } catch {}
    }, [isSidebarCollapsed]);

    if (booting) return <BootLoader />;

    const isMobileBrowserSplit = isMobile && activeView === 'browser' && chatOpen;

    const ChatPanelContent = (
        <div className="flex-1 min-h-0 flex flex-col">
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-3 sm:px-4 bg-[#161b22]/95 backdrop-blur-md shrink-0 pt-safe shadow-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isProcessing || isLive ? 'bg-aussie-500 animate-pulse shadow-glow' : 'bg-aussie-500'}`} />
                    <span className="font-bold text-sm text-white truncate">Aussie Agent</span>
                    <Suspense fallback={null}>
                        <AgentStatus state={workflowPhase} />
                    </Suspense>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setShowAgentOps(v => !v)}
                        className={`p-1.5 rounded-lg transition-colors active:scale-95 ${showAgentOps ? 'text-aussie-500 bg-aussie-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        title="Agent Control Panel"
                    >
                        <Sparkles className="w-4 h-4" />
                    </button>
                    <button onClick={toggleTts} className={`p-1.5 rounded-lg transition-colors active:scale-95 ${isTtsEnabled ? 'text-aussie-500 bg-aussie-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Headphones className="w-4 h-4" /></button>
                    <button onClick={clearMessages} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors active:scale-95"><Trash2 className="w-4 h-4" /></button>
                    {isMobile && (
                        <button
                            onClick={() => setChatOpen(false)}
                            className="px-2 py-1.5 flex items-center gap-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 active:scale-95 border border-white/5"
                            aria-label="Minimize chat"
                        >
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-[11px] font-semibold">Minimize</span>
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
                <Suspense fallback={<ComponentLoader />}>
                    <ChatInterface messages={messages} onQuickAction={handleSendMessage} isProcessing={isProcessing} />
                </Suspense>
                {!isMobile && activeView === 'code' && (
                    <div className="h-[180px] border-t border-white/10 bg-[#0a0e14]/95">
                        <div className="h-7 flex items-center justify-between px-3 border-b border-white/10 bg-[#0d1117]/80">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Quick Terminal</span>
                                <span className="px-1.5 py-0.5 rounded bg-aussie-500/15 text-aussie-400 border border-aussie-500/20 text-[8px] font-semibold">wasm</span>
                            </div>
                        </div>
                        <div className="h-[calc(100%-28px)] overflow-hidden">
                            <Suspense fallback={<ComponentLoader />}>
                                <TerminalView blocks={terminalBlocks} isMobile={false} onExecute={runShellCommand} statusLabel="" />
                            </Suspense>
                        </div>
                    </div>
                )}
            </div>
            <div className="border-t border-white/10 bg-[#0d1117]/95 backdrop-blur-sm shrink-0 p-3 pb-safe space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] text-gray-400 font-semibold">Online</span>
                        </div>
                        <button
                            onClick={() => setShowAgentOps(v => !v)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${showAgentOps ? 'bg-aussie-500/20 text-aussie-300 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}
                        >
                            Agent OS
                        </button>
                        <span className="px-2 py-1 rounded-lg bg-aussie-500/10 text-aussie-500 border border-aussie-500/20 font-semibold text-[10px]">Gemini 2.5 Pro</span>
                        {isProcessing && <span className="w-2 h-2 rounded-full bg-aussie-500 animate-pulse shadow-glow" aria-label="Processing" />}
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 text-[10px]">
                        <button onClick={() => handleSendMessage("/analyze codebase")} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 text-gray-300 hover:bg-white/10 transition-all">Analyze</button>
                        <button onClick={() => handleSendMessage("Summarize recent changes")} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 text-gray-300 hover:bg-white/10 transition-all">Summarize</button>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                <div className="flex items-end gap-2 sm:gap-2.5 md:gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 sm:p-3 md:p-3.5 rounded-xl bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-aussie-500/40 transition-all hover:bg-white/10 active:scale-95"><Plus className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" /></button>
                    <div className="flex-1 bg-[#0f131a]/80 border border-white/10 rounded-xl sm:rounded-2xl flex items-end relative min-h-[52px] sm:min-h-[56px] md:min-h-[60px] shadow-inner shadow-black/40 hover:border-white/20 transition-colors">
                        <textarea
                            value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=`${Math.min(e.target.scrollHeight,140)}px`; }}
                            placeholder={isLive ? "Listening..." : "Message Aussie Agent..."}
                            className="w-full bg-transparent text-white text-[15px] sm:text-base px-3 sm:px-4 md:px-5 py-3 sm:py-3 md:py-4 max-h-36 outline-none resize-none placeholder:text-gray-600"
                            rows={1} style={{ height: '52px' }}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        />
                        <button onClick={toggleLive} className={`absolute right-2 bottom-2 p-2 sm:p-2 md:p-2.5 rounded-xl border transition-all active:scale-95 ${isLive ? 'text-red-500 bg-red-500/10 border-red-500/40 animate-pulse' : 'text-gray-400 border-white/10 hover:border-aussie-500/40 hover:bg-white/5'}`}>{isLive ? <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"/> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"/>}</button>
                    </div>
                    <button onClick={() => handleSendMessage()} disabled={!input.trim() && !isLive} className={`p-2.5 sm:p-3 md:p-3.5 rounded-xl shrink-0 border transition-all active:scale-95 ${input.trim() ? 'bg-aussie-500 text-black border-transparent shadow-glow hover:bg-aussie-600' : 'bg-white/5 text-gray-500 border-white/10'}`}><ArrowUp className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-[3]" /></button>
                </div>
            </div>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 flex flex-col bg-os-bg bg-os-canvas text-os-text overflow-hidden font-sans" 
            aria-busy={isNavPending} 
            data-nav-pending={isNavPending ? 'true' : 'false'}
        >
            <div className="fixed top-3 right-3 z-[200]">
                <KernelShield />
            </div>
            <Suspense fallback={null}>
                <NotificationCenter />
            </Suspense>
            <Suspense fallback={null}>
                <MobileSidebar
                    isOpen={showMobileMenu}
                    onClose={() => setShowMobileMenu(false)}
                    activeView={activeView}
                    onNavigate={handleNavigate}
                />
            </Suspense>

            {/* Top Command Header */}
            <div className="fixed top-0 inset-x-0 h-12 z-[80] bg-[#0d1117]/95 border-b border-white/10 backdrop-blur-xl px-3 sm:px-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-aussie-500/15 border border-aussie-500/30 flex items-center justify-center text-aussie-300 font-black text-sm">
                        A
                    </div>
                    <div className="leading-tight">
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                            <LayoutDashboard className="w-3.5 h-3.5 text-aussie-300" />
                            <span>{VIEW_TITLES[activeView] || 'Workspace'}</span>
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 ml-3">
                    <button onClick={() => handleNavigate('dashboard')} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${activeView === 'dashboard' ? 'bg-aussie-500/20 text-aussie-200 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
                        Home
                    </button>
                    <button onClick={() => handleNavigate('projects')} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${activeView === 'projects' ? 'bg-aussie-500/20 text-aussie-200 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
                        Projects
                    </button>
                    <button onClick={() => handleNavigate('code')} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${activeView === 'code' ? 'bg-aussie-500/20 text-aussie-200 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
                        Code
                    </button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => setChatOpen(true)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-aussie-500 text-black hover:bg-aussie-400 transition-all flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Chat
                    </button>
                    <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-aussie-500 animate-pulse shadow-glow' : 'bg-gray-500'}`} title={isProcessing ? 'Agent running' : 'Idle'} />
                </div>
            </div>

            <div className="flex flex-1 w-full pt-12 min-h-0 overflow-hidden">
                {/* Activity Bar - Persistent Left Sidebar */}
                {!isMobile && (
                    <div className={`h-full transition-all duration-300 ${isSidebarCollapsed ? 'w-14' : 'w-48'}`}>
                        <Suspense fallback={<ComponentLoader />}>
                            <ActivityBar
                                activeView={activeView}
                                onNavigate={handleNavigate}
                                onSpotlight={() => setShowSpotlight(true)}
                                isMobile={false}
                                isCollapsed={isSidebarCollapsed}
                                onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                            />
                        </Suspense>
                    </div>
                )}

                {/* Mobile Bottom Nav */}
                {isMobile && (
                    <div className="fixed bottom-0 left-0 right-0 h-[70px] z-[60] bg-[#0a0c10] border-t border-os-border pb-safe">
                        <Suspense fallback={<ComponentLoader />}>
                            <ActivityBar
                                activeView={activeView}
                                onNavigate={handleNavigate}
                                onSpotlight={() => setShowSpotlight(true)}
                                isMobile={true}
                                onChatToggle={() => setChatOpen(prev => !prev)}
                                onMenuToggle={() => setShowMobileMenu(true)}
                                isCollapsed={false}
                                onToggleCollapse={() => {}}
                            />
                        </Suspense>
                    </div>
                )}

                {/* Desktop layout: two columns, chat on the right (flex ensures chat is flush to far right) */}
                {!isMobile && (
                    <div className="flex-1 min-w-0 h-full overflow-hidden flex">
                        <div className="flex-1 min-w-0 h-full">
                            <div className="w-full h-full px-2 sm:px-3 md:px-4 overflow-auto">
                                <Suspense fallback={<ComponentLoader />}>
                                    <Workspace
                                        activeView={activeView}
                                        onNavigate={handleNavigate}
                                        onSendMessage={handleSendMessage}
                                        setChatOpen={setChatOpen}
                                        isMobile={false}
                                        editorTabs={editorTabs}
                                        activeTabPath={activeTabPath}
                                        setActiveTabPath={setActiveTabPath}
                                        activePanel={activePanel}
                                        setActivePanel={setActivePanel}
                                        terminalBlocks={terminalBlocks}
                                        openFile={openFile}
                                        mobileCodeView={mobileCodeView}
                                        setMobileCodeView={setMobileCodeView}
                                        onCursorChange={setCursorLocation}
                                        onRunCommand={runShellCommand}
                                        isProcessing={isProcessing}
                                        workflowPhase={workflowPhase}
                                    />
                                </Suspense>
                            </div>
                        </div>

                        {/* Agent Ops Panel - Opens next to chat */}
                        {showAgentOps && (
                            <div className="h-full border-l border-white/10 bg-[#0b1018] flex flex-col transition-all duration-300" style={{ width: '320px' }}>
                                <Suspense fallback={<ComponentLoader />}>
                                    <AgentOpsPanel
                                        onNavigate={handleNavigate}
                                        onSendMessage={handleSendMessage}
                                        onClose={() => setShowAgentOps(false)}
                                    />
                                </Suspense>
                            </div>
                        )}

                        {/* Resizable Chat Panel */}
                        <div
                            className="h-full border-l border-white/10 bg-[#0d1117] flex flex-col relative transition-all duration-150"
                            style={{ width: `${chatWidth}px`, minWidth: '300px', maxWidth: '600px' }}
                        >
                            {/* Resize Handle */}
                            <div
                                ref={chatResizeRef}
                                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-aussie-500/50 transition-colors z-50 group"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsResizingChat(true);
                                    const startX = e.clientX;
                                    const startWidth = chatWidth;

                                    const onMouseMove = (ev: MouseEvent) => {
                                        const delta = startX - ev.clientX;
                                        const newWidth = Math.min(600, Math.max(300, startWidth + delta));
                                        setChatWidth(newWidth);
                                    };

                                    const onMouseUp = () => {
                                        setIsResizingChat(false);
                                        document.removeEventListener('mousemove', onMouseMove);
                                        document.removeEventListener('mouseup', onMouseUp);
                                    };

                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                }}
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {ChatPanelContent}
                        </div>
                    </div>
                )}

            {/* Mobile layout (includes dashboard) */}
            {isMobile && (
                <>
                    {isMobileBrowserSplit ? (
                        <div className="flex-1 min-w-0 relative overflow-hidden pb-[70px] flex">
                            <div className="flex-1 min-w-0">
                                <div className="w-full h-full px-2 sm:px-3 md:px-4 overflow-auto">
                                    <Suspense fallback={<ComponentLoader />}>
                                        <Workspace
                                            activeView={activeView}
                                            onNavigate={handleNavigate}
                                            onSendMessage={handleSendMessage}
                                            setChatOpen={setChatOpen}
                                            isMobile={true}
                                            editorTabs={editorTabs}
                                            activeTabPath={activeTabPath}
                                            setActiveTabPath={setActiveTabPath}
                                            activePanel={activePanel}
                                            setActivePanel={setActivePanel}
                                            terminalBlocks={terminalBlocks}
                                            openFile={openFile}
                                            mobileCodeView={mobileCodeView}
                                            setMobileCodeView={setMobileCodeView}
                                            onCursorChange={setCursorLocation}
                                            onRunCommand={runShellCommand}
                                            isProcessing={isProcessing}
                                            workflowPhase={workflowPhase}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                            <div className="w-[min(420px,40vw)] flex-shrink-0 border-l border-white/10 bg-[#0d1117] flex flex-col">
                                {ChatPanelContent}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 min-w-0 relative overflow-hidden pb-[70px]">
                                <div className="flex flex-col min-h-0 min-w-0 flex-1 relative h-full">
                                    <div className="w-full h-full px-2 sm:px-3 md:px-4 overflow-auto">
                                        <Suspense fallback={<ComponentLoader />}>
                                            <Workspace
                                                activeView={activeView}
                                                onNavigate={handleNavigate}
                                                onSendMessage={handleSendMessage}
                                                setChatOpen={setChatOpen}
                                                isMobile={true}
                                                editorTabs={editorTabs}
                                                activeTabPath={activeTabPath}
                                                setActiveTabPath={setActiveTabPath}
                                                activePanel={activePanel}
                                                setActivePanel={setActivePanel}
                                                terminalBlocks={terminalBlocks}
                                                openFile={openFile}
                                                mobileCodeView={mobileCodeView}
                                                setMobileCodeView={setMobileCodeView}
                                                onCursorChange={setCursorLocation}
                                                onRunCommand={runShellCommand}
                                                isProcessing={isProcessing}
                                                workflowPhase={workflowPhase}
                                            />
                                        </Suspense>
                                    </div>
                                </div>
                            </div>

                            {activeView !== 'dashboard' && (
                                <div
                                    className={`
                                        fixed top-14 bottom-[70px] right-0 left-auto z-50 bg-[#0d1117]/98 backdrop-blur-xl transition-transform duration-300 ease-out flex flex-col min-w-0 rounded-l-2xl shadow-2xl ring-1 ring-white/10
                                        ${chatOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'}
                                    `}
                                    style={{ width: mobileChatWidth }}
                                >
                                    {ChatPanelContent}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            </div>

            {mediaFile && activeView !== 'code' && (
                <Suspense fallback={null}>
                    <MediaPlayer file={mediaFile} onClose={() => setMediaFile(null)} />
                </Suspense>
            )}
            {!isMobile && (
                <Suspense fallback={null}>
                    <StatusBar 
                        activeTab={editorTabs.find(t => t.path === activeTabPath)} 
                        cursor={cursorLocation}
                    />
                </Suspense>
            )}

        </div>
    );
};

export default App;
