
import React from 'react';
import { Dashboard } from './Dashboard';
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
import { Resizable } from './Resizable';
import { CheckCircle, FileText, Code2, Terminal, Folder } from 'lucide-react';
import { MainView, EditorTab, TerminalBlock } from '../types';

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
}

export const Workspace: React.FC<WorkspaceProps> = ({
    activeView, onNavigate, onSendMessage, setChatOpen, isMobile,
    editorTabs, activeTabPath, setActiveTabPath, activePanel, setActivePanel,
    terminalBlocks, openFile, mobileCodeView, setMobileCodeView
}) => {
    
    const renderCodeView = () => {
        if (isMobile) {
            return (
                <div className="flex-1 flex flex-col min-h-0 relative bg-os-bg">
                     <div className="h-12 bg-os-panel border-b border-os-border flex items-center shrink-0 px-2 gap-2">
                        <div className="flex-1 flex overflow-x-auto scrollbar-hide gap-1">
                            {editorTabs.map(tab => (
                                <button key={tab.path} onClick={() => setActiveTabPath(tab.path)} className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${activeTabPath === tab.path ? 'bg-aussie-500/10 text-aussie-500 border border-aussie-500/30' : 'text-os-textDim'}`}>{tab.title}</button>
                            ))}
                        </div>
                        <div className="flex bg-black/20 rounded-lg p-1 gap-1">
                            <button onClick={() => setMobileCodeView('editor')} className={`p-2 rounded ${mobileCodeView === 'editor' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Code2 className="w-4 h-4"/></button>
                            <button onClick={() => setMobileCodeView('terminal')} className={`p-2 rounded ${mobileCodeView === 'terminal' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Terminal className="w-4 h-4"/></button>
                            <button onClick={() => setMobileCodeView('files')} className={`p-2 rounded ${mobileCodeView === 'files' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Folder className="w-4 h-4"/></button>
                        </div>
                     </div>
                     <div className="flex-1 relative overflow-hidden">
                        {mobileCodeView === 'editor' && <MonacoEditor filePath={activeTabPath} language={editorTabs.find(t=>t.path===activeTabPath)?.language||'plaintext'} isMobile={true} />}
                        {mobileCodeView === 'terminal' && <TerminalView blocks={terminalBlocks} isMobile={true} />}
                        {mobileCodeView === 'files' && <FileExplorer onFileClick={(path) => { openFile(path); setMobileCodeView('editor'); }} />}
                     </div>
                </div>
            );
        }

        return (
            <div className="flex h-full w-full flex-row">
                 <div className="flex-1 flex flex-col min-w-0 border-r border-os-border">
                     <div className="h-9 flex bg-os-bg border-b border-os-border shrink-0">
                        <div className="flex overflow-x-auto scrollbar-hide flex-1">
                            {editorTabs.map(tab => (
                                <div key={tab.path} onClick={() => setActiveTabPath(tab.path)} className={`flex items-center gap-2 px-4 min-w-[120px] max-w-[200px] cursor-pointer border-r border-os-border select-none text-[11px] relative group ${activeTabPath === tab.path ? 'bg-os-panel text-white font-medium' : 'text-os-textDim hover:bg-os-panel/50'}`}>
                                    {activeTabPath === tab.path && <div className="absolute top-0 left-0 right-0 h-[2px] bg-aussie-500" />}
                                    <FileText className="w-3.5 h-3.5 opacity-70" />
                                    <span className="truncate flex-1">{tab.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative"><MonacoEditor filePath={activeTabPath} language={editorTabs.find(t=>t.path===activeTabPath)?.language||'plaintext'} /></div>
                    <Resizable direction="vertical" mode="next" reversed={true} />
                    <div className="h-[280px] flex flex-col bg-os-bg shrink-0 border-t border-os-border">
                        <div className="h-8 flex items-center px-2 border-b border-os-border gap-4 bg-os-panel shrink-0">
                            <button onClick={() => setActivePanel('terminal')} className={`text-[10px] font-bold uppercase tracking-wider h-full px-2 border-b-2 ${activePanel === 'terminal' ? 'border-aussie-500 text-white' : 'border-transparent text-gray-500'}`}>Terminal</button>
                            <button onClick={() => setActivePanel('problems')} className={`text-[10px] font-bold uppercase tracking-wider h-full px-2 border-b-2 ${activePanel === 'problems' ? 'border-aussie-500 text-white' : 'border-transparent text-gray-500'}`}>Problems</button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">{activePanel === 'terminal' ? <TerminalView blocks={terminalBlocks} /> : <div className="flex items-center justify-center h-full text-gray-500 text-xs"><CheckCircle className="w-5 h-5 mr-2 text-aussie-500"/>No problems found.</div>}</div>
                    </div>
                 </div>
                 <Resizable direction="horizontal" mode="next" reversed={true} />
                 <div className="w-[250px] flex flex-col bg-os-bg shrink-0 border-l border-os-border">
                    <div className="h-9 flex bg-os-panel border-b border-os-border shrink-0 items-center px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Explorer</div>
                    <div className="flex-1 overflow-hidden relative"><FileExplorer onFileClick={openFile} /></div>
                 </div>
            </div>
        );
    };

    return (
        <div className={`flex-1 flex flex-col min-w-0 bg-os-bg relative overflow-hidden h-full`}>
            {activeView === 'dashboard' && <Dashboard onNavigate={onNavigate} />}
            {activeView === 'browser' && <BrowserView onInteract={(q) => { onSendMessage(q); setChatOpen(true); }} />}
            {activeView === 'flow' && <FlowEditor />}
            {activeView === 'projects' && <ProjectView />}
            {activeView === 'scheduler' && <TaskScheduler />}
            {activeView === 'github' && <GitHubView />}
            {activeView === 'settings' && <SettingsView />}
            {activeView === 'deploy' && <DeployView />}
            {activeView === 'marketplace' && <Marketplace />}
            {activeView === 'code' && renderCodeView()}
            {!isMobile && <BottomTicker />}
        </div>
    );
};
