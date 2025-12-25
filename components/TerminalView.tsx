
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
    const [showPalette, setShowPalette] = useState(false);
    const [paletteFilter, setPaletteFilter] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const COMMAND_PRESETS = [
        { id: 'clear', label: 'Clear', cmd: 'clear', desc: 'Clear output', autoRun: true },
        { id: 'ls', label: 'List Files', cmd: 'ls', desc: 'Directory contents', autoRun: true },
        { id: 'pwd', label: 'PWD', cmd: 'pwd', desc: 'Current path', autoRun: true },
        { id: 'git_status', label: 'Git Status', cmd: 'git status', desc: 'Working tree', autoRun: true },
        { id: 'git_log', label: 'Git Log', cmd: 'git log', desc: 'Commit history', autoRun: true },
        { id: 'help', label: 'Help', cmd: 'help', desc: 'Commands', autoRun: true },
    ];

    useEffect(() => {
        const timer = setInterval(() => setCwd(shell.getCwd()), 500);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const container = scrollRef.current;
        if (container && shouldAutoScroll) {
            container.scrollTop = container.scrollHeight;
        }
    }, [blocks, shouldAutoScroll]);

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

    useEffect(() => {
        if (showPalette) setTimeout(() => paletteInputRef.current?.focus(), 50);
    }, [showPalette]);

    const handleScroll = () => {
        const container = scrollRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
            setShouldAutoScroll(isNearBottom);
        }
    };

    const executeCommand = (cmdText: string) => {
        if (!cmdText.trim()) return;
        setHistory(prev => [...prev, cmdText]);
        setHistoryIndex(-1);
        if (onExecute) {
            onExecute(cmdText);
        } else {
            window.dispatchEvent(new CustomEvent('shell-cmd', { detail: cmdText }));
        }
        setInput('');
        setShouldAutoScroll(true);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') executeCommand(input);
        else if (e.key === 'ArrowUp') { e.preventDefault(); navigateHistory(-1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); navigateHistory(1); }
    };

    const handlePaletteSelect = (item: typeof COMMAND_PRESETS[0]) => {
        if (item.autoRun) executeCommand(item.cmd);
        else { setInput(item.cmd); inputRef.current?.focus(); }
        setShowPalette(false);
        setPaletteFilter('');
    };

    const navigateHistory = (direction: number) => {
        if (direction === -1 && history.length > 0) {
            const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            setInput(history[newIndex]);
        } else if (historyIndex !== -1) {
            if (historyIndex === history.length - 1) { setHistoryIndex(-1); setInput(''); }
            else { const newIndex = Math.min(history.length - 1, historyIndex + 1); setHistoryIndex(newIndex); setInput(history[newIndex]); }
        }
    };

    const filteredCommands = COMMAND_PRESETS.filter(c =>
        c.label.toLowerCase().includes(paletteFilter.toLowerCase()) ||
        c.cmd.toLowerCase().includes(paletteFilter.toLowerCase())
    );

    return (
        <div
            className="flex flex-col h-full bg-[#080c10] font-mono text-xs relative overflow-hidden"
            onClick={() => !showPalette && inputRef.current?.focus()}
        >
            {/* Header */}
            <div className="h-8 bg-[#0a0e14] border-b border-white/[0.06] flex items-center justify-between px-3 select-none shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-aussie-500" />
                    <span className="text-[10px] font-medium text-gray-500">Terminal</span>
                    {statusLabel && <span className="px-1.5 py-0.5 rounded bg-aussie-500/10 text-aussie-500 text-[8px] font-medium">{statusLabel}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-600 font-mono truncate max-w-[80px]">{cwd.split('/').pop() || '/'}</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
                        className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${showPalette ? 'text-aussie-500 bg-aussie-500/15' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <Command className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Command Palette */}
            {showPalette && (
                <>
                    <div className="absolute inset-0 bg-black/20 z-40" onClick={() => setShowPalette(false)} />
                    <div className="absolute top-10 left-2 right-2 bg-[#0d1117] border border-white/10 rounded-xl z-50 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center px-3 py-2 border-b border-white/[0.06] gap-2">
                            <Search className="w-3.5 h-3.5 text-gray-500" />
                            <input
                                ref={paletteInputRef}
                                value={paletteFilter}
                                onChange={e => setPaletteFilter(e.target.value)}
                                placeholder="Search..."
                                className="flex-1 bg-transparent outline-none text-white text-xs placeholder-gray-600"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && filteredCommands.length > 0) handlePaletteSelect(filteredCommands[0]);
                                    if (e.key === 'Escape') setShowPalette(false);
                                }}
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {filteredCommands.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => handlePaletteSelect(item)}
                                    className={`w-full text-left flex items-center justify-between px-3 py-2 transition-colors ${idx === 0 ? 'bg-aussie-500/10' : 'hover:bg-white/5'}`}
                                >
                                    <div>
                                        <span className="text-xs text-white font-medium">{item.label}</span>
                                        <span className="text-[10px] text-gray-600 ml-2">{item.desc}</span>
                                    </div>
                                    <code className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{item.cmd}</code>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Output */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar" ref={scrollRef} onScroll={handleScroll}>
                {blocks.length === 0 && (
                    <div className="text-gray-600 text-[10px]">Type 'help' or press ⌘⇧P for commands</div>
                )}

                {blocks.map((block) => (
                    <div key={block.id} className="animate-in fade-in duration-150">
                        {block.type === 'command' && (
                            <div className="flex items-start gap-2">
                                <span className="text-aussie-500 font-bold">$</span>
                                <code className="text-gray-200">{block.content}</code>
                            </div>
                        )}
                        {block.type === 'tool-call' && (
                            <div className="flex items-center gap-2 text-blue-400 pl-3 border-l border-blue-500/30">
                                <PlayCircle className="w-3 h-3" />
                                <span className="text-[10px]">{block.content}</span>
                            </div>
                        )}
                        {block.type === 'ai-thought' && (
                            <div className="pl-3 border-l border-purple-500/30 text-purple-400/70 text-[10px] italic">
                                <ReactMarkdown>{block.content}</ReactMarkdown>
                            </div>
                        )}
                        {block.type === 'output' && (
                            <div className="text-gray-400 whitespace-pre-wrap pl-3 border-l border-white/10">{block.content}</div>
                        )}
                        {block.type === 'error' && (
                            <div className="text-red-400 pl-3 border-l border-red-500/40 flex items-start gap-1.5">
                                <span className="text-red-500">!</span>
                                <span>{block.content}</span>
                            </div>
                        )}
                    </div>
                ))}

                {/* Input Line */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
                    <span className="text-aussie-500 font-bold">$</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600 caret-aussie-500"
                        autoFocus
                        spellCheck={false}
                        placeholder="Command..."
                    />
                </div>
            </div>

            {/* Mobile Controls */}
            {isMobile && (
                <div className="h-10 bg-[#0a0e14] border-t border-white/[0.06] flex items-center justify-around px-2 shrink-0">
                    <button onClick={() => setInput(prev => prev + '/')} className="w-8 h-7 rounded bg-white/5 text-gray-400 text-xs">/</button>
                    <button onClick={() => setInput(prev => prev + '-')} className="w-8 h-7 rounded bg-white/5 text-gray-400 text-xs">-</button>
                    <button onClick={() => navigateHistory(-1)} className="w-8 h-7 rounded bg-white/5 text-gray-400"><ArrowUp className="w-3.5 h-3.5 mx-auto" /></button>
                    <button onClick={() => navigateHistory(1)} className="w-8 h-7 rounded bg-white/5 text-gray-400"><ArrowDown className="w-3.5 h-3.5 mx-auto" /></button>
                    <button onClick={() => setInput('')} className="w-8 h-7 rounded bg-red-500/15 text-red-400"><X className="w-3.5 h-3.5 mx-auto" /></button>
                </div>
            )}
        </div>
    );
};
