import React from 'react';
import { WorkflowPhase } from '../types';
import { Activity, BrainCircuit, Code2, Microscope, Rocket, CheckCircle } from 'lucide-react';

export const AgentStatus: React.FC<{ state: WorkflowPhase }> = ({ state }) => {
    const getConfig = () => {
        switch (state) {
            case 'exploring': return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Microscope, label: 'Exploring' };
            case 'planning': return { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: BrainCircuit, label: 'Planning' };
            case 'coding': return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: Code2, label: 'Coding' };
            case 'verifying': return { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', icon: Activity, label: 'Testing' };
            case 'deploying': return { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', icon: Rocket, label: 'Deploying' };
            case 'error': return { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: Activity, label: 'Error' };
            case 'idle': return { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700', icon: CheckCircle, label: 'Idle' };
            default: return { color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700', icon: Activity, label: 'Standby' };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <div className={`
            flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 min-w-[100px]
            ${config.bg} ${config.border}
        `}>
            {state !== 'idle' && state !== 'error' ? (
                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                     <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.color.replace('text', 'bg')}`}></span>
                     <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color.replace('text', 'bg')}`}></span>
                </div>
            ) : (
                <Icon className={`w-3.5 h-3.5 ${config.color} shrink-0`} />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                {config.label}
            </span>
        </div>
    );
};