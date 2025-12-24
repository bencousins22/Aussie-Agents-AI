import React, { useEffect, useState } from 'react';
import { Rocket, LayoutDashboard, Code2, Globe, Zap, X, Play, Repeat, CalendarClock, Layers } from 'lucide-react';
import { MainView } from '../types';
import { agentDaemon } from '../services/agentDaemon';
import { julesRest } from '../services/julesRest';
import { scheduler } from '../services/scheduler';
import { notify } from '../services/notification';

interface Props {
    onNavigate: (view: MainView) => void;
    onSendMessage: (text: string) => void;
    onClose: () => void;
}

export const AgentOpsPanel: React.FC<Props> = ({ onNavigate, onSendMessage, onClose }) => {
    const [mission, setMission] = useState('Keep the workspace clean, run tests, and report status.');
    const [command, setCommand] = useState('');
    const [sources, setSources] = useState<string[]>([]);
    const [selectedSource, setSelectedSource] = useState('');
    const [promptText, setPromptText] = useState('Create a security audit report for /workspace.');
    const [autoApprove, setAutoApprove] = useState(true);
    const [schedule, setSchedule] = useState<'once' | 'hourly' | 'daily' | 'interval'>('once');
    const [intervalSeconds, setIntervalSeconds] = useState(3600);
    const [flowId, setFlowId] = useState('');
    const [flowRoles, setFlowRoles] = useState<string[]>([]);
    const [flowSchedule, setFlowSchedule] = useState<'once' | 'hourly' | 'daily' | 'interval'>('once');
    const [flowIntervalSeconds, setFlowIntervalSeconds] = useState(3600);
    const [flowMessage, setFlowMessage] = useState<string | null>(null);
    const [builderMessage, setBuilderMessage] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;
        const load = async () => {
            try {
                const body = await julesRest.listSources();
                if (!canceled) {
                    const items = body.sources?.map((s: any) => s.name).filter(Boolean) || [];
                    setSources(items);
                    if (!selectedSource && items.length) setSelectedSource(items[0]);
                }
            } catch (e: any) {
                notify.error('Jules', 'Unable to list sources. Check API settings.');
            }
        };
        load();
        return () => { canceled = true; };
    }, [selectedSource]);

    const scheduleJulesSession = async () => {
        if (!selectedSource) {
            notify.error('Agent Builder', 'Select a source first.');
            return;
        }
        const payload = {
            prompt: promptText,
            sourceContext: {
                source: selectedSource,
                githubRepoContext: {
                    startingBranch: 'main'
                }
            },
            automationMode: 'AUTO_CREATE_PR',
            title: `Builder run ${new Date().toISOString()}`,
            autoApprove: autoApprove
        };
        const nextRun = calculateNextRun(schedule, intervalSeconds);
        const task = scheduler.addTask({
            name: `Jules: ${promptText.slice(0, 20)}`,
            type: 'jules',
            action: JSON.stringify(payload),
            schedule,
            intervalSeconds: schedule === 'interval' ? intervalSeconds : undefined,
            nextRun
        });
        setBuilderMessage(`Scheduled task ${task.name} for ${new Date(nextRun).toLocaleString()}`);
    };


    const toggleFlowRole = (role: string) => {
        setFlowRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };

    const scheduleFlowTask = () => {
        if (!flowId.trim()) {
            notify.error('Agent Builder', 'Provide a flow ID before scheduling.');
            return;
        }
        const payload = {
            flowId: flowId.trim(),
            roles: flowRoles,
        };
        const nextRun = calculateNextRun(flowSchedule, flowIntervalSeconds);
        const task = scheduler.addTask({
            name: `Flow: ${flowId}`,
            type: 'flow',
            action: JSON.stringify(payload),
            schedule: flowSchedule,
            intervalSeconds: flowSchedule === 'interval' ? flowIntervalSeconds : undefined,
            nextRun
        });
        setFlowMessage(`Scheduled ${task.name} at ${new Date(nextRun).toLocaleString()}`);
    };

    const calculateNextRun = (sched: string, secs: number) => {
        const now = Date.now();
        if (sched === 'once') return now + 1000;
        if (sched === 'hourly') return now + 60 * 60 * 1000;
        if (sched === 'daily') return now + 24 * 60 * 60 * 1000;
        return now + (secs * 1000);
    };

    const launchMission = () => {
        if (!mission.trim()) return;
        agentDaemon.start(mission);
        onSendMessage(`New mission: ${mission}`);
    };

    const sendDirective = () => {
        if (!command.trim()) return;
        onSendMessage(command);
        setCommand('');
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-[#0b1018]/95 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-aussie-500/15 border border-aussie-500/30 flex items-center justify-center text-aussie-300">
                        <Rocket className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Agent Control</div>
                        <div className="text-xs text-white font-semibold">Realtime OS</div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                {/* Mission Section */}
                <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Mission</div>
                    <textarea
                        value={mission}
                        onChange={e => setMission(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-600 resize-none focus:border-aussie-500/40 focus:ring-1 focus:ring-aussie-500/20 transition-all"
                        rows={2}
                    />
                    <button onClick={launchMission} className="w-full py-1.5 rounded-lg bg-aussie-500 text-black font-bold text-xs hover:bg-aussie-400 transition-colors">
                        Start Mission
                    </button>
                </div>

                {/* Directive Section */}
                <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Directive</div>
                    <div className="flex gap-1.5">
                        <input
                            value={command}
                            onChange={e => setCommand(e.target.value)}
                            placeholder="Ask Jules to act..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-aussie-500/40 focus:ring-1 focus:ring-aussie-500/20 transition-all"
                        />
                        <button onClick={sendDirective} className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white text-xs hover:bg-white/15 transition-colors">
                            Send
                        </button>
                    </div>
                </div>

                {/* Agent Builder Section */}
                <div className="space-y-2 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        <CalendarClock className="w-3.5 h-3.5 text-aussie-400" />
                        Agent Builder
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                        <label className="block text-gray-500 text-[10px]">Jules Source</label>
                        <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                            {sources.map(src => (
                                <option key={src} value={src}>{src}</option>
                            ))}
                            {!sources.length && <option value="">No sources available</option>}
                        </select>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                        <label className="block text-gray-500 text-[10px]">Prompt</label>
                        <textarea value={promptText} onChange={e => setPromptText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" rows={2} />
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                        <input type="checkbox" checked={autoApprove} onChange={e => setAutoApprove(e.target.checked)} className="h-3 w-3 text-aussie-500 rounded" />
                        <span className="text-gray-400">Auto approve</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <select value={schedule} onChange={e => setSchedule(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                            <option value="once">Once</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="interval">Interval</option>
                        </select>
                        {schedule === 'interval' && (
                            <input type="number" min={60} value={intervalSeconds} onChange={e => setIntervalSeconds(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" placeholder="Sec" />
                        )}
                    </div>
                    <button onClick={scheduleJulesSession} className="w-full py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Schedule Agent
                    </button>
                    {builderMessage && <div className="text-[10px] text-emerald-300">{builderMessage}</div>}
                </div>

                {/* Flow Automator Section */}
                <div className="space-y-2 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        <Layers className="w-3.5 h-3.5 text-aussie-400" />
                        Flow Automator
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                        <label className="block text-gray-500 text-[10px]">Flow ID</label>
                        <input value={flowId} onChange={e => setFlowId(e.target.value)} placeholder="e.g. my-flow-123" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                        <label className="block text-gray-500 text-[10px]">Agent Roles</label>
                        <div className="flex flex-wrap gap-1">
                            {['planner','coder','reviewer','tester'].map(role => (
                                <button key={role} onClick={() => toggleFlowRole(role)} className={`px-2 py-0.5 rounded-full text-[10px] border transition ${flowRoles.includes(role) ? 'bg-aussie-500/20 border-aussie-500 text-aussie-300' : 'bg-white/5 border-white/20 text-gray-400 hover:border-white/40'}`}>
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <select value={flowSchedule} onChange={e => setFlowSchedule(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
                            <option value="once">Once</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="interval">Interval</option>
                        </select>
                        {flowSchedule === 'interval' && (
                            <input type="number" min={60} value={flowIntervalSeconds} onChange={e => setFlowIntervalSeconds(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" placeholder="Sec" />
                        )}
                    </div>
                    <button onClick={scheduleFlowTask} className="w-full py-1.5 rounded-lg bg-gradient-to-r from-aussie-500 to-emerald-400 text-black font-bold text-xs hover:opacity-90 transition-colors">
                        Automate Flow
                    </button>
                    {flowMessage && <div className="text-[10px] text-emerald-300">{flowMessage}</div>}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-300 pt-2">
                    <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5 hover:bg-white/10 transition-all">
                        <LayoutDashboard className="w-3.5 h-3.5 text-aussie-300" />
                        Home
                    </button>
                    <button onClick={() => onNavigate('code')} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5 hover:bg-white/10 transition-all">
                        <Code2 className="w-3.5 h-3.5 text-aussie-300" />
                        Code
                    </button>
                    <button onClick={() => onNavigate('browser')} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5 hover:bg-white/10 transition-all">
                        <Globe className="w-3.5 h-3.5 text-aussie-300" />
                        Browser
                    </button>
                    <button onClick={() => onNavigate('deploy')} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5 hover:bg-white/10 transition-all">
                        <Play className="w-3.5 h-3.5 text-aussie-300" />
                        Deploy
                    </button>
                </div>

                {/* Daemon Controls */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-2">
                    <button onClick={() => agentDaemon.stop()} className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-1">
                        Stop
                    </button>
                    <button onClick={() => agentDaemon.start()} className="px-2 py-1.5 rounded-lg bg-aussie-500 text-black font-semibold hover:bg-aussie-400 transition-all flex-1">
                        Restart
                    </button>
                    <button onClick={() => onSendMessage('Provide OS status update.')} className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-1">
                        <Repeat className="w-3 h-3 inline mr-0.5" />
                        Status
                    </button>
                </div>
            </div>
        </div>
    );
};
