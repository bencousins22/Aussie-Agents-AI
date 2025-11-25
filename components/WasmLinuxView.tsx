import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
    Server, Play, Square, RefreshCcw, Terminal, ShieldCheck, Lock, Wifi, HardDrive, Cpu, Activity,
    Folder, FileText, ChevronsRight, Clock, Bug, Sparkles, Send, Wand2
} from 'lucide-react';
import { FileStat, ShellResult } from '../types';
import { wasmRuntime, WasmRuntimeState } from '../services/wasmLinux';
import { shell } from '../services/shell';
import { scheduler } from '../services/scheduler';
import { notify } from '../services/notification';

interface Props {
    onRunCommand?: (cmd: string) => Promise<ShellResult | void>;
}

const formatUptime = (startedAt: number | null) => {
    if (!startedAt) return '—';
    const diff = Date.now() - startedAt;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
};

export const WasmLinuxView: React.FC<Props> = ({ onRunCommand }) => {
    const [state, setState] = useState<WasmRuntimeState>(wasmRuntime.getState());
    const [command, setCommand] = useState('gemini-flow jules --quantum');
    const [fsPath, setFsPath] = useState('/workspace');
    const [fsItems, setFsItems] = useState<FileStat[]>([]);
    const [runningCmd, setRunningCmd] = useState(false);

    useEffect(() => {
        const unsub = wasmRuntime.subscribe(setState);
        wasmRuntime.start();
        return () => { unsub(); };
    }, []);

    const refreshFs = useCallback((path: string) => {
        setFsItems(wasmRuntime.getFsSnapshot(path));
    }, []);

    useEffect(() => {
        refreshFs(fsPath);
    }, [fsPath, refreshFs]);

    const quickCommands = useMemo(() => ([
        { label: 'uname -a', cmd: 'uname -a' },
        { label: 'List workspace', cmd: 'ls /workspace' },
        { label: 'Show agents', cmd: 'ps aux | head -n 5' },
        { label: 'Run swarm', cmd: 'gemini-flow hive-mind --objective "secure build"' },
        { label: 'Restart orchestrator', cmd: 'gemini-flow init' },
    ]), []);

    const automationSets = useMemo(() => ([
        { name: 'Health Check', commands: ['uname -a', 'gemini-flow hive-mind --objective "status"'] },
        { name: 'System Refresh', commands: ['ls /workspace', 'gemini-flow run-flow core-init'] },
    ]), []);

    const [history, setHistory] = useState<{command: string; output: string; status: 'ok' | 'error'; timestamp: number}[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('wasmCommandHistory') || '[]');
        } catch {
            return [];
        }
    });

    const handleCommand = useCallback(async (cmdText: string) => {
        if (!cmdText.trim()) return;
        setRunningCmd(true);
        try {
            const executor = onRunCommand
                ? onRunCommand
                : async (cmd: string) => shell.execute(cmd);
            await wasmRuntime.runCommand(cmdText, executor);
            const entry = {
                command: cmdText,
                output: wasmRuntime.getState().lastOutput || '',
                status: 'ok' as const,
                timestamp: Date.now()
            };
            setHistory(prev => {
                const next = [...prev, entry].slice(-25);
                localStorage.setItem('wasmCommandHistory', JSON.stringify(next));
                return next;
            });
        } finally {
            setRunningCmd(false);
            refreshFs(fsPath);
        }
    }, [fsPath, onRunCommand, refreshFs]);

    const rerunHistory = (cmd: string) => {
        setCommand(cmd);
        handleCommand(cmd);
    };

    const scheduleHistoryCommand = (cmd: string) => {
        const task = scheduler.addTask({
            name: `Scheduled terminal: ${cmd.split(' ')[0]}`,
            type: 'command',
            action: cmd,
            schedule: 'once',
            nextRun: Date.now()
        });
        notify.info('Scheduler', `Command scheduled: ${task.name}`);
    };

    const runAutomation = async (commands: string[]) => {
        for (const cmd of commands) {
            await handleCommand(cmd);
            await new Promise(r => setTimeout(r, 400));
        }
    };

    const toggleNetwork = () => {
        wasmRuntime.updatePermissions({ network: state.permissions.network === 'allow' ? 'deny' : 'allow' });
    };

    const toggleShell = () => {
        wasmRuntime.updatePermissions({ shell: state.permissions.shell === 'allow' ? 'deny' : 'allow' });
    };

    const toggleSandbox = () => {
        wasmRuntime.updatePermissions({ sandboxed: !state.permissions.sandboxed });
    };

    const statusColor = {
        ready: 'text-aussie-500',
        booting: 'text-amber-400',
        offline: 'text-gray-500',
        error: 'text-red-400'
    }[state.status];

    return (
        <div className="h-full w-full overflow-auto bg-os-bg px-4 sm:px-6 lg:px-10 py-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-aussie-500/10 border border-aussie-500/30 text-aussie-500 shadow-glow">
                    <Server className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-gray-500 font-bold">WASM LINUX</div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        Runtime Control Plane
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${statusColor}`}>
                            {state.status.toUpperCase()}
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm">Run Aussie agents locally inside the sandboxed wasm linux surface.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-os-panel/80 border border-os-border rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-aussie-500" />
                            Runtime
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatUptime(state.startedAt)}
                        </div>
                    </div>
                    <div className="text-xl font-bold text-white">{state.version}</div>
                    <div className="text-sm text-gray-400 leading-relaxed">
                        Local kernel shim exposes POSIX, networking guardrails, and Gemini agents to the terminal.
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-aussie-500 font-semibold">Isolation: {state.permissions.sandboxed ? 'Sandboxed' : 'Elevated'}</span>
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-emerald-400 font-semibold">Shell: {state.permissions.shell}</span>
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-blue-400 font-semibold">Network: {state.permissions.network}</span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                        <button 
                            onClick={() => wasmRuntime.start()}
                            className="flex-1 px-3 py-2 rounded-xl bg-aussie-500 text-black font-bold shadow-glow hover:bg-aussie-400 transition-all active:scale-95 disabled:opacity-50"
                            disabled={state.status === 'ready' || state.status === 'booting'}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Play className="w-4 h-4" /> Start
                            </div>
                        </button>
                        <button 
                            onClick={() => wasmRuntime.stop()}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-red-400/50 hover:bg-red-400/10 transition-all active:scale-95"
                            disabled={state.status === 'offline'}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Square className="w-4 h-4" /> Stop
                            </div>
                        </button>
                        <button 
                            onClick={() => wasmRuntime.restart()}
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-aussie-500/40 hover:bg-aussie-500/10 transition-all active:scale-95"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCcw className="w-4 h-4" /> Restart
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-os-panel/80 border border-os-border rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Terminal className="w-4 h-4 text-aussie-500" />
                        Command Runner
                    </div>
                    <div className="text-sm text-gray-400">
                        Commands execute against the wasm linux shim and mirror into the agent terminal.
                    </div>
                    <div className="flex items-center gap-2 bg-[#0d1117] border border-os-border rounded-xl px-3 py-2 shadow-inner">
                        <Terminal className="w-4 h-4 text-aussie-500" />
                        <input
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !runningCmd) handleCommand(command); }}
                            className="flex-1 bg-transparent outline-none text-white text-sm"
                            placeholder={'gemini-flow jules --objective "ship build"'}
                        />
                        <button
                            onClick={() => handleCommand(command)}
                            disabled={runningCmd}
                            className="px-3 py-1.5 rounded-lg bg-aussie-500 text-black font-semibold hover:bg-aussie-400 transition-all active:scale-95 disabled:opacity-60"
                        >
                            <div className="flex items-center gap-2 text-sm">
                                <Send className="w-4 h-4" />
                                Run
                            </div>
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickCommands.map(q => (
                            <button
                                key={q.cmd}
                                onClick={() => { setCommand(q.cmd); handleCommand(q.cmd); }}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-aussie-500/40 hover:text-white transition-colors active:scale-95"
                            >
                                {q.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2 pt-3">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <Activity className="w-4 h-4 text-aussie-500" />
                            Command History
                        </div>
                        <div className="max-h-32 overflow-y-auto border border-white/5 rounded-lg bg-[#0c0f14] p-2 space-y-2">
                            {history.length === 0 && <div className="text-[11px] text-gray-500">No commands yet.</div>}
                            {history.slice().reverse().map(entry => (
                                <div key={entry.timestamp} className="rounded-lg border border-white/5 bg-white/5 p-2 text-[11px] flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono truncate">{entry.command}</span>
                                        <span className={`text-[10px] ${entry.status === 'ok' ? 'text-emerald-300' : 'text-red-400'}`}>{entry.status}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-400">
                                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => rerunHistory(entry.command)} className="text-[10px] text-gray-300 hover:text-white">Run</button>
                                            <button onClick={() => scheduleHistoryCommand(entry.command)} className="text-[10px] text-aussie-400 hover:text-white">Schedule</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {automationSets.map(set => (
                                <button
                                    key={set.name}
                                    onClick={() => runAutomation(set.commands)}
                                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-emerald-400 hover:text-white transition-colors"
                                >
                                    {set.name}
                                </button>
                            ))}
                        </div>
                        <div className="text-[11px] text-gray-500">Automation sequences run each command sequentially and log the output.</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        {state.lastCommand ? <>Last: <code className="bg-black/40 px-2 py-1 rounded">{state.lastCommand}</code></> : 'Awaiting first command'}
                    </div>
                </div>

                <div className="bg-os-panel/80 border border-os-border rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                        <ShieldCheck className="w-4 h-4 text-aussie-500" />
                        Guardrails
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <HardDrive className="w-4 h-4" />
                                File System
                            </div>
                            <div className="font-semibold text-white">{state.permissions.fs.toUpperCase()}</div>
                            <button
                                onClick={() => wasmRuntime.updatePermissions({ fs: state.permissions.fs === 'read' ? 'readwrite' : 'read' })}
                                className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 transition-all"
                            >
                                Toggle
                            </button>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <Terminal className="w-4 h-4" />
                                Shell
                            </div>
                            <div className="font-semibold text-white">{state.permissions.shell === 'allow' ? 'Enabled' : 'Blocked'}</div>
                            <button
                                onClick={toggleShell}
                                className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 transition-all"
                            >
                                Toggle
                            </button>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                                <Wifi className="w-4 h-4" />
                                Network
                            </div>
                            <div className="font-semibold text-white">{state.permissions.network === 'allow' ? 'Online' : 'Air-gapped'}</div>
                            <button
                                onClick={toggleNetwork}
                                className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 transition-all"
                            >
                                Toggle
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lock className="w-4 h-4 text-amber-400" />
                        Sandbox: {state.permissions.sandboxed ? 'Enabled' : 'Disabled'}
                        <button
                            onClick={toggleSandbox}
                            className="ml-auto px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 transition-all text-gray-300 text-[11px]"
                        >
                            Flip
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-os-panel/80 border border-os-border rounded-2xl p-4 shadow-lg space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Folder className="w-4 h-4 text-aussie-500" />
                        Filesystem
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            value={fsPath}
                            onChange={e => setFsPath(e.target.value || '/')}
                            className="flex-1 bg-black/30 border border-os-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-aussie-500/40"
                            placeholder="/workspace"
                        />
                        <button
                            onClick={() => refreshFs(fsPath)}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:border-aussie-500/40 hover:text-white transition-all active:scale-95"
                        >
                            Refresh
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[260px] overflow-auto custom-scrollbar">
                        {fsItems.map(item => (
                            <div key={item.path} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-aussie-500/40 transition-colors">
                                <div className="flex items-center gap-2 text-gray-200 font-semibold">
                                    {item.type === 'directory' ? <Folder className="w-4 h-4 text-aussie-500" /> : <FileText className="w-4 h-4 text-blue-400" />}
                                    <span className="truncate">{item.name}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 truncate mt-1">{item.path}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => setFsPath(item.type === 'directory' ? item.path : fsPath)}
                                        className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300 hover:border-aussie-500/40 transition-all"
                                    >
                                        {item.type === 'directory' ? 'Open' : 'Reveal'}
                                    </button>
                                    {item.type === 'file' && (
                                        <button
                                            onClick={() => handleCommand(`cat ${item.path}`)}
                                            className="text-[10px] px-2 py-1 rounded bg-aussie-500/20 border border-aussie-500/30 text-aussie-500 hover:bg-aussie-500/30 transition-all"
                                        >
                                            Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {fsItems.length === 0 && (
                            <div className="text-gray-500 text-sm">No files in {fsPath}</div>
                        )}
                    </div>
                </div>

                <div className="bg-os-panel/80 border border-os-border rounded-2xl p-4 shadow-lg space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Activity className="w-4 h-4 text-aussie-500" />
                        Processes
                    </div>
                    <div className="space-y-2 max-h-[260px] overflow-auto custom-scrollbar">
                        {state.processes.map(proc => (
                            <div key={proc.pid} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-aussie-500/10 border border-aussie-500/20 flex items-center justify-center text-aussie-500 font-bold">
                                    {proc.pid}
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-semibold">{proc.name}</div>
                                    <div className="text-[11px] text-gray-500 uppercase tracking-wide">CPU {proc.cpu}% • MEM {proc.mem}mb</div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] border ${proc.state === 'running' ? 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10' : 'border-amber-400/40 text-amber-300 bg-amber-400/10'}`}>
                                    {proc.state}
                                </div>
                            </div>
                        ))}
                        {state.processes.length === 0 && (
                            <div className="text-gray-500 text-sm">Runtime is idle</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-os-panel/80 border border-os-border rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        <ChevronsRight className="w-4 h-4 text-aussie-500" />
                        Runtime Logs
                    </div>
                    <div className="bg-black/40 border border-os-border rounded-xl p-3 h-[220px] overflow-auto custom-scrollbar text-xs text-gray-300 font-mono space-y-1">
                        {state.logs.map((log, idx) => (
                            <div key={idx} className="whitespace-pre-wrap">{log}</div>
                        ))}
                        {state.logs.length === 0 && (
                            <div className="text-gray-600">Logs will appear after the runtime boots.</div>
                        )}
                    </div>
                </div>

                <div className="bg-os-panel/80 border border-os-border rounded-2xl p-4 shadow-lg space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Bug className="w-4 h-4 text-amber-400" />
                        Agent Ready Check
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
                        <div className="flex items-center gap-2 text-white font-semibold mb-1">
                            <Wand2 className="w-4 h-4 text-aussie-500" />
                            Gemini tools attached
                        </div>
                        <div className="text-[12px] text-gray-500">Local shell + wasm linux satisfy offline agent operations.</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
                        <div className="flex items-center gap-2 text-white font-semibold mb-1">
                            <Cpu className="w-4 h-4 text-blue-400" />
                            Kernel uptime
                        </div>
                        <div className="text-[12px] text-gray-500">Running for {formatUptime(state.startedAt)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
                        <div className="flex items-center gap-2 text-white font-semibold mb-1">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            Enterprise guardrails
                        </div>
                        <div className="text-[12px] text-gray-500">Sandbox + network controls enforced for terminal agents.</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
