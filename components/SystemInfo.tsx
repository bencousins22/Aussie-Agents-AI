
import React from 'react';
import { Monitor, Cpu, Database, Wifi, Activity } from 'lucide-react';

export const SystemInfo: React.FC = () => {
    return (
        <div className="h-full bg-[#0f1216] p-6 text-white flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                <div className="w-16 h-16 bg-aussie-500 rounded-2xl flex items-center justify-center text-black text-2xl font-bold shadow-lg">
                    A
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Aussie OS</h1>
                    <p className="text-gray-400">Version 2.2.1 (Stable)</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Cpu className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Kernel</span>
                    </div>
                    <div className="font-mono text-sm">JulesVM v3.0 (Virtual)</div>
                </div>
                <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800">
                     <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Database className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Memory</span>
                    </div>
                    <div className="font-mono text-sm">8 GB (Simulated)</div>
                </div>
                 <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800">
                     <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Wifi className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Network</span>
                    </div>
                    <div className="font-mono text-sm">Active (Mock 1Gbps)</div>
                </div>
                 <div className="bg-[#161b22] p-4 rounded-xl border border-gray-800">
                     <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Activity className="w-4 h-4" /> <span className="text-xs font-bold uppercase">Uptime</span>
                    </div>
                    <div className="font-mono text-sm">14h 22m</div>
                </div>
            </div>

            <div className="mt-auto text-center text-xs text-gray-600">
                © 2024 Aussie Intelligence Systems. All rights reserved.
            </div>
        </div>
    );
};
