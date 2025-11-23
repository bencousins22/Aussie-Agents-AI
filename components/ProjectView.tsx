
import React, { useState, useEffect } from 'react';
import { collaboration } from '../services/collaboration';
import { Project, Collaborator } from '../types';
import { Briefcase, Plus, Folder, Users, Activity, ExternalLink, X } from 'lucide-react';
import { shell } from '../services/shell';
import { bus } from '../services/eventBus';

export const ProjectView: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [showNewModal, setShowNewModal] = useState(false);
    const [mobileTab, setMobileTab] = useState<'projects' | 'team'>('projects');
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newStack, setNewStack] = useState<string[]>([]);

    useEffect(() => {
        const refresh = () => { setProjects(collaboration.getProjects()); setCollaborators(collaboration.getCollaborators()); };
        refresh();
        const interval = setInterval(refresh, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = () => {
        if (!newName) return;
        collaboration.createProject(newName, newDesc, newStack);
        setShowNewModal(false);
        setNewName(''); setNewDesc(''); setNewStack([]);
    };

    const openProject = async (path: string) => {
        bus.emit('switch-view', { view: 'code' });
        setTimeout(() => shell.execute(`cd ${path}`), 100);
    };

    return (
        <div className="h-full bg-os-bg flex flex-col overflow-hidden">
            {/* Header - Hidden on Mobile */}
            <div className="hidden md:flex p-4 md:p-6 border-b border-os-border bg-os-panel items-center justify-between shrink-0">
                <div className="flex items-center gap-3"><div className="bg-aussie-500/20 p-2 rounded-lg"><Briefcase className="w-6 h-6 text-aussie-500" /></div><div><h2 className="text-lg md:text-xl font-bold text-white">Projects</h2></div></div>
                <button onClick={() => setShowNewModal(true)} className="px-4 py-2 bg-aussie-500 hover:bg-aussie-600 text-[#0f1216] rounded-lg font-bold flex items-center gap-2 shadow-lg text-xs md:text-sm active:scale-95 transition-transform"><Plus className="w-4 h-4" /> New Project</button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                <div className="md:hidden flex border-b border-os-border bg-os-panel shrink-0 sticky top-0 z-10">
                    <button onClick={() => setMobileTab('projects')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${mobileTab === 'projects' ? 'text-aussie-500 border-b-2 border-aussie-500 bg-white/5' : 'text-gray-500'}`}>Projects</button>
                    <button onClick={() => setMobileTab('team')} className={`flex-1 py-3 text-xs font-bold uppercase transition-colors ${mobileTab === 'team' ? 'text-aussie-500 border-b-2 border-aussie-500 bg-white/5' : 'text-gray-500'}`}>Team</button>
                </div>

                <div className={`flex-1 p-4 md:p-6 overflow-y-auto pb-24 md:pb-6 ${mobileTab === 'team' ? 'hidden md:block' : 'block'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {projects.map(project => (
                            <div key={project.id} onClick={() => openProject(project.path)} className="group bg-os-panel border border-os-border rounded-xl p-5 hover:border-aussie-500/50 transition-all hover:shadow-xl active:scale-[0.98] cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-os-bg p-2 rounded-lg border border-os-border group-hover:border-aussie-500/30"><Folder className="w-6 h-6 text-aussie-500" /></div>
                                    <ExternalLink className="w-4 h-4 text-os-textDim" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
                                <p className="text-xs text-os-textDim mb-4 line-clamp-2">{project.description}</p>
                                <div className="flex flex-wrap gap-2 mb-4">{project.stack.map(t => <span key={t} className="px-2 py-1 bg-os-bg border border-os-border rounded text-[10px] font-bold text-gray-300 uppercase">{t}</span>)}</div>
                                <div className="pt-4 border-t border-os-border flex justify-between text-xs text-os-textDim">
                                    <span>{new Date(project.lastUpdated).toLocaleDateString()}</span>
                                    <div className="flex -space-x-2">{collaborators.slice(0,3).map(c=><div key={c.id} className="w-6 h-6 rounded-full border-2 border-os-panel flex items-center justify-center text-[8px] font-bold text-white" style={{backgroundColor:c.color}}>{c.avatar}</div>)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Mobile FAB for new project */}
                    <button 
                        onClick={() => setShowNewModal(true)} 
                        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-aussie-500 rounded-full shadow-2xl flex items-center justify-center z-20 active:scale-90 transition-transform border-2 border-[#0f1216]"
                    >
                        <Plus className="w-6 h-6 text-black" />
                    </button>
                </div>

                <div className={`w-full md:w-80 bg-[#0f1115] border-l border-os-border flex-col shrink-0 ${mobileTab === 'projects' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-os-border"><h3 className="text-xs font-bold text-os-textDim uppercase mb-3 flex items-center gap-2"><Users className="w-4 h-4"/> Team</h3><div className="space-y-3">{collaborators.map(u=><div key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-os-panel"><div className="relative"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{backgroundColor:u.color}}>{u.avatar}</div><div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f1115] ${u.status==='online'?'bg-green-500':'bg-gray-500'}`}/></div><div><div className="text-sm font-bold text-gray-200">{u.name}</div><div className="text-[10px] text-os-textDim uppercase">{u.status}</div></div></div>)}</div></div>
                    <div className="flex-1 p-4 overflow-y-auto pb-24 md:pb-4"><h3 className="text-xs font-bold text-os-textDim uppercase mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Activity</h3><div className="relative border-l border-os-border ml-1.5 pl-4 space-y-4">{collaborators.filter(c=>c.status==='coding').map((u,i)=><div key={i}><div className="text-xs font-bold text-gray-300">{u.name}</div><div className="text-[11px] text-gray-500">Editing main.tsx</div></div>)}</div></div>
                </div>
            </div>

            {showNewModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 md:p-4" onClick={() => setShowNewModal(false)}>
                    <div className="bg-os-panel border-t md:border border-os-border rounded-t-2xl md:rounded-xl p-6 w-full max-w-[500px] shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between mb-6"><h3 className="text-lg font-bold text-white">New Workspace</h3><button onClick={() => setShowNewModal(false)}><X className="w-5 h-5 text-gray-500"/></button></div>
                        <div className="space-y-4 mb-6">
                            <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-os-bg border border-os-border rounded-lg p-3 text-[16px] md:text-sm text-white outline-none focus:border-aussie-500" placeholder="Project Name" autoFocus />
                            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-os-bg border border-os-border rounded-lg p-3 text-[16px] md:text-sm text-white outline-none focus:border-aussie-500 h-20 resize-none" placeholder="Description" />
                            <div className="flex gap-2 flex-wrap">{['react','node','python'].map(t=><button key={t} onClick={()=>setNewStack(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])} className={`px-3 py-2 rounded text-xs font-bold uppercase border ${newStack.includes(t)?'bg-aussie-500 text-black border-aussie-500':'bg-os-bg text-gray-400 border-os-border'}`}>{t}</button>)}</div>
                        </div>
                        <button onClick={handleCreate} className="w-full py-3 bg-aussie-500 text-black font-bold rounded-lg text-sm shadow-lg active:scale-95 transition-transform">Create Project</button>
                    </div>
                </div>
            )}
        </div>
    );
};
