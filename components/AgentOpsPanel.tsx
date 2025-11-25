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

    const calculateNextRun = () => {
        const now = Date.now();
        if (schedule === 'once') return now + 1000;
        if (schedule === 'hourly') return now + 60 * 60 * 1000;
        if (schedule === 'daily') return now + 24 * 60 * 60 * 1000;
        return now + (intervalSeconds * 1000);
    };

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
        const nextRun = calculateNextRun();
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
        <div className="fixed top-16 right-3 w-full max-w-[360px] z-[120]">
            <div className="rounded-2xl border border-white/10 bg-[#0b1018]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-aussie-500/15 border border-aussie-500/30 flex items-center justify-center text-aussie-300">
                            <Rocket className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Agent Control</div>
                            <div className="text-sm text-white">Realtime OS actions</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <div className="text-[11px] text-gray-400 font-semibold">Mission</div>
                        <textarea
                            value={mission}
                            onChange={e => setMission(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 resize-none"
                            rows={2}
                        />
                        <button onClick={launchMission} className="w-full py-2 rounded-lg bg-aussie-500 text-black font-bold text-sm hover:bg-aussie-400 transition-colors">
                            Start Mission
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="text-[11px] text-gray-400 font-semibold">Directive</div>
                        <div className="flex gap-2">
                            <input
                                value={command}
                                onChange={e => setCommand(e.target.value)}
                                placeholder="Ask Jules to act..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600"
                            />
                            <button onClick={sendDirective} className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm hover:bg-white/15 transition-colors">
                                Send
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 border-t border-white/10 pt-3">
                        <div className="flex items-center gap-3 text-xs uppercase font-bold text-gray-400 tracking-widest">
                            <CalendarClock className="w-4 h-4 text-aussie-400" />
                            Agent Builder
                        </div>
                        <div className="space-y-2 text-[12px]">
                            <label className="block text-gray-400">Jules Source</label>
                            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                                {sources.map(src => (
                                    <option key={src} value={src}>{src}</option>
                                ))}
                                {!sources.length && <option value="">No sources available</option>}
                            </select>
                        </div>
                        <div className="space-y-2 text-[12px]">
                            <label className="block text-gray-400">Prompt</label>
                            <textarea value={promptText} onChange={e => setPromptText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" rows={2} />
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                            <input type="checkbox" checked={autoApprove} onChange={e => setAutoApprove(e.target.checked)} className="h-4 w-4 text-aussie-500" />
                            <span>Auto approve plan</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[12px]">
                            <select value={schedule} onChange={e => setSchedule(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <option value="once">Once</option>
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                                <option value="interval">Interval</option>
                            </select>
                            {schedule === 'interval' && (
                                <input type="number" min={60} value={intervalSeconds} onChange={e => setIntervalSeconds(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Interval sec" />
                            )}
                        </div>
                        <button onClick={scheduleJulesSession} className="w-full py-2 rounded-lg bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
                            <Layers className="w-4 h-4" />
                            Schedule Jules Agent
                        </button>
                        {builderMessage && <div className="text-xs text-emerald-300">{builderMessage}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px] text-gray-300">
                        <button onClick={() => onNavigate('dashboard')} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
                            <LayoutDashboard className="w-4 h-4 text-aussie-300" />
                            Home
                        </button>
                        <button onClick={() => onNavigate('code')} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
                            <Code2 className="w-4 h-4 text-aussie-300" />
                            Code
                        </button>
                        <button onClick={() => onNavigate('browser')} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
                            <Globe className="w-4 h-4 text-aussie-300" />
                            Browser
                        </button>
                        <button onClick={() => onNavigate('deploy')} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all">
                            <Play className="w-4 h-4 text-aussie-300" />
                            Deploy
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <button onClick={() => agentDaemon.stop()} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-1">
                            Stop Daemon
                        </button>
                        <button onClick={() => agentDaemon.start()} className="px-3 py-2 rounded-lg bg-aussie-500 text-black font-semibold hover:bg-aussie-400 transition-all flex-1">
                            Restart Daemon
                        </button>
                        <button onClick={() => onSendMessage('Provide OS status update and next actions.')} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-1">
                            <Repeat className="w-4 h-4 inline mr-1" />
                            Status
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
