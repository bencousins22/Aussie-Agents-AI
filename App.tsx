import React, { useState, useEffect, useRef, lazy, Suspense, useTransition } from 'react';
import { Mic, MicOff, Headphones, Trash2, Plus, ArrowUp, ChevronDown } from 'lucide-react';
import { useAgent } from './services/useAgent';
import { scheduler } from './services/scheduler';
import { MainView } from './types';
import { bus } from './services/eventBus';
import { NAV_ITEMS } from './components/ActivityBar';
import { KernelShield } from './components/KernelShield';
import { initWebOsBridge } from './services/webOsBridge';

// Code splitting: Load components lazily
const ChatInterface = lazy(() => import('./components/ChatInterface').then(m => ({ default: m.ChatInterface })));
const AgentStatus = lazy(() => import('./components/AgentStatus').then(m => ({ default: m.AgentStatus })));
const MediaPlayer = lazy(() => import('./components/MediaPlayer').then(m => ({ default: m.MediaPlayer })));
const NotificationCenter = lazy(() => import('./components/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const Spotlight = lazy(() => import('./components/Spotlight').then(m => ({ default: m.Spotlight })));
const ActivityBar = lazy(() => import('./components/ActivityBar').then(m => ({ default: m.ActivityBar })));
const StatusBar = lazy(() => import('./components/StatusBar').then(m => ({ default: m.StatusBar })));
const Resizable = lazy(() => import('./components/Resizable').then(m => ({ default: m.Resizable })));
const MobileSidebar = lazy(() => import('./components/MobileSidebar').then(m => ({ default: m.MobileSidebar })));
const Workspace = lazy(() => import('./components/Workspace').then(m => ({ default: m.Workspace })));
const TerminalView = lazy(() => import('./components/TerminalView').then(m => ({ default: m.TerminalView })));

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
        <div className="fixed inset-0 bg-[#0f1115] flex flex-col items-center justify-center z-[100] font-mono select-none text-aussie-500">
            <div className="w-72 mb-8 relative flex flex-col items-center">
                <div className="w-16 h-16 border-2 border-aussie-500/30 rounded-xl flex items-center justify-center mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-aussie-500/10 animate-pulse"></div>
                    <div className="text-2xl font-bold">A</div>
                </div>
                <div className="text-2xl font-bold tracking-[0.2em] mb-1 text-white">AUSSIE OS</div>
                <div className="text-[10px] text-aussie-500/60 mb-6 uppercase tracking-wider">Version 2.2.1 // JulesVM</div>
                
                <div className="h-1 bg-gray-800 w-full rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-aussie-500 shadow-[0_0_15px_#00e599]" 
                        style={{width: `${progress}%`, transition: 'width 0.2s ease-out'}}
                    ></div>
                </div>
            </div>
            <div className="h-32 w-72 overflow-hidden text-[10px] font-medium opacity-80 flex flex-col justify-end border border-white/5 p-3 rounded-lg bg-black/40 backdrop-blur-sm shadow-2xl">
                {logs.map((log, i) => (
                    <div key={i} className="truncate flex gap-2 animate-in slide-in-from-bottom-1 fade-in duration-200">
                        <span className="text-gray-600">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span> 
                        <span className="text-aussie-500/80">{log}</span>
                    </div>
                ))}
                <div className="flex gap-2">
                    <span className="text-gray-600">[{new Date().toISOString().split('T')[1].slice(0,8)}]</span>
                    <span className="animate-pulse text-aussie-500">_</span>
                </div>
            </div>
        </div>
    );
};

const CHAT_WIDTH_KEY = 'aussie_chat_width';
const SIDEBAR_KEY = 'aussie_sidebar_open';
const VIEW_KEY = 'aussie_last_view';

