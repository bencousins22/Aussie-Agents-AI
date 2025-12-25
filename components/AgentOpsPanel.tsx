import React, { useEffect, useState } from 'react';
import { Rocket, LayoutDashboard, Code2, Globe, X, Play, Repeat, CalendarClock, Layers } from 'lucide-react';
import { MainView } from '../types';
import { agentDaemon } from '../services/agentDaemon';
import { julesRest } from '../services/julesRest';
import { scheduler } from '../services/scheduler';
import { notify } from '../services/notification';
import { LAYOUT } from '../constants/ui';

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
            } catch {
                notify.error('Jules', 'Unable to list sources.');
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
            sourceContext: { source: selectedSource, githubRepoContext: { startingBranch: 'main' } },
            automationMode: 'AUTO_CREATE_PR',
            title: `Builder run ${new Date().toISOString()}`,
            autoApprove
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
        setBuilderMessage(`Scheduled: ${new Date(nextRun).toLocaleString()}`);
    };

    const toggleFlowRole = (role: string) => {
        setFlowRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };

    const scheduleFlowTask = () => {
        if (!flowId.trim()) {
            notify.error('Agent Builder', 'Provide a flow ID.');
            return;
        }
        const payload = { flowId: flowId.trim(), roles: flowRoles };
        const nextRun = calculateNextRun(flowSchedule, flowIntervalSeconds);
        const task = scheduler.addTask({
            name: `Flow: ${flowId}`,
            type: 'flow',
            action: JSON.stringify(payload),
            schedule: flowSchedule,
            intervalSeconds: flowSchedule === 'interval' ? flowIntervalSeconds : undefined,
            nextRun
        });
        setFlowMessage(`Scheduled: ${new Date(nextRun).toLocaleString()}`);
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
        <div className="h-full flex flex-col bg-[#0a0d12]" style={{ width: LAYOUT.AGENT_OPS_WIDTH }}>
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] bg-[#0d1117] shrink-0">
                <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-aussie-500" />
                    <span className="text-xs font-semibold text-white">Agent Control</span>
                </div>
                <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                {/* Mission */}
                <Section title="Mission">
                    <textarea
                        value={mission}
                        onChange={e => setMission(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-600 resize-none focus:border-aussie-500/30 outline-none transition-colors"
                        rows={2}
                    />
                    <button onClick={launchMission} className="w-full h-8 rounded-lg bg-aussie-500 text-black font-semibold text-xs hover:bg-aussie-400 transition-colors">
                        Start Mission
                    </button>
                </Section>

                {/* Directive */}
                <Section title="Directive">
                    <div className="flex gap-1.5">
                        <input
                            value={command}
                            onChange={e => setCommand(e.target.value)}
                            placeholder="Ask Jules to act..."
                            className="flex-1 h-8 bg-white/5 border border-white/10 rounded-lg px-2.5 text-xs text-white placeholder:text-gray-600 focus:border-aussie-500/30 outline-none transition-colors"
                        />
                        <button onClick={sendDirective} className="h-8 px-3 rounded-lg bg-white/10 border border-white/10 text-white text-xs font-medium hover:bg-white/15 transition-colors">
                            Send
                        </button>
                    </div>
                </Section>

                {/* Agent Builder */}
                <Section title="Agent Builder" icon={CalendarClock}>
                    <div className="space-y-2">
                        <label className="block text-[10px] text-gray-500">Source</label>
                        <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className="w-full h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white">
                            {sources.map(src => <option key={src} value={src}>{src}</option>)}
                            {!sources.length && <option value="">No sources</option>}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] text-gray-500">Prompt</label>
                        <textarea value={promptText} onChange={e => setPromptText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white resize-none focus:border-aussie-500/30 outline-none" rows={2} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={autoApprove} onChange={e => setAutoApprove(e.target.checked)} className="w-3.5 h-3.5 rounded text-aussie-500" />
                        <span className="text-[11px] text-gray-400">Auto approve</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <select value={schedule} onChange={e => setSchedule(e.target.value as any)} className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white">
                            <option value="once">Once</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="interval">Interval</option>
                        </select>
                        {schedule === 'interval' && (
                            <input type="number" min={60} value={intervalSeconds} onChange={e => setIntervalSeconds(Number(e.target.value))} className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white" placeholder="Sec" />
                        )}
                    </div>
                    <button onClick={scheduleJulesSession} className="w-full h-8 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Schedule
                    </button>
                    {builderMessage && <div className="text-[10px] text-emerald-400">{builderMessage}</div>}
                </Section>

                {/* Flow Automator */}
                <Section title="Flow Automator" icon={Layers}>
                    <div className="space-y-2">
                        <label className="block text-[10px] text-gray-500">Flow ID</label>
                        <input value={flowId} onChange={e => setFlowId(e.target.value)} placeholder="e.g. my-flow-123" className="w-full h-8 bg-white/5 border border-white/10 rounded-lg px-2.5 text-xs text-white focus:border-aussie-500/30 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] text-gray-500">Roles</label>
                        <div className="flex flex-wrap gap-1">
                            {['planner','coder','reviewer','tester'].map(role => (
                                <button key={role} onClick={() => toggleFlowRole(role)} className={`px-2 py-1 rounded text-[10px] border transition ${flowRoles.includes(role) ? 'bg-aussie-500/15 border-aussie-500/40 text-aussie-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}>
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <select value={flowSchedule} onChange={e => setFlowSchedule(e.target.value as any)} className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white">
                            <option value="once">Once</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="interval">Interval</option>
                        </select>
                        {flowSchedule === 'interval' && (
                            <input type="number" min={60} value={flowIntervalSeconds} onChange={e => setFlowIntervalSeconds(Number(e.target.value))} className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-xs text-white" placeholder="Sec" />
                        )}
                    </div>
                    <button onClick={scheduleFlowTask} className="w-full h-8 rounded-lg bg-aussie-500 text-black font-semibold text-xs hover:bg-aussie-400 transition-colors">
                        Automate Flow
                    </button>
                    {flowMessage && <div className="text-[10px] text-emerald-400">{flowMessage}</div>}
                </Section>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-1.5">
                    <QuickAction icon={LayoutDashboard} label="Home" onClick={() => onNavigate('dashboard')} />
                    <QuickAction icon={Code2} label="Code" onClick={() => onNavigate('code')} />
                    <QuickAction icon={Globe} label="Browser" onClick={() => onNavigate('browser')} />
                    <QuickAction icon={Play} label="Deploy" onClick={() => onNavigate('deploy')} />
                </div>

                {/* Daemon Controls */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                    <button onClick={() => agentDaemon.stop()} className="flex-1 h-7 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] font-medium hover:bg-white/10 transition-colors">
                        Stop
                    </button>
                    <button onClick={() => agentDaemon.start()} className="flex-1 h-7 rounded bg-aussie-500 text-black text-[10px] font-semibold hover:bg-aussie-400 transition-colors">
                        Restart
                    </button>
                    <button onClick={() => onSendMessage('Provide OS status update.')} className="flex-1 h-7 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                        <Repeat className="w-3 h-3" />
                        Status
                    </button>
                </div>
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; icon?: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
            {Icon && <Icon className="w-3.5 h-3.5 text-aussie-500" />}
            {title}
        </div>
        {children}
    </div>
);

const QuickAction: React.FC<{ icon: any; label: string; onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
    <button onClick={onClick} className="h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 text-gray-400 text-[10px] font-medium hover:bg-white/10 hover:text-white transition-all">
        <Icon className="w-3.5 h-3.5 text-aussie-400" />
        {label}
    </button>
);
