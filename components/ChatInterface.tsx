
import React, { useEffect, useRef, useState, memo, useTransition, useOptimistic, useMemo } from 'react';
import { Message, ChatSession } from '../types';
import { Bot, Sparkles, ArrowRight, Zap, History, Save, ChevronDown, Copy, Check, ArrowDown, RefreshCw, Trash2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
    messages: Message[];
    onQuickAction?: (text: string) => void;
    isProcessing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = memo(({ messages, onQuickAction, isProcessing }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sessions, setSessions] = useState<ChatSession[]>(() => {
        try {
            const saved = localStorage.getItem('aussie_chat_sessions');
            return saved ? JSON.parse(saved) : [{ id: 'default', title: 'Current Session', messages: [], lastModified: Date.now() }];
        } catch {
            return [{ id: 'default', title: 'Current Session', messages: [], lastModified: Date.now() }];
        }
    });
    const [currentSessionId, setCurrentSessionId] = useState('default');
    const [showSessions, setShowSessions] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Optimistic message rendering
    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        messages,
        (state: Message[], newMessage: Message) => [...state, newMessage]
    ) as [Message[], (msg: Message) => void];

    // Persist sessions to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('aussie_chat_sessions', JSON.stringify(sessions));
        } catch {}
    }, [sessions]);

    // Grouped messages for better visual organization
    const groupedMessages = useMemo(() => {
        const groups: { role: string; messages: Message[]; timestamp: number }[] = [];
        let currentGroup: Message[] = [];
        let currentRole: string | null = null;

        optimisticMessages.forEach(msg => {
            if (msg.role !== currentRole) {
                if (currentGroup.length > 0) {
                    groups.push({
                        role: currentRole!,
                        messages: currentGroup,
                        timestamp: currentGroup[0].timestamp
                    });
                }
                currentGroup = [msg];
                currentRole = msg.role;
            } else {
                currentGroup.push(msg);
            }
        });

        if (currentGroup.length > 0) {
            groups.push({
                role: currentRole!,
                messages: currentGroup,
                timestamp: currentGroup[0].timestamp
            });
        }

        return groups;
    }, [optimisticMessages]);

    // Smart Scroll Logic
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        const lastMsg = messages[messages.length - 1];
        const isUser = lastMsg?.role === 'user';

        if (isNearBottom || isUser) {
            scrollToBottom();
        }
    }, [messages, isProcessing]);

    const handleScroll = () => {
        const container = scrollRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        setShowScrollButton(!isNearBottom);
    };

    const saveSession = () => {
        startTransition(() => {
            const newId = Math.random().toString(36).substr(2, 9);
            const title = `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            setSessions(prev => [...prev, { id: newId, title, messages: [...messages], lastModified: Date.now() }]);
            setCurrentSessionId(newId);
            setShowSessions(false);
        });
    };

    const deleteSession = (sessionId: string) => {
        if (sessionId === 'default') return;
        startTransition(() => {
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (sessionId === currentSessionId) {
                setCurrentSessionId('default');
            }
        });
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);

    return (
        <div className="flex-1 flex flex-col min-h-0 px-2 sm:px-3 w-full">
            <div className="relative flex-1 flex flex-col min-h-0 h-full bg-gradient-to-br from-[#0a0e14] via-[#0d1117] to-[#0a0e14] rounded-xl overflow-hidden border border-white/5 shadow-xl w-full mx-auto">
                {/* Session Header - Compact */}
                <div className="h-10 border-b border-white/10 bg-[#0d1117]/95 backdrop-blur-xl flex items-center justify-between px-3 shrink-0 z-20 select-none">
                    <div className="relative flex items-center gap-2">
                        {/* Session Selector */}
                        <button
                            onClick={() => setShowSessions(!showSessions)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300 hover:text-white transition-all py-1 px-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 group"
                        >
                            <History className="w-3.5 h-3.5 text-aussie-400 group-hover:text-aussie-300" />
                            <span className="max-w-[120px] truncate">
                                {currentSession?.title || 'Session'}
                            </span>
                            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-150 ${showSessions ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Session Dropdown */}
                        {showSessions && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-aussie-400" />
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">Chat History</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{sessions.length} sessions</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                    {sessions.map(s => (
                                        <div
                                            key={s.id}
                                            className={`group flex items-center justify-between px-4 py-3 hover:bg-white/5 border-l-2 transition-all ${
                                                s.id === currentSessionId
                                                    ? 'text-aussie-300 border-aussie-500 bg-aussie-500/5'
                                                    : 'text-gray-400 border-transparent'
                                            }`}
                                        >
                                            <button
                                                onClick={() => { setCurrentSessionId(s.id); setShowSessions(false); }}
                                                className="flex-1 text-left"
                                            >
                                                <div className="text-sm font-semibold truncate">{s.title}</div>
                                                <div className="text-[10px] text-gray-600 mt-0.5">
                                                    {new Date(s.lastModified).toLocaleDateString()} • {s.messages.length} messages
                                                </div>
                                            </button>
                                            {s.id !== 'default' && (
                                                <button
                                                    onClick={() => deleteSession(s.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete session"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/5 p-2 bg-[#0d1117]">
                                    <button
                                        onClick={saveSession}
                                        disabled={isPending}
                                        className="w-full flex items-center justify-center gap-2 text-xs text-aussie-400 hover:bg-aussie-500/10 p-2.5 rounded-xl transition-all font-bold border border-aussie-500/20 hover:border-aussie-500/40 disabled:opacity-50"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {isPending ? 'Saving...' : 'Save Current Chat'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Model Badge */}
                    <div className="flex items-center gap-1.5 bg-aussie-500/10 px-2 py-1 rounded-lg border border-aussie-500/20">
                        <Sparkles className="w-3 h-3 text-aussie-400" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-aussie-300">Gemini</span>
                        {isProcessing && (
                            <span className="w-1.5 h-1.5 rounded-full bg-aussie-400 animate-pulse shadow-glow" />
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 pb-12 md:pb-16 space-y-6 custom-scrollbar bg-gradient-to-b from-[#0a0e14] via-[#0d1117] to-[#0a0e14] scroll-smooth max-w-5xl w-full mx-auto"
                    aria-live="polite"
                >
                    {messages.length === 0 ? (
                        <EmptyState onQuickAction={onQuickAction} />
                    ) : (
                        <>
                            {groupedMessages.map((group, groupIndex) => (
                                <MessageGroup
                                    key={`${group.role}-${groupIndex}`}
                                    group={group}
                                    onCopy={copyToClipboard}
                                    copiedId={copiedId}
                                />
                            ))}

                            {isProcessing && (
                                <div className="flex flex-col items-start gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center gap-2.5 px-1">
                                        <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-aussie-500 to-emerald-500 flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-aussie-500/30">
                                            A
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jules</span>
                                    </div>
                                    <div className="bg-gradient-to-br from-[#1f2937] to-[#1a2332] border border-white/10 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-xl flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-aussie-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-aussie-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-aussie-400 rounded-full animate-bounce"></div>
                                        </div>
                                        <span className="text-sm text-gray-400 font-medium animate-pulse">Thinking...</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} className="h-6" />
                </div>

                {/* Scroll to bottom button */}
                {showScrollButton && (
                    <button
                        onClick={() => scrollToBottom()}
                        className="absolute bottom-6 right-6 p-3 bg-gradient-to-r from-aussie-500 to-emerald-400 text-black rounded-full shadow-xl shadow-aussie-500/40 hover:shadow-2xl hover:shadow-aussie-500/50 hover:scale-110 transition-all z-30 animate-in fade-in zoom-in duration-200 active:scale-95"
                        title="Scroll to bottom"
                    >
                        <ArrowDown className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </div>
    );
});

// Message Group Component
const MessageGroup = memo<{
    group: { role: string; messages: Message[]; timestamp: number };
    onCopy: (text: string, id: string) => void;
    copiedId: string | null;
}>(({ group, onCopy, copiedId }) => {
    const isUser = group.role === 'user';
    const firstMessage = group.messages[0];

    return (
        <div className={`flex flex-col gap-3 ${isUser ? 'items-end' : 'items-start'} w-full animate-in fade-in slide-in-from-bottom-4 duration-300 group/group`}>
            {/* Avatar & Name */}
            <div className={`flex items-center gap-2.5 ${isUser ? 'flex-row-reverse' : ''} px-1`}>
                {isUser ? (
                    <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        U
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-aussie-500 to-emerald-500 flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-aussie-500/30">
                        A
                    </div>
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {isUser ? 'You' : (firstMessage.sender || 'Jules')}
                </span>
                <span className="text-[10px] text-gray-600 opacity-0 group-hover/group:opacity-100 transition-opacity">
                    {new Date(firstMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Messages in group */}
            <div className={`flex flex-col gap-2 w-full ${isUser ? 'items-end' : 'items-start'}`}>
                {group.messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                        isUser={isUser}
                        onCopy={onCopy}
                        copiedId={copiedId}
                    />
                ))}
            </div>
        </div>
    );
});

// Message Bubble Component
const MessageBubble = memo<{
    message: Message;
    isUser: boolean;
    onCopy: (text: string, id: string) => void;
    copiedId: string | null;
}>(({ message, isUser, onCopy, copiedId }) => (
    <div className="relative group/message w-full sm:w-auto max-w-[760px]">
        <div
            className={`
                rounded-2xl px-5 py-4 text-sm leading-relaxed border transition-all
                ${isUser
                    ? 'bg-gradient-to-br from-aussie-500 to-emerald-500 text-black border-aussie-400/50 rounded-tr-md font-medium shadow-xl shadow-aussie-500/30 hover:shadow-2xl hover:shadow-aussie-500/40'
                    : 'bg-gradient-to-br from-[#1f2937] to-[#1a2332] backdrop-blur border-white/15 text-gray-100 rounded-tl-md shadow-lg hover:shadow-xl hover:border-white/25'}
            `}
        >
            <div
                className={`prose max-w-none prose-p:my-1.5 prose-pre:my-3 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10 text-[14px] md:text-[15px] ${
                    isUser
                        ? 'prose-p:text-black/90 prose-strong:text-black prose-a:text-black/80 prose-code:text-black/80 prose-code:bg-black/15 prose-code:rounded-md prose-code:px-2 prose-code:py-1'
                        : 'prose-invert prose-pre:bg-[#0a0c10] prose-code:text-aussie-300 prose-code:bg-aussie-500/15 prose-code:rounded-md prose-code:px-2 prose-code:py-1 prose-a:text-aussie-400 hover:prose-a:text-aussie-300 prose-strong:text-white'
                }`}
            >
                <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
        </div>

        {/* Action Buttons */}
        {!isUser && (
            <div className="absolute -bottom-10 left-0 flex gap-2 opacity-0 group-hover/message:opacity-100 transition-all">
                <button
                    onClick={() => onCopy(message.text, message.id)}
                    className="p-2 text-gray-500 hover:text-aussie-400 rounded-lg hover:bg-white/10 transition-all active:scale-95 border border-transparent hover:border-white/10"
                    title="Copy message"
                >
                    {copiedId === message.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
                <button
                    onClick={() => {}}
                    className="p-2 text-gray-500 hover:text-aussie-400 rounded-lg hover:bg-white/10 transition-all active:scale-95 border border-transparent hover:border-white/10"
                    title="Regenerate response"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
        )}
    </div>
));

// Empty State Component
const EmptyState = memo<{ onQuickAction?: (text: string) => void }>(({ onQuickAction }) => (
    <div className="flex flex-col items-center justify-center h-full text-center pb-10 px-4 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="relative mb-8 group cursor-default">
            <div className="absolute inset-0 bg-gradient-to-r from-aussie-500/30 to-emerald-400/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative w-28 h-28 bg-gradient-to-br from-aussie-500/20 to-aussie-500/10 rounded-3xl border border-aussie-500/30 flex items-center justify-center shadow-2xl shadow-aussie-500/20 ring-1 ring-white/5 group-hover:scale-105 transition-transform duration-500">
                <Bot className="w-14 h-14 text-aussie-400 drop-shadow-lg" strokeWidth={1.5} />
            </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight bg-gradient-to-r from-white via-aussie-100 to-white bg-clip-text">
            Aussie Agent
        </h2>
        <p className="text-sm md:text-base text-gray-500 mb-10 max-w-md leading-relaxed">
            Enterprise-grade AI for system control, development automation, and intelligent analysis
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
            <QuickAction
                onClick={() => onQuickAction?.("Create a new NBA Bot app")}
                label="Build NBA Bot"
                icon={Zap}
                color="from-yellow-500/20 to-orange-400/10"
            />
            <QuickAction
                onClick={() => onQuickAction?.("Generate a futuristic city video")}
                label="Generate Video"
                icon={Sparkles}
                color="from-aussie-500/20 to-emerald-400/10"
            />
            <QuickAction
                onClick={() => onQuickAction?.("Explain the project structure")}
                label="Analyze Code"
                icon={Bot}
                color="from-blue-500/20 to-cyan-400/10"
            />
        </div>
    </div>
));

// Quick Action Component
const QuickAction = memo<{
    label: string;
    onClick: () => void;
    icon: any;
    color: string;
}>(({ label, onClick, icon: Icon, color }) => (
    <button
        onClick={onClick}
        className={`w-full p-5 flex items-center justify-between group bg-gradient-to-br ${color} hover:scale-[1.02] border border-white/10 hover:border-aussie-500/30 rounded-2xl transition-all active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-aussie-500/10 backdrop-blur`}
    >
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 text-aussie-400 border border-aussie-500/20 group-hover:border-aussie-500/40 shadow-sm transition-all group-hover:scale-110">
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-base text-gray-200 font-bold group-hover:text-white transition-colors text-left">
                {label}
            </span>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-aussie-400 group-hover:translate-x-2 transition-all shrink-0" />
    </button>
));
