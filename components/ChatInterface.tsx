
import React, { useEffect, useRef, useState, memo, useTransition, useOptimistic, useMemo } from 'react';
import { Message } from '../types';
import { Bot, Sparkles, ArrowRight, Zap, History, Save, ChevronDown, Copy, Check, ArrowDown, RefreshCw, Trash2, MessageSquare, UploadCloud, DownloadCloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { julesAgent } from '../services/jules';
import { fs } from '../services/fileSystem';

interface ChatInterfaceProps {
    messages: Message[];
    onQuickAction?: (text: string) => void;
    isProcessing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = memo(({ messages, onQuickAction, isProcessing }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showSessions, setShowSessions] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Grouped messages for better visual organization
    const groupedMessages = useMemo(() => {
        const groups: { role: string; messages: Message[]; timestamp: number }[] = [];
        let currentGroup: Message[] = [];
        let currentRole: string | null = null;

        messages.forEach(msg => {
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
    }, [messages]);

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
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const filename = `/workspace/system/chat_session_${timestamp}.json`;
        fs.writeFile(filename, JSON.stringify(messages, null, 2));
        alert(`Session saved to ${filename}`);
    };

    const loadSession = () => {
        const filename = prompt("Enter session filename to load:", "/workspace/system/chat_session_...");
        if (filename && fs.exists(filename)) {
            const content = fs.readFile(filename);
            const loadedMessages = JSON.parse(content);
            julesAgent.clearHistory();
            loadedMessages.forEach((msg: Message) => julesAgent.getMessages().push(msg));
            julesAgent.initAI();
        } else if (filename) {
            alert("File not found.");
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 px-3 sm:px-4 lg:px-6 w-full">
            <div className="relative flex-1 flex flex-col min-h-0 h-full bg-gradient-to-br from-[#0a0e14] via-[#0d1117] to-[#0a0e14] rounded-2xl overflow-hidden border border-white/5 shadow-2xl max-w-6xl w-full mx-auto">
                {/* Header with Session Management */}
                <div className="h-14 border-b border-white/10 bg-[#0d1117]/95 backdrop-blur-xl flex items-center justify-between px-4 md:px-5 shrink-0 z-20 select-none shadow-lg">
                    <div className="flex items-center gap-2">
                        <button onClick={saveSession} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"><Save className="w-4 h-4" /></button>
                        <button onClick={loadSession} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"><History className="w-4 h-4" /></button>
                        <button onClick={() => julesAgent.clearHistory()} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    {/* Model Badge */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-aussie-500/15 to-emerald-500/10 px-3 py-1.5 rounded-xl border border-aussie-500/30 shadow-lg shadow-aussie-500/10">
                        <Sparkles className="w-3.5 h-3.5 text-aussie-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-aussie-300">
                            <span className="hidden sm:inline">Gemini 2.5 Pro</span>
                            <span className="sm:hidden">Gemini</span>
                        </span>
                        {isProcessing && (
                            <span className="w-2 h-2 rounded-full bg-aussie-400 animate-pulse shadow-glow" />
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