const clampChatWidth = (value: number, viewport: number) => {
    const min = 320;
    const max = Math.min(Math.max(Math.floor(viewport * 0.28), 380), 480);
    return Math.min(Math.max(value, min), max);
};

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<MainView>(() => {
        try {
            const stored = localStorage.getItem(VIEW_KEY) as MainView | null;
            return stored || 'dashboard';
        } catch {
            return 'dashboard';
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
    const [showSidebar, setShowSidebar] = useState(() => {
        try {
            const stored = localStorage.getItem(SIDEBAR_KEY);
            return stored ? stored === 'true' : true;
        } catch {
            return true;
        }
    });
    const [cursorLocation, setCursorLocation] = useState<{ line: number; column: number; path: string | null }>({
        line: 1,
        column: 1,
        path: null
    });
    const [chatWidth, setChatWidth] = useState(() => {
        const viewport = typeof window !== 'undefined' ? window.innerWidth : 1280;
        try {
            const stored = Number(localStorage.getItem(CHAT_WIDTH_KEY));
            if (!isNaN(stored) && stored > 0) return clampChatWidth(stored, viewport);
        } catch {}
        return clampChatWidth(viewport * 0.28, viewport);
    });

    const { messages, isProcessing, workflowPhase, terminalBlocks, editorTabs, activeTabPath, setActiveTabPath, openFile, mediaFile, setMediaFile, processUserMessage, isLive, isTtsEnabled, toggleLive, toggleTts, clearMessages, handleFileUpload, runShellCommand } = useAgent();

    const handleNavigate = (view: MainView) => {
        if (view === 'code' && activeTabPath === null && editorTabs.length > 0) {
            setActiveTabPath(editorTabs[0].path);
        }
        setActiveView(view);
        try { localStorage.setItem(VIEW_KEY, view); } catch {}
        if (window.innerWidth < 768) {
            if (view === 'browser') setChatOpen(true);
            setShowMobileMenu(false);
        }
        if (!showSidebar) setShowSidebar(true);
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
            const nextWidth = clampChatWidth(chatWidth, window.innerWidth);
            setChatWidth(nextWidth);
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
        });
        return () => { scheduler.stop(); window.removeEventListener('resize', handleResize); unsub(); };
    }, [chatOpen, showMobileMenu]);

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
        try { localStorage.setItem(CHAT_WIDTH_KEY, String(chatWidth)); } catch {}
    }, [chatWidth]);

    useEffect(() => {
        try { localStorage.setItem(SIDEBAR_KEY, String(showSidebar)); } catch {}
    }, [showSidebar]);

    if (booting) return <BootLoader />;

    const isMobileBrowserSplit = isMobile && activeView === 'browser' && chatOpen;

    return (
        <div 
            className="fixed inset-0 flex bg-os-bg bg-os-canvas text-os-text overflow-hidden font-sans" 
            aria-busy={isNavPending} 
            data-nav-pending={isNavPending ? 'true' : 'false'}
        >
            <div className="fixed top-3 right-3 z-[120]">
                <KernelShield />
            </div>
            <Suspense fallback={null}>
                <NotificationCenter />
            </Suspense>
            <Suspense fallback={null}>
                <Spotlight isOpen={showSpotlight} onClose={() => setShowSpotlight(false)} onNavigate={handleNavigate} />
            </Suspense>
            <Suspense fallback={null}>
                <MobileSidebar
                    isOpen={showMobileMenu}
                    onClose={() => setShowMobileMenu(false)}
                    activeView={activeView}
                    onNavigate={handleNavigate}
                    menuItems={[...NAV_ITEMS]}
                />
            </Suspense>

            {/* Activity Bar - Persistent Left Sidebar */}
            {!isMobile && (
                <div className="h-full transition-all duration-200">
                    <Suspense fallback={<ComponentLoader />}>
                        <ActivityBar
                            activeView={activeView}
                            onNavigate={handleNavigate}
                            onSpotlight={() => setShowSpotlight(true)}
                            isMobile={false}
                            onChatToggle={() => setChatOpen(!chatOpen)}
                        />
                    </Suspense>
                </div>
            )}

            {/* Sidebar toggle button removed for persistent sidebar */}

            {/* Mobile Bottom Nav */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 h-[70px] z-[60] bg-[#0a0c10] border-t border-os-border pb-safe">
                    <Suspense fallback={<ComponentLoader />}>
                        <ActivityBar 
                            activeView={activeView} 
                            onNavigate={handleNavigate} 
                            onSpotlight={() => setShowSpotlight(true)} 
                            isMobile={true} 
                            onChatToggle={() => setChatOpen(!chatOpen)} 
                            onMenuToggle={() => setShowMobileMenu(true)} 
                        />
                    </Suspense>
                </div>
            )}

            <div className={`flex flex-1 min-w-0 relative overflow-hidden justify-start items-stretch ${isMobile ? 'pb-[70px]' : ''}`}>
                {/* Main Content Area - Left/Center */}
                <div className={`flex-1 flex flex-col min-h-0 min-w-0 relative order-first ${isMobileBrowserSplit ? 'h-[55%]' : 'h-full'}`}>
                    <div className="w-full h-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 overflow-auto">
                        <Suspense fallback={<ComponentLoader />}>
                            <Workspace
                                activeView={activeView}
                                onNavigate={handleNavigate}
                                onSendMessage={handleSendMessage}
                                setChatOpen={setChatOpen}
                                isMobile={isMobile}
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
                            />
                        </Suspense>
                    </div>
                </div>

                {!isMobile && chatOpen && (
                    <Suspense fallback={null}>
                        <Resizable
                            direction="horizontal"
                            mode="next"
                            reversed={true}
                            minSize={320}
                            maxSize={480}
                            onResize={(w) => setChatWidth(clampChatWidth(w, window.innerWidth))}
                        />
                    </Suspense>
                )}

                {/* Chat Panel - Right rail on desktop, overlay on mobile */}
                <div
                    className={`
                        ${isMobile
                            ? isMobileBrowserSplit
                                ? 'absolute bottom-[70px] left-0 right-0 h-[calc(55%-70px)] z-50 border-t border-white/10 shadow-2xl bg-[#0d1117] flex flex-col min-w-0'
                                : `fixed inset-x-0 top-0 bottom-[70px] z-50 bg-[#0d1117]/98 backdrop-blur-xl transition-transform duration-300 ease-out flex flex-col min-w-0 ${chatOpen ? 'translate-y-0' : 'translate-y-full'}`
                            : `relative order-last flex flex-row bg-[#0d1117] min-w-[320px] max-w-[480px] flex-shrink-0 ${chatOpen ? 'border-l border-white/10' : 'hidden'}`}
                    `}
                    style={!isMobile && chatOpen ? { width: `${chatWidth}px` } : undefined}
                >
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="h-14 md:h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-5 lg:px-6 bg-[#161b22]/95 backdrop-blur-md shrink-0 pt-safe shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${isProcessing || isLive ? 'bg-aussie-500 animate-pulse shadow-glow' : 'bg-aussie-500'}`} />
                                <span className="font-bold text-sm md:text-base text-white">Aussie Agent</span>
                                <Suspense fallback={null}>
                                    <AgentStatus state={workflowPhase} />
                                </Suspense>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                                <button onClick={toggleTts} className={`p-2 md:p-2.5 rounded-lg transition-colors ${isTtsEnabled ? 'text-aussie-500 bg-aussie-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Headphones className="w-4 h-4 md:w-5 md:h-5" /></button>
                                <button onClick={clearMessages} className="p-2 md:p-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                                {isMobile && <button onClick={() => setChatOpen(false)} className="p-2 text-gray-400"><ChevronDown className="w-5 h-5" /></button>}
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 flex flex-col">
                            <Suspense fallback={<ComponentLoader />}>
                                <ChatInterface messages={messages} onQuickAction={handleSendMessage} isProcessing={isProcessing} />
                            </Suspense>
                            {!isMobile && activeView === 'code' && (
                                <div className="h-[200px] border-t border-os-border bg-os-bg/80">
                                    <div className="h-9 flex items-center px-3 border-b border-os-border text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                        Quick Terminal
                                    </div>
                                    <div className="h-[calc(100%-36px)] overflow-hidden">
                                        <Suspense fallback={<ComponentLoader />}>
                                            <TerminalView blocks={terminalBlocks} isMobile={false} />
                                        </Suspense>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-white/10 bg-[#0d1117]/95 backdrop-blur-sm shrink-0 p-3 md:p-4 pb-safe space-y-3">
                            <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 px-1">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <span className="px-2.5 py-1.5 rounded-lg bg-aussie-500/10 text-aussie-500 border border-aussie-500/20 font-semibold text-xs">Gemini 2.5 Pro</span>
                                    {isProcessing && <span className="w-2 h-2 rounded-full bg-aussie-500 animate-pulse shadow-glow" aria-label="Processing" />}
                                </div>
                                <div className="hidden md:flex items-center gap-2 text-[10px]">
                                    <button onClick={() => handleSendMessage("/analyze codebase")} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 text-gray-300 hover:bg-white/10 transition-all">Analyze</button>
                                    <button onClick={() => handleSendMessage("Summarize recent changes")} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 text-gray-300 hover:bg-white/10 transition-all">Summarize</button>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                            <div className="flex items-end gap-2 md:gap-3">
                                <button onClick={() => fileInputRef.current?.click()} className="p-3 md:p-3.5 rounded-xl bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-aussie-500/40 transition-all hover:bg-white/10"><Plus className="w-5 h-5 md:w-6 md:h-6" /></button>
                                <div className="flex-1 bg-[#0f131a]/80 border border-white/10 rounded-2xl flex items-end relative min-h-[56px] md:min-h-[60px] shadow-inner shadow-black/40 hover:border-white/20 transition-colors">
                                    <textarea
                                        value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=`${Math.min(e.target.scrollHeight,140)}px`; }}
                                        placeholder={isLive ? "Listening..." : "Message Aussie Agent..."}
                                        className="w-full bg-transparent text-white text-base md:text-base px-4 md:px-5 py-3 md:py-4 max-h-36 outline-none resize-none placeholder:text-gray-600"
                                        rows={1} style={{ height: '56px' }}
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                    />
                                    <button onClick={toggleLive} className={`absolute right-2 bottom-2 p-2 md:p-2.5 rounded-xl border transition-all ${isLive ? 'text-red-500 bg-red-500/10 border-red-500/40 animate-pulse' : 'text-gray-400 border-white/10 hover:border-aussie-500/40 hover:bg-white/5'}`}>{isLive ? <Mic className="w-5 h-5 md:w-6 md:h-6"/> : <MicOff className="w-5 h-5 md:w-6 md:h-6"/>}</button>
                                </div>
                                <button onClick={() => handleSendMessage()} disabled={!input.trim() && !isLive} className={`p-3 md:p-3.5 rounded-xl shrink-0 border transition-all ${input.trim() ? 'bg-aussie-500 text-black border-transparent shadow-glow hover:bg-aussie-600 active:scale-95' : 'bg-white/5 text-gray-500 border-white/10'}`}><ArrowUp className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" /></button>
                            </div>
                        </div>
                    </div>
                </div>
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
