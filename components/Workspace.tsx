
import React, { useState, useTransition, useOptimistic } from 'react';
import { Dashboard } from './Dashboard';
import { AgentOS } from './AgentOS';
import { BrowserView } from './BrowserView';
import { FlowEditor } from './FlowEditor';
import { ProjectView } from './ProjectView';
import { TaskScheduler } from './TaskScheduler';
import { GitHubView } from './GitHubView';
import { SettingsView } from './SettingsView';
import { DeployView } from './DeployView';
import { Marketplace } from './Marketplace';
import { MonacoEditor } from './MonacoEditor';
import { TerminalView } from './TerminalView';
import { FileExplorer } from './FileExplorer';
import { BottomTicker } from './BottomTicker';
import { CheckCircle, FileText, Code2, Terminal, Folder, Zap, Users, BarChart3, Code as CodeIcon, Activity } from 'lucide-react';
import { MainView, EditorTab, TerminalBlock, ShellResult } from '../types';
import { WasmLinuxView } from './WasmLinuxView';
import { AgentExecutionPanel } from './AgentExecutionPanel';
import { CollaborationPanel } from './CollaborationPanel';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SnippetsPanel } from './SnippetsPanel';
import { ActivityStream } from './ActivityStream';
import FinancialDashboard from './FinancialDashboard';

interface WorkspaceProps {
    activeView: MainView;
    onNavigate: (view: MainView) => void;
    onSendMessage: (text: string) => void;
    setChatOpen: (open: boolean) => void;
    isMobile: boolean;
    editorTabs: EditorTab[];
    activeTabPath: string | null;
    setActiveTabPath: (path: string) => void;
    activePanel: 'terminal' | 'problems';
    setActivePanel: (panel: 'terminal' | 'problems') => void;
    terminalBlocks: TerminalBlock[];
    openFile: (path: string) => void;
    mobileCodeView: 'editor' | 'terminal' | 'files';
    setMobileCodeView: (view: 'editor' | 'terminal' | 'files') => void;
    onCursorChange: (cursor: { line: number; column: number; path: string }) => void;
    onRunCommand?: (cmd: string) => Promise<ShellResult | void>;
    isProcessing?: boolean;
    workflowPhase?: any;
}

type RightPanelType = 'agent' | 'collaboration' | 'analytics' | 'snippets' | 'activity' | null;

