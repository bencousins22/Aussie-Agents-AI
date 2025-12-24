
import React, { useEffect, useRef, useState } from 'react';
import { TerminalBlock } from '../types';
import { Terminal, PlayCircle, ArrowUp, ArrowDown, X, Command, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { shell } from '../services/shell';

interface Props {
    blocks: TerminalBlock[];
    isMobile?: boolean;
    onExecute?: (cmd: string) => Promise<any> | void;
    statusLabel?: string;
}

export const TerminalView: React.FC<Props> = ({ blocks, isMobile = false, onExecute, statusLabel }) => {
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

        if (onExecute) {
            onExecute(cmdText);
        } else {
            const event = new CustomEvent('shell-cmd', { detail: cmdText });
            window.dispatchEvent(event);
        }
        
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
            className="flex flex-col h-full bg-gradient-to-br from-[#0a0e16] via-[#0a101a] to-[#080c13] font-mono text-sm relative overflow-hidden rounded-xl"
            onClick={() => !showPalette && inputRef.current?.focus()}
        >
            {/* Header - Compact */}
            <div className="h-9 bg-gradient-to-r from-[#0f141c] via-[#0d1118] to-[#0b0f14] border-b border-white/10 flex items-center justify-between px-3 text-xs text-gray-400 select-none z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-aussie-500/20 border border-aussie-500/30">
                        <Terminal className="w-3 h-3 text-aussie-500" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Terminal</span>
                    {statusLabel && (
                        <span className="px-1.5 py-0.5 rounded bg-aussie-500/15 text-aussie-400 border border-aussie-500/20 text-[9px] font-semibold">
                            {statusLabel}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        <span className="text-[9px] text-aussie-400/80 truncate max-w-[100px] font-mono">{cwd}</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
                        className={`p-1.5 rounded transition-all ${showPalette ? 'text-aussie-500 bg-aussie-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Command Palette (Ctrl+Shift+P)"
                    >
                        <Command className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Command Palette Overlay - Enhanced */}
            {showPalette && (
                <div className="absolute top-11 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[550px] card rounded-2xl z-50 flex flex-col animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
                    <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3 bg-white/5">
                        <Search className="w-4 h-4 text-aussie-400 shrink-0" />
                        <input
                            ref={paletteInputRef}
                            value={paletteFilter}
                            onChange={e => setPaletteFilter(e.target.value)}
                            placeholder="Search commands..."
                            className="flex-1 bg-transparent outline-none text-white text-sm placeholder-gray-600 font-mono"
                            onKeyDown={e => {
                                if (e.key === 'Enter' && filteredCommands.length > 0) {
                                    handlePaletteSelect(filteredCommands[0]);
                                }
                                if (e.key === 'Escape') setShowPalette(false);
                            }}
                        />
                        <div className="text-[10px] text-gray-500 bg-white/10 border border-white/20 px-2 py-1 rounded-lg font-mono">
                            ESC
                        </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                        {filteredCommands.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handlePaletteSelect(item)}
                                className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-150 group ${idx === 0 ? 'bg-aussie-500/15 border border-aussie-500/40' : 'hover:bg-white/10 border border-transparent'}`}
                            >
                                <div className="flex flex-col gap-1 flex-1">
                                    <span className="text-sm text-gray-100 font-bold group-hover:text-aussie-400 transition-colors">{item.label}</span>
                                    <span className="text-[11px] text-gray-500">{item.desc}</span>
                                </div>
                                <code className="text-[10px] bg-black/30 border border-white/10 px-2 py-1 rounded text-gray-400 group-hover:text-aussie-300 transition-colors font-mono shrink-0 ml-3">
                                    {item.cmd}
                                </code>
                            </button>
                        ))}
                        {filteredCommands.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-xs">No commands found</div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop for Palette */}
            {showPalette && <div className="absolute inset-0 bg-black/20 z-40 backdrop-blur-[1px]" onClick={() => setShowPalette(false)} />}

            {/* Blocks Container */}
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0b0f16] via-[#0a0d14] to-[#080c12]" 
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
                    <div key={block.id} className="group relative break-words animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {/* Command Block */}
                        {block.type === 'command' && (
                            <div className="flex flex-col gap-2 my-3">
                                <div className="flex items-center gap-2 text-xs font-mono">
                                    <span className="text-aussie-500 font-bold text-sm">➜</span>
                                    <span className="text-aussie-400/70 bg-aussie-500/10 px-2 py-1 rounded border border-aussie-500/20 text-[10px] font-mono">
                                        {block.metadata?.cwd || cwd}
                                    </span>
                                </div>
                                <div className="text-gray-100 font-medium pl-4 bg-white/5 px-3 py-2 rounded-lg border-l-2 border-aussie-500/50 text-sm font-mono">
                                    <code>{block.content}</code>
                                </div>
                            </div>
                        )}

                        {/* Tool Call Blocks */}
                        {block.type === 'tool-call' && (
                            <div className="pl-4 border-l-2 border-info-500/40 my-3 py-2 bg-info-500/5 px-3 rounded-r-lg">
                                <div className="flex items-center gap-2.5 text-info-400 text-xs font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-info-500 animate-pulse"></div>
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>{block.content}</span>
                                </div>
                            </div>
                        )}

                        {/* AI Thought Blocks */}
                        {block.type === 'ai-thought' && (
                            <div className="pl-4 border-l-2 border-purple-500/30 my-3 py-2 px-3 bg-purple-500/5 rounded-r-lg">
                                <div className="text-[10px] text-purple-400/80 italic font-mono">
                                    <ReactMarkdown>{block.content}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Output Blocks */}
                        {block.type === 'output' && (
                            <div className="pl-4 py-2 px-3 text-gray-300 whitespace-pre-wrap text-xs leading-relaxed font-mono my-2 bg-white/[0.02] rounded border-l-2 border-white/20">
                                {block.content}
                            </div>
                        )}

                        {/* Error Blocks */}
                        {block.type === 'error' && (
                            <div className="pl-4 py-2 px-3 text-error-400 whitespace-pre-wrap text-xs leading-relaxed font-mono my-2 bg-error-500/10 border-l-2 border-error-500/50 rounded-r-lg">
                                <div className="flex items-start gap-2">
                                    <span className="text-error-500 font-bold mt-0.5">⚠</span>
                                    <span>{block.content}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Active Input Line - Compact */}
                <div className="flex items-center gap-2 pt-3 pb-2 px-1 border-t border-white/5 mt-3">
                    <span className="text-aussie-500 font-bold text-xs shrink-0">➜</span>
                    <span className="text-aussie-400/60 text-[10px] hidden sm:inline font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0 truncate max-w-[80px]">
                        {cwd.split('/').pop() || '/'}
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg outline-none text-gray-100 font-mono text-xs placeholder-gray-600 caret-aussie-500 px-2.5 py-1.5 focus:border-aussie-500/40 focus:ring-1 focus:ring-aussie-500/20 transition-all"
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        placeholder="Type command..."
                    />
                </div>

                {/* Spacer for scrolling */}
                <div className="h-12 md:h-4"></div>
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
