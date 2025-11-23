
import React, { useEffect, useRef, useState } from 'react';
import { TerminalBlock } from '../types';
import { Terminal, PlayCircle, ArrowUp, ArrowDown, X, Command, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { shell } from '../services/shell';

interface Props {
    blocks: TerminalBlock[];
    isMobile?: boolean;
}

export const TerminalView: React.FC<Props> = ({ blocks, isMobile = false }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const paletteInputRef = useRef<HTMLInputElement>(null);
    
    const [input, setInput] = useState('');
    const [cwd, setCwd] = useState('/workspace');
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    
    // Palette State
    const [showPalette, setShowPalette] = useState(false);
    const [paletteFilter, setPaletteFilter] = useState('');
    
    // History State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const COMMAND_PRESETS = [
        { id: 'clear', label: 'Clear Terminal', cmd: 'clear', desc: 'Clear output buffer', autoRun: true },
        { id: 'ls', label: 'List Files', cmd: 'ls', desc: 'Show directory contents', autoRun: true },
        { id: 'pwd', label: 'Print Working Directory', cmd: 'pwd', desc: 'Show current path', autoRun: true },
        { id: 'git_status', label: 'Git Status', cmd: 'git status', desc: 'Show working tree status', autoRun: true },
        { id: 'git_log', label: 'Git Log', cmd: 'git log', desc: 'Show commit history', autoRun: true },
        { id: 'cd_root', label: 'Go to Root', cmd: 'cd /', desc: 'Navigate to root', autoRun: true },
        { id: 'cd_workspace', label: 'Go to Workspace', cmd: 'cd /workspace', desc: 'Navigate to workspace', autoRun: true },
        { id: 'npm_install', label: 'NPM Install', cmd: 'npm install ', desc: 'Install dependencies', autoRun: false },
        { id: 'git_commit', label: 'Git Commit', cmd: 'git commit -m ""', desc: 'Commit changes', autoRun: false },
        { id: 'help', label: 'Help', cmd: 'help', desc: 'Show available commands', autoRun: true },
        { id: 'jules', label: 'Ask Jules', cmd: 'gemini-flow jules --task ""', desc: 'Run AI task', autoRun: false },
    ];

    // Keep CWD in sync
    useEffect(() => {
        const timer = setInterval(() => {
            setCwd(shell.getCwd());
        }, 500);
        return () => clearInterval(timer);
    }, []);

    // Smart Scrolling Logic
    useEffect(() => {
        const container = scrollRef.current;
        if (container && shouldAutoScroll) {
            container.scrollTop = container.scrollHeight;
        }
    }, [blocks, shouldAutoScroll]);

    // Keyboard Shortcut for Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                setShowPalette(prev => !prev);
            }
            if (showPalette && e.key === 'Escape') {
                setShowPalette(false);
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPalette]);

    // Focus palette input
    useEffect(() => {
        if (showPalette) {
            setTimeout(() => paletteInputRef.current?.focus(), 50);
        }
    }, [showPalette]);

    const handleScroll = () => {
        const container = scrollRef.current;
        if (container) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            // If user is near bottom (within 50px), enable auto-scroll
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
            setShouldAutoScroll(isNearBottom);
        }
    };

    const executeCommand = (cmdText: string) => {
        if (!cmdText.trim()) return;

        // Add to history
        setHistory(prev => [...prev, cmdText]);
        setHistoryIndex(-1);

        const event = new CustomEvent('shell-cmd', { detail: cmdText });
        window.dispatchEvent(event);
        
        setInput('');
        setShouldAutoScroll(true); // Force scroll to bottom on new command
    };

    const handleInputKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            executeCommand(input);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateHistory(1);
        }
    };

    const handlePaletteSelect = (item: typeof COMMAND_PRESETS[0]) => {
        if (item.autoRun) {
            executeCommand(item.cmd);
        } else {
            setInput(item.cmd);
            inputRef.current?.focus();
        }
        setShowPalette(false);
        setPaletteFilter('');
    };

    const navigateHistory = (direction: number) => {
        if (direction === -1) { // Up
            if (history.length > 0) {
                const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(history[newIndex]);
            }
        } else { // Down
            if (historyIndex !== -1) {
                const newIndex = Math.min(history.length - 1, historyIndex + 1);
                if (historyIndex === history.length - 1) {
                    setHistoryIndex(-1);
                    setInput('');
                } else {
                    setHistoryIndex(newIndex);
                    setInput(history[newIndex]);
                }
            }
        }
    };

    const insertText = (text: string) => {
        setInput(prev => prev + text);
        inputRef.current?.focus();
    };

    const filteredCommands = COMMAND_PRESETS.filter(c => 
        c.label.toLowerCase().includes(paletteFilter.toLowerCase()) || 
        c.cmd.toLowerCase().includes(paletteFilter.toLowerCase())
    );

    return (
        <div 
            className="flex flex-col h-full bg-os-bg font-mono text-sm relative overflow-hidden border-t border-os-border"
            onClick={() => !showPalette && inputRef.current?.focus()}
        >
            {/* Header */}
            <div className="h-8 bg-os-panel border-b border-os-border flex items-center justify-between px-4 text-xs text-os-textDim select-none z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-aussie-500" />
                    <span className="text-aussie-500/80 font-bold hidden md:inline">aussie@local</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-2 items-center mr-4">
                        <span className="text-xs font-bold text-os-textDim hidden sm:inline">vsh</span>
                        <span className="opacity-50 hidden sm:inline">|</span>
                        <span className="text-aussie-400 truncate max-w-[150px]">{cwd}</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${showPalette ? 'text-aussie-500 bg-white/5' : 'text-gray-400'}`}
                        title="Command Palette (Ctrl+Shift+P)"
                    >
                        <Command className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Command Palette Overlay */}
            {showPalette && (
                <div className="absolute top-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[500px] bg-[#1c2128] border border-os-border rounded-xl shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2 overflow-hidden ring-1 ring-black/50">
                    <div className="flex items-center px-3 py-3 border-b border-os-border gap-3 bg-[#161b22]">
                        <Search className="w-4 h-4 text-gray-500 shrink-0" />
                        <input 
                            ref={paletteInputRef}
                            value={paletteFilter}
                            onChange={e => setPaletteFilter(e.target.value)}
                            placeholder="Type a command..."
                            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600"
                            onKeyDown={e => {
                                if (e.key === 'Enter' && filteredCommands.length > 0) {
                                    handlePaletteSelect(filteredCommands[0]);
                                }
                                if (e.key === 'Escape') setShowPalette(false);
                            }}
                        />
                        <div className="text-[10px] text-gray-500 border border-gray-700 px-1.5 rounded">ESC</div>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                        {filteredCommands.map((item, idx) => (
                            <button 
                                key={item.id}
                                onClick={() => handlePaletteSelect(item)}
                                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-aussie-500/10 group transition-colors ${idx === 0 ? 'bg-white/5' : ''}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-200 font-medium group-hover:text-aussie-500 transition-colors">{item.label}</span>
                                    <span className="text-[10px] text-gray-500">{item.desc}</span>
                                </div>
                                <code className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-gray-400 group-hover:text-white transition-colors font-mono">{item.cmd}</code>
                            </button>
                        ))}
                        {filteredCommands.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-xs">No commands found</div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop for Palette */}
            {showPalette && <div className="absolute inset-0 bg-black/20 z-40 backdrop-blur-[1px]" onClick={() => setShowPalette(false)} />}

            {/* Blocks Container */}
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" 
                ref={scrollRef}
                onScroll={handleScroll}
            >
                {blocks.length === 0 && (
                    <div className="opacity-30 text-gray-500 text-xs mb-4">
                        Welcome to Aussie VSH v3.0.0<br/>
                        Type 'help' for available commands or press <kbd className="bg-gray-800 px-1 rounded">Cmd+Shift+P</kbd> for palette.
                    </div>
                )}

                {blocks.map((block) => (
                    <div key={block.id} className="group relative break-words">
                        {/* Command Block */}
                        {block.type === 'command' && (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-aussie-500 font-bold">➜</span>
                                    <span className="text-aussie-400 opacity-80">{block.metadata?.cwd || cwd}</span>
                                </div>
                                <div className="text-gray-200 font-semibold pl-4">
                                    {block.content}
                                </div>
                            </div>
                        )}

                        {/* Tool / Output Blocks */}
                        {block.type === 'tool-call' && (
                            <div className="pl-4 border-l-2 border-aussie-500/30 my-2 py-1">
                                <div className="flex items-center gap-2 text-aussie-500 text-xs font-bold">
                                    <PlayCircle className="w-3 h-3" />
                                    {block.content}
                                </div>
                            </div>
                        )}

                        {block.type === 'ai-thought' && (
                            <div className="pl-4 border-l-2 border-purple-500/30 my-2 text-xs text-gray-400 italic">
                                <ReactMarkdown>{block.content}</ReactMarkdown>
                            </div>
                        )}

                        {block.type === 'output' && (
                            <div className="pl-4 text-gray-300 whitespace-pre-wrap text-xs leading-tight my-1">
                                {block.content}
                            </div>
                        )}

                        {block.type === 'error' && (
                            <div className="pl-4 text-red-400 text-xs whitespace-pre-wrap my-1">
                                {block.content}
                            </div>
                        )}
                    </div>
                ))}

                {/* Active Input Line */}
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-aussie-500 font-bold text-xs">➜</span>
                    <span className="text-aussie-400 text-xs opacity-80 hidden sm:inline">{cwd}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-gray-100 font-mono text-base md:text-sm placeholder-gray-700 caret-aussie-500 p-0"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        placeholder=""
                    />
                </div>
                
                {/* Spacer for scrolling */}
                <div className="h-20 md:h-8"></div>
            </div>

            {/* Mobile Controls */}
            {isMobile && (
                <div className="bg-[#0d1117] border-t border-os-border p-1 flex gap-1 items-center justify-around shrink-0 sticky bottom-0 z-20">
                    <button onClick={() => insertText('/')} className="p-2 rounded bg-os-panel text-gray-400 text-xs border border-os-border flex-1">/</button>
                    <button onClick={() => insertText('-')} className="p-2 rounded bg-os-panel text-gray-400 text-xs border border-os-border flex-1">-</button>
                    <button onClick={() => navigateHistory(-1)} className="p-2 rounded bg-os-panel text-gray-400 border border-os-border"><ArrowUp className="w-4 h-4"/></button>
                    <button onClick={() => navigateHistory(1)} className="p-2 rounded bg-os-panel text-gray-400 border border-os-border"><ArrowDown className="w-4 h-4"/></button>
                    <button onClick={() => setInput('')} className="p-2 rounded bg-red-500/20 text-red-400 border border-red-500/30"><X className="w-4 h-4"/></button>
                </div>
            )}
        </div>
    );
};
