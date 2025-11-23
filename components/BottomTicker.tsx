
import React from 'react';
import { Activity, Wifi, Cpu, Globe } from 'lucide-react';

export const BottomTicker: React.FC = () => {
    return (
        <div className="h-6 bg-[#0a0c10] border-t border-os-border flex items-center overflow-hidden whitespace-nowrap text-[10px] text-os-textDim select-none shrink-0">
            <div className="flex items-center gap-8 animate-marquee px-4">
                <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-aussie-500" /> SYSTEM OPTIMAL</span>
                <span className="flex items-center gap-2"><Cpu className="w-3 h-3 text-blue-400" /> CPU: 12%</span>
                <span className="flex items-center gap-2"><Wifi className="w-3 h-3 text-green-400" /> NETWORK: 1.2 Gbps</span>
                <span className="flex items-center gap-2"><Globe className="w-3 h-3 text-purple-400" /> REGION: AP-SOUTHEAST-2</span>
                <span className="text-gray-600">|</span>
                <span>LATEST: Aussie OS v2.1 Released</span>
                <span className="text-gray-600">|</span>
                <span>MARKET: AI +4.2%</span>
                <span className="text-gray-600">|</span>
                <span>WEATHER: Sydney 24°C Sunny</span>
            </div>
            {/* Duplicate for smooth loop illusion */}
             <div className="flex items-center gap-8 animate-marquee px-4">
                <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-aussie-500" /> SYSTEM OPTIMAL</span>
                <span className="flex items-center gap-2"><Cpu className="w-3 h-3 text-blue-400" /> CPU: 12%</span>
                <span className="flex items-center gap-2"><Wifi className="w-3 h-3 text-green-400" /> NETWORK: 1.2 Gbps</span>
                <span className="flex items-center gap-2"><Globe className="w-3 h-3 text-purple-400" /> REGION: AP-SOUTHEAST-2</span>
                <span className="text-gray-600">|</span>
                <span>LATEST: Aussie OS v2.1 Released</span>
                <span className="text-gray-600">|</span>
                <span>MARKET: AI +4.2%</span>
                <span className="text-gray-600">|</span>
                <span>WEATHER: Sydney 24°C Sunny</span>
            </div>
        </div>
    );
};
