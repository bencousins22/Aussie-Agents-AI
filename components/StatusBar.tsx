
import React, { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, XCircle, Check, Wifi } from 'lucide-react';
import { realGit } from '../services/gitReal';
import { EditorTab } from '../types';

interface Props {
    activeTab: EditorTab | undefined;
}

export const StatusBar: React.FC<Props> = ({ activeTab }) => {
    const [branch, setBranch] = useState('main');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await realGit.status('/workspace');
                // Simple parse to detect branch
                const match = res.stdout.match(/On branch (.+)/);
                if (match) setBranch(match[1]);
                setIsDirty(!res.stdout.includes('working tree clean'));
            } catch(e) {}
        };
        fetchStatus();
        const i = setInterval(fetchStatus, 5000);
        return () => clearInterval(i);
    }, []);

    return (
        <div className="h-6 bg-os-panel border-t border-aussie-500/30 flex items-center justify-between px-3 text-[10px] text-os-textDim select-none shrink-0 z-40">
            
            {/* Left Section */}
            <div className="flex items-center gap-4 h-full">
                <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
                    <GitBranch className="w-3 h-3" />
                    <span className="font-medium">{branch}</span>
                    {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 ml-1" />}
                </div>
                
                <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                    <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> 0
                    </div>
                    <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> 0
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4 h-full">
                <div className="flex items-center gap-1.5 text-aussie-500 cursor-pointer hover:bg-aussie-500/10 px-2 h-full rounded">
                    <Wifi className="w-3 h-3" />
                    <span>Go Live</span>
                </div>

                <div className="hover:text-white cursor-pointer">
                    Ln {Math.floor(Math.random() * 50) + 1}, Col {Math.floor(Math.random() * 20) + 1}
                </div>

                <div className="hover:text-white cursor-pointer">
                    UTF-8
                </div>

                <div className="flex items-center gap-1.5 hover:text-white cursor-pointer font-bold text-aussie-500">
                    {activeTab ? (
                        <>
                            {activeTab.language === 'typescript' && <span className="text-blue-400">TS</span>}
                            {activeTab.language === 'javascript' && <span className="text-yellow-400">JS</span>}
                            {activeTab.language === 'json' && <span className="text-orange-400">JSON</span>}
                            {activeTab.language === 'markdown' && <span className="text-purple-400">MD</span>}
                            {activeTab.language.toUpperCase()}
                        </>
                    ) : 'TXT'}
                </div>

                <div className="hover:text-white cursor-pointer">
                    <Check className="w-3 h-3" /> Prettier
                </div>
            </div>
        </div>
    );
};