export const Workspace: React.FC<WorkspaceProps> = ({
    activeView, onNavigate, onSendMessage, setChatOpen, isMobile,
    editorTabs, activeTabPath, setActiveTabPath, activePanel, setActivePanel,
    terminalBlocks, openFile, mobileCodeView, setMobileCodeView, onCursorChange, onRunCommand,
    isProcessing = false, workflowPhase = 'idle'
}) => {
    const [rightPanel, setRightPanel] = useState<RightPanelType>(null);
    const monacoEditorRef = React.useRef<any>(null);
    const [isPending, startTransition] = useTransition();
    const [optimisticTabs, addOptimisticTab] = useOptimistic(
        editorTabs,
        (state: EditorTab[], tab: EditorTab) => {
            if (state.find(t => t.path === tab.path)) return state;
            return [...state, tab];
        }
    ) as [EditorTab[], (tab: EditorTab) => void];

    // Handle snippet insertion into editor
    const handleInsertSnippet = (code: string) => {
        if (monacoEditorRef.current) {
            const editor = monacoEditorRef.current;
            const selection = editor.getSelection();
            const range = selection || editor.getModel()?.getFullModelRange();

            const operation = {
                range: range,
                text: code,
                forceMoveMarkers: true,
            };
            editor.executeEdits('insert-snippet', [operation]);
        }
    };

    // Keyboard shortcuts for panel access
    React.useEffect(() => {
        if (activeView !== 'code') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;

            switch (e.key.toLowerCase()) {
                case 'shift':
                    if (e.altKey) {
                        e.preventDefault();
                        setRightPanel(rightPanel === 'agent' ? null : 'agent');
                    }
                    break;
                case 'k':
                    if (e.shiftKey) {
                        e.preventDefault();
                        setRightPanel(rightPanel === 'snippets' ? null : 'snippets');
                    }
                    break;
                case 't':
                    if (e.altKey) {
                        e.preventDefault();
                        setRightPanel(rightPanel === 'collaboration' ? null : 'collaboration');
                    }
                    break;
                case 'l':
                    if (e.altKey) {
                        e.preventDefault();
                        setRightPanel(rightPanel === 'analytics' ? null : 'analytics');
                    }
                    break;
                case 'a':
                    if (e.altKey) {
                        e.preventDefault();
                        setRightPanel(rightPanel === 'activity' ? null : 'activity');
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeView, rightPanel]);
    
    const renderCodeView = () => {
        if (isMobile) {
            const activeTab = editorTabs.find(t => t.path === activeTabPath);
            return (
                <div className="flex-1 flex flex-col min-h-0 relative bg-os-bg">
                     <div className="h-14 bg-os-panel border-b border-os-border flex items-center shrink-0 px-2 gap-2 shadow-sm">
                        <div className="flex-1 flex overflow-x-auto scrollbar-hide gap-1.5">
                            {editorTabs.map(tab => (
                                <button key={tab.path} onClick={() => setActiveTabPath(tab.path)} className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${activeTabPath === tab.path ? 'bg-gradient-to-br from-aussie-500/20 to-aussie-500/10 text-aussie-400 border border-aussie-500/40 shadow-md' : 'text-os-textDim border border-transparent hover:bg-white/5'}`}>{tab.title}</button>
                            ))}
                        </div>
                        <div className="flex bg-black/30 rounded-lg p-1 gap-0.5 shadow-inner flex-shrink-0">
                            <button onClick={() => setMobileCodeView('editor')} className={`p-2 rounded-md transition-all ${mobileCodeView === 'editor' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-500'}`}><Code2 className="w-4 h-4"/></button>
                            <button onClick={() => setMobileCodeView('terminal')} className={`p-2 rounded-md transition-all ${mobileCodeView === 'terminal' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-500'}`}><Terminal className="w-4 h-4"/></button>
                            <button onClick={() => setMobileCodeView('files')} className={`p-2 rounded-md transition-all ${mobileCodeView === 'files' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-500'}`}><Folder className="w-4 h-4"/></button>
                        </div>
                     </div>
                     <div className="flex-1 relative overflow-hidden">
                        {mobileCodeView === 'editor' && (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border-b border-white/5">
                                    <div className="text-[11px] text-gray-500 font-mono truncate">
                                        {activeTab?.path || 'No file'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                        <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{activeTab?.language || 'text'}</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <MonacoEditor filePath={activeTabPath} language={activeTab?.language||'plaintext'} isMobile={true} onCursorChange={onCursorChange} />
                                </div>
                                <div className="sticky bottom-0 left-0 right-0 z-20 bg-[#0b0f16]/95 border-t border-white/10 px-3 py-2 flex items-center gap-2 text-xs text-gray-400 backdrop-blur-md">
                                    <button
                                        onClick={() => { onSendMessage(`Explain and summarize ${activeTab?.path || 'this file'} for mobile editing.`); setChatOpen(true); }}
                                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white font-semibold active:scale-95 transition-all"
                                    >
                                        Ask Jules
                                    </button>
                                    <button
                                        onClick={() => setMobileCodeView('terminal')}
                                        className="px-3 py-2 rounded-lg bg-aussie-500 text-black font-bold active:scale-95 transition-all"
                                    >
                                        Terminal
                                    </button>
                                    <button
                                        onClick={() => onRunCommand?.('npm test')}
                                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 active:scale-95 transition-all"
                                    >
                                        npm test
                                    </button>
                                </div>
                            </div>
                        )}
                        {mobileCodeView === 'terminal' && <TerminalView blocks={terminalBlocks} isMobile={true} onExecute={onRunCommand} statusLabel="wasm linux" />}
                        {mobileCodeView === 'files' && <FileExplorer onFileClick={(path) => { openFile(path); setMobileCodeView('editor'); }} />}
                     </div>
                </div>
            );
        }

        return (
            <div className="flex h-full w-full flex-row min-w-0 overflow-hidden bg-gradient-to-b from-[#0d121c] via-[#0b0f16] to-[#090d13]">
                {/* Left Panel: Editor */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-os-border">
                    <div className="h-11 md:h-12 flex bg-os-bg/95 backdrop-blur-md border-b border-os-border shrink-0 sticky top-0 z-10 shadow-sm">
                        <div className="flex overflow-x-auto scrollbar-hide flex-1">
                            {optimisticTabs.map(tab => (
                                <div key={tab.path} onClick={() => setActiveTabPath(tab.path)} className={`flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 min-w-[140px] md:min-w-[160px] max-w-[240px] cursor-pointer border-r border-os-border/60 select-none text-xs md:text-sm relative group transition-all ${activeTabPath === tab.path ? 'bg-os-panel text-white font-semibold' : 'text-os-textDim hover:bg-os-panel/50 hover:text-white'}`}>
                                    {activeTabPath === tab.path && <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-aussie-500 via-aussie-400 to-emerald-500 shadow-glow" />}
                                    <FileText className="w-3.5 md:w-4 h-3.5 md:h-4 opacity-80 flex-shrink-0" />
                                    <span className="truncate flex-1">{tab.title}</span>
                                </div>
                            ))}
                        </div>
                        {isPending && <div className="px-3 text-[10px] text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aussie-500 animate-pulse shadow-glow" /> Updating…</div>}
                    </div>
                    <div className="flex-1 relative min-w-0 bg-gradient-to-b from-[#0f131a] via-[#0b0f16] to-[#0a0d14]">
                        <MonacoEditor
                            filePath={activeTabPath}
                            language={editorTabs.find(t=>t.path===activeTabPath)?.language||'plaintext'}
                            onCursorChange={onCursorChange}
                            onEditorMount={(editor) => { monacoEditorRef.current = editor; }}
                        />
                    </div>
                    <div className="h-[240px] md:h-[280px] flex flex-col bg-os-bg/90 backdrop-blur-md shrink-0 border-t border-os-border shadow-lg">
                        <div className="h-10 md:h-11 flex items-center px-4 border-b border-os-border gap-5 bg-os-panel/95 backdrop-blur-md sticky top-0 z-10">
                            <button onClick={() => setActivePanel('terminal')} className={`text-xs md:text-sm font-bold uppercase tracking-wider h-full px-3 border-b-[3px] transition-all ${activePanel === 'terminal' ? 'border-aussie-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>Terminal</button>
                            <button onClick={() => setActivePanel('problems')} className={`text-xs md:text-sm font-bold uppercase tracking-wider h-full px-3 border-b-[3px] transition-all ${activePanel === 'problems' ? 'border-aussie-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'}`}>Problems</button>
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-[#0b0f16]">{activePanel === 'terminal' ? <TerminalView blocks={terminalBlocks} onExecute={onRunCommand} statusLabel="wasm linux" /> : <div className="flex items-center justify-center h-full text-gray-500 text-sm"><CheckCircle className="w-6 h-6 mr-3 text-aussie-500"/>No problems found.</div>}</div>
                    </div>
                </div>

                 {/* Right Panel: Integrated Tools */}
                 {rightPanel && (
                     <div className="flex flex-col bg-os-bg shrink-0 border-l border-os-border min-w-[300px] md:min-w-[340px]" style={{ width: 'clamp(320px, 26vw, 460px)' }}>
                         <div className="h-10 md:h-11 flex bg-os-panel/95 backdrop-blur-md border-b border-os-border shrink-0 items-center px-3 gap-1 md:gap-2 shadow-sm overflow-x-auto scrollbar-hide relative group">
                             <button onClick={() => setRightPanel('agent')} title="Ctrl+Shift+Alt" className={`text-[10px] md:text-xs font-bold uppercase tracking-wide px-1.5 md:px-2 py-1.5 rounded border transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5 flex-shrink-0 ${rightPanel === 'agent' ? 'bg-aussie-500/20 text-aussie-300 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}><Zap className="w-3 h-3"/>Agent</button>
                             <button onClick={() => setRightPanel('snippets')} title="Ctrl+Shift+K" className={`text-[10px] md:text-xs font-bold uppercase tracking-wide px-1.5 md:px-2 py-1.5 rounded border transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5 flex-shrink-0 ${rightPanel === 'snippets' ? 'bg-aussie-500/20 text-aussie-300 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}><CodeIcon className="w-3 h-3"/>Snippets</button>
                             <button onClick={() => setRightPanel('collaboration')} title="Ctrl+Alt+T" className={`text-[10px] md:text-xs font-bold uppercase tracking-wide px-1.5 md:px-2 py-1.5 rounded border transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5 flex-shrink-0 ${rightPanel === 'collaboration' ? 'bg-aussie-500/20 text-aussie-300 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}><Users className="w-3 h-3"/>Collab</button>
                             <button onClick={() => setRightPanel('analytics')} title="Ctrl+Alt+L" className={`text-[10px] md:text-xs font-bold uppercase tracking-wide px-1.5 md:px-2 py-1.5 rounded border transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5 flex-shrink-0 ${rightPanel === 'analytics' ? 'bg-aussie-500/20 text-aussie-300 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}><BarChart3 className="w-3 h-3"/>Analytics</button>
                             <button onClick={() => setRightPanel('activity')} title="Ctrl+Alt+A" className={`text-[10px] md:text-xs font-bold uppercase tracking-wide px-1.5 md:px-2 py-1.5 rounded border transition-all whitespace-nowrap flex items-center gap-1 md:gap-1.5 flex-shrink-0 ${rightPanel === 'activity' ? 'bg-aussie-500/20 text-aussie-300 border-aussie-500/40' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'}`}><Activity className="w-3 h-3"/>Activity</button>
                             <div className="flex-1"></div>
                             <button onClick={() => setRightPanel(null)} className="text-gray-500 hover:text-white transition-colors text-lg flex-shrink-0 px-1.5 py-1">✕</button>
                             <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-gray-800 text-white text-[9px] md:text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-gray-700 shadow-lg">
                                 Ctrl+Shift+Alt (Agent), Ctrl+Shift+K (Snippets), Ctrl+Alt+T (Collab), Ctrl+Alt+L (Analytics), Ctrl+Alt+A (Activity)
                             </div>
                         </div>
                         <div className="flex-1 overflow-hidden relative">
                             {rightPanel === 'agent' && <AgentExecutionPanel currentPhase={workflowPhase} isProcessing={isProcessing} executionHistory={terminalBlocks.map((b) => ({ id: b.id, phase: workflowPhase, title: b.type, description: b.content.substring(0, 100), status: b.type === 'error' ? 'error' : 'completed', details: b.content }))} onClose={() => setRightPanel(null)} />}
                             {rightPanel === 'snippets' && <SnippetsPanel onClose={() => setRightPanel(null)} onInsertSnippet={handleInsertSnippet} />}
                             {rightPanel === 'collaboration' && <CollaborationPanel onClose={() => setRightPanel(null)} />}
                             {rightPanel === 'analytics' && <AnalyticsDashboard onClose={() => setRightPanel(null)} />}
                             {rightPanel === 'activity' && <ActivityStream onClose={() => setRightPanel(null)} />}
                         </div>
                     </div>
                 )}

                 {/* File Explorer Panel */}
                 {!rightPanel && (
                    <>
                        <div className="flex flex-col bg-os-bg shrink-0 border-l border-os-border min-w-[240px] md:min-w-[260px]" style={{ width: 'clamp(260px, 22vw, 340px)' }}>
                            <div className="h-10 md:h-11 flex bg-os-panel/95 backdrop-blur-md border-b border-os-border shrink-0 items-center px-3 md:px-4 text-[11px] md:text-sm font-bold uppercase tracking-wider text-gray-400 shadow-sm justify-between gap-2">
                                <span className="truncate">Explorer</span>
                                {editorTabs.length > 0 && (
                                    <button onClick={() => setRightPanel('snippets')} className="text-aussie-500 hover:text-aussie-300 transition-colors flex-shrink-0 p-1" title="Open Snippets"><CodeIcon className="w-4 h-4"/></button>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden relative"><FileExplorer onFileClick={openFile} /></div>
                        </div>
                    </>
                 )}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-os-bg relative h-full overflow-hidden">
            {activeView === 'dashboard' && (
                <div className="flex-1 overflow-auto">
                    <Dashboard onNavigate={onNavigate} activeView={activeView} />
                </div>
            )}
            {activeView === 'agentos' && (
                <div className="flex-1 overflow-hidden">
                    <AgentOS onNavigate={onNavigate} />
                </div>
            )}
            {activeView === 'browser' && <BrowserView onInteract={(q) => { onSendMessage(q); setChatOpen(true); }} />}
            {activeView === 'flow' && <FlowEditor />}
            {activeView === 'projects' && <ProjectView />}
            {activeView === 'scheduler' && <TaskScheduler />}
            {activeView === 'github' && <GitHubView />}
            {activeView === 'settings' && <SettingsView />}
            {activeView === 'deploy' && <DeployView />}
            {activeView === 'marketplace' && <Marketplace />}
            {activeView === 'linux' && <WasmLinuxView onRunCommand={onRunCommand} />}
            {activeView === 'financials' && <FinancialDashboard />}
            {activeView === 'code' && renderCodeView()}
            {!isMobile && <BottomTicker />}
        </div>
    );
};
