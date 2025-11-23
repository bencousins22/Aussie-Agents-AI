
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Headphones, Trash2, Plus, ArrowUp, ChevronDown, Paperclip, Menu, Bot, X } from 'lucide-react';
import { useAgent } from '../services/useAgent';
import { ChatInterface } from './ChatInterface';
import { AgentStatus } from './AgentStatus';
import { MediaPlayer } from './MediaPlayer';
import { NotificationCenter } from './NotificationCenter';
import { Spotlight } from './Spotlight';
import { ActivityBar, NAV_ITEMS } from './ActivityBar';
import { MobileSidebar } from './MobileSidebar';
import { StatusBar } from './StatusBar';
import { scheduler } from '../services/scheduler';
import { MainView } from '../types';
import { Resizable } from './Resizable';
import { bus } from '../services/eventBus';
import { Workspace } from './Workspace';

const BootLoader = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    
    useEffect(() => {
        const bootSequence = [
            { t: 200, msg: 'BIOS CHECK... OK' },
            { t: 600, msg: 'Loading Kernel v2.2.1...' },
            { t: 1000, msg: 'Mounting Virtual Filesystem...' },
            { t: 1500, msg: 'Initializing Graphics Engine...' },
            { t: 2000, msg: 'Starting Network Services...' },
            { t: 2500, msg: 'Authenticating Secure Enclave...' },
            { t: 3200, msg: 'Loading User Workspace...' },
            { t: 3800, msg: 'Starting Window Manager...' },
            { t: 4200, msg: 'System Ready.' }
        ];

        let mounted = true;
        
        bootSequence.forEach(({t, msg}, i) => {
            setTimeout(() => {
                if(mounted) {
                    setLogs(prev => [...prev.slice(-6), msg]);
                }
            }, t);
        });

        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                const diff = Math.random() * 4; 
                return Math.min(p + diff, 100);
            });
        }, 60);

        return () => { mounted = false; clearInterval(interval); };
    }, []);

    useEffect(() => {
        if (progress >= 100) {
            const timer = setTimeout(() => {
                onComplete();
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [progress, onComplete]);

    return (
        <div className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center z-[100] font-mono select-none text-aussie-500 overflow-hidden cursor-wait">
            <div className="w-80 mb-10 relative flex flex-col items-center z-10">
                <div className="w-20 h-20 border border-aussie-500/30 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden bg-black/40 backdrop-blur-sm shadow-[0_0_30px_-5px_rgba(0,229,153,0.2)] animate-subtle-pulse">
                    <div className="absolute inset-0 bg-aussie-500/10 animate-pulse"></div>
                    <div className="text-3xl font-bold tracking-tighter text-white">A</div>
                </div>
                
                <div className="text-3xl font-bold tracking-[0.2em] mb-2 text-white text-center">AUSSIE OS</div>
                <div className="text-[10px] text-aussie-500/60 mb-8 uppercase tracking-widest flex items-center gap-2">
                    <span>v2.2.1</span>
                    <span className="w-1 h-1 bg-aussie-500 rounded-full"></span>
                    <span>JulesVM</span>
                </div>
                
                <div className="h-1.5 bg-gray-800/50 w-full rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div 
                        className="h-full bg-aussie-500 shadow-[0_0_15px_#00e599] relative" 
                        style={{width: `${progress}%`, transition: 'width 0.1s ease-out'}}
                    >
                    </div>
                </div>
                
                <div className="mt-4 h-20 w-full overflow-hidden flex flex-col justify-end">
                    {logs.map((log, i) => (
                        <div key={i} className="text-[10px] text-gray-500 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <span className="text-aussie-500 mr-2">&gt;</span>{log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<MainView>('dashboard');
    const [input, setInput] = useState('');
    const [activePanel, setActivePanel] = useState<'terminal' | 'problems'>('terminal');
    const [showSpotlight, setShowSpotlight] = useState(false);
    const [booting, setBooting] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [chatOpen, setChatOpen] = useState(false); 
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mobileCodeView, setMobileCodeView] = useState<'editor' | 'terminal' | 'files'>('editor');

    const { messages, isProcessing, workflowPhase, terminalBlocks, editorTabs, activeTabPath, setActiveTabPath, openFile, mediaFile, setMediaFile, processUserMessage, runShellCommand, isLive, isTtsEnabled, toggleLive, toggleTts, clearMessages, handleFileUpload } = useAgent();

    const handleNavigate = (view: MainView) => {
        if (view === 'code' && activeTabPath === null && editorTabs.length > 0) {
            setActiveTabPath(editorTabs[0].path);
        }
        setActiveView(view);
        if (window.innerWidth < 768) {
            if (view === 'browser') setChatOpen(true);
        }
    };

    const handleSendMessage = async (text: string = input) => {
        if (!text.trim() && !isLive) return;
        setInput('');
        if (!chatOpen) setChatOpen(true);
        await processUserMessage(text);
    };

    useEffect(() => {
        scheduler.start();
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(false);
                if(!chatOpen) setChatOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        
        const handleShellCmd = (e: any) => {
            if (e.detail) runShellCommand(e.detail);
        };
        window.addEventListener('shell-cmd', handleShellCmd);
        
        const unsub = bus.subscribe((e) => {
            if (e.type === 'switch-view') handleNavigate(e.payload.view || 'dashboard');
            if (e.type === 'browser-navigate') { setActiveView('browser'); setChatOpen(true); }
        });
        return () => { 
            scheduler.stop(); 
            window.removeEventListener('resize', handleResize); 
            window.removeEventListener('shell-cmd', handleShellCmd);
            unsub(); 
        };
    }, [chatOpen]);

    if (booting) return <BootLoader onComplete={() => setBooting(false)} />;

    const isMobileBrowserSplit = isMobile && activeView === 'browser' && chatOpen;
    const viewName = activeView === 'dashboard' ? 'Aussie OS' : activeView.charAt(0).toUpperCase() + activeView.slice(1);

    return (
        <div className="fixed inset-0 flex flex-col md:flex-row bg-os-bg text-os-text overflow-hidden font-sans h-[100dvh] w-screen">
            <NotificationCenter />
            <Spotlight isOpen={showSpotlight} onClose={() => setShowSpotlight(false)} onNavigate={handleNavigate} />
            
            {/* Mobile Sidebar Drawer (Left Side App Drawer) */}
            <MobileSidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                activeView={activeView} 
                onNavigate={handleNavigate}
                menuItems={NAV_ITEMS as any}
            />

            {/* Mobile Top Header */}
            {isMobile && (
                <div className="bg-[#0a0c10]/90 backdrop-blur-xl border-b border-os-border shrink-0 z-[50] relative pt-safe select-none shadow-sm">
                    <div className="h-14 flex items-center justify-between px-4">
                        <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                            {activeView === 'dashboard' && (
                                <div className="w-6 h-6 bg-aussie-500 rounded-md flex items-center justify-center text-black text-[10px] font-bold shadow-lg shadow-aussie-500/20">A</div>
                            )}
                            <span>{viewName}</span>
                        </div>
                        
                        <button 
                            onClick={() => setChatOpen(!chatOpen)} 
                            className={`p-2 -mr-2 rounded-lg transition-all active:scale-95 ${chatOpen ? 'text-aussie-500 bg-aussie-500/10' : 'text-gray-400 hover:text-white'}`}
                        >
                            {chatOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            {!isMobile && (
                <div className="h-full shrink-0 z-30 relative">
                    <ActivityBar 
                        activeView={activeView} 
                        onNavigate={handleNavigate} 
                        onSpotlight={() => setShowSpotlight(true)} 
                        isMobile={false} 
                        onChatToggle={() => setChatOpen(!chatOpen)} 
                    />
                </div>
            )}

            {/* Main Content Container */}
            <div className="flex flex-1 min-w-0 relative h-full flex-row overflow-hidden">
                
                {/* Workspace Content */}
                <div className={`flex-1 flex flex-col min-w-0 relative h-full bg-os-bg ${isMobileBrowserSplit ? 'h-[55%]' : 'h-full'} ${isMobile ? 'pb-[70px]' : ''}`}>
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
                    />
                </div>

                {/* Chat Drawer */}
                <div className={`
                    bg-os-bg flex flex-col
                    transition-all duration-300 ease-out
                    ${isMobile 
                        ? `fixed inset-x-0 bottom-[70px] z-[55] border-t border-os-border shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] rounded-t-2xl ${chatOpen ? 'translate-y-0 h-[calc(85%-70px)]' : 'translate-y-full h-0'}` 
                        : `relative shrink-0 border-l border-os-border ${chatOpen ? 'w-[360px] opacity-100' : 'w-0 opacity-0 border-none overflow-hidden'}`
                    }
                `}>
                    {/* Mobile Pull Indicator */}
                    {isMobile && (
                        <div className="w-full flex justify-center pt-2 pb-1 cursor-pointer bg-os-panel rounded-t-2xl" onClick={() => setChatOpen(false)}>
                            <div className="w-10 h-1 bg-gray-700 rounded-full hover:bg-gray-500 transition-colors" />
                        </div>
                    )}

                    {/* Chat Header */}
                    <div className={`h-12 border-b border-os-border flex items-center justify-between px-4 bg-os-panel shrink-0 ${isMobile ? '' : 'rounded-t-2xl md:rounded-none pt-1'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isProcessing || isLive ? 'bg-aussie-500 animate-pulse' : 'bg-aussie-500'}`} />
                            <span className="font-bold text-sm text-white truncate">Aussie Agent</span>
                            <AgentStatus state={workflowPhase} />
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={toggleTts} className={`p-2 rounded-lg transition-colors ${isTtsEnabled ? 'text-aussie-500' : 'text-gray-400 hover:text-white'}`}><Headphones className="w-4 h-4" /></button>
                            <button onClick={clearMessages} className="p-2 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            {isMobile && <button onClick={() => setChatOpen(false)} className="p-2 text-gray-400"><ChevronDown className="w-5 h-5" /></button>}
                        </div>
                    </div>
                    
                    {/* Chat Body */}
                    <div className="flex-1 min-h-0 bg-os-bg">
                        <ChatInterface messages={messages} onQuickAction={handleSendMessage} isProcessing={isProcessing} />
                    </div>
                    
                    {/* Chat Input */}
                    <div className="border-t border-os-border bg-os-bg shrink-0 p-3 pb-safe">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                        <div className="flex items-end gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className="flex-1 bg-[#1c2128] border border-gray-700 rounded-3xl flex items-center relative min-h-[44px] focus-within:border-aussie-500/50 focus-within:ring-1 focus-within:ring-aussie-500/20 transition-all">
                                <textarea 
                                    value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=`${Math.min(e.target.scrollHeight,120)}px`; }}
                                    placeholder={isLive ? "Listening..." : "Message..."}
                                    className="w-full bg-transparent text-white text-[15px] px-4 py-2.5 max-h-32 outline-none resize-none placeholder-gray-500" 
                                    rows={1} style={{ height: '44px' }}
                                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                />
                                <button onClick={toggleLive} className={`absolute right-1.5 bottom-1.5 p-2 rounded-full transition-all ${isLive ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-gray-400 hover:text-white'}`}>{isLive ? <Mic className="w-4 h-4"/> : <MicOff className="w-4 h-4"/>}</button>
                            </div>
                            <button 
                                onClick={() => handleSendMessage()} 
                                disabled={!input.trim() && !isLive} 
                                className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center transition-all shadow-lg ${input.trim() ? 'bg-aussie-500 text-black hover:bg-aussie-600 shadow-aussie-500/20' : 'bg-[#1c2128] text-gray-600'}`}
                            >
                                <ArrowUp className="w-5 h-5 stroke-[3]" />
                            </button>
                        </div>
                    </div>
                    {!isMobile && <Resizable direction="horizontal" mode="parent" minSize={300} maxSize={600} />}
                </div>
            </div>

            {/* Mobile Activity Bar (Bottom Dock) */}
            {isMobile && (
                <ActivityBar 
                    activeView={activeView} 
                    onNavigate={handleNavigate} 
                    onSpotlight={() => setShowSpotlight(true)} 
                    isMobile={true} 
                    onChatToggle={() => setChatOpen(!chatOpen)}
                    onMenuToggle={() => setSidebarOpen(true)}
                />
            )}

            {mediaFile && activeView !== 'code' && <MediaPlayer file={mediaFile} onClose={() => setMediaFile(null)} />}
            {!isMobile && <StatusBar activeTab={editorTabs.find(t => t.path === activeTabPath)} />}
        </div>
    );
};

export default App;
