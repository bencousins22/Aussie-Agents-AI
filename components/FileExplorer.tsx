
import React, { useState, useEffect, useRef } from 'react';
import { fs } from '../services/fileSystem';
import { FileStat } from '../types';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, RefreshCw, Plus, Trash2, FilePlus, FolderPlus, MoreVertical, Download, Edit } from 'lucide-react';
import { bus } from '../services/eventBus';

interface Props {
    onFileClick: (path: string) => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    path: string;
    type: 'file' | 'directory';
}

const EXPANDED_KEY = 'aussie_os_expanded_folders';

export const FileExplorer: React.FC<Props> = ({ onFileClick }) => {
    const [items, setItems] = useState<FileStat[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(EXPANDED_KEY);
            return saved ? new Set(JSON.parse(saved)) : new Set(['/workspace']);
        } catch {
            return new Set(['/workspace']);
        }
    });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [creating, setCreating] = useState<{ parentPath: string, type: 'file' | 'directory' } | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const newItemInputRef = useRef<HTMLInputElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // DnD State
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

    const fetchFiles = (path: string): FileStat[] => {
        try {
            return fs.readDir(path).sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });
        } catch (e) {
            return [];
        }
    };

    const refresh = () => {
        setItems(fetchFiles('/workspace'));
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        try {
            localStorage.setItem(EXPANDED_KEY, JSON.stringify(Array.from(expandedFolders)));
        } catch (e) {
            console.error("Failed to save expansion state", e);
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [expandedFolders]);

    useEffect(() => {
        refresh();
        const unsubscribe = bus.subscribe((event) => {
            if (event.type === 'file-change') {
                refresh();
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (creating && newItemInputRef.current) {
            newItemInputRef.current.focus();
        }
    }, [creating]);

    const toggleFolder = (path: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        setExpandedFolders(newSet);
    };

    const handleContextMenu = (e: React.MouseEvent, path: string, type: 'file' | 'directory') => {
        e.preventDefault();
        e.stopPropagation();
        // On mobile, ignore X/Y and use bottom sheet logic
        setContextMenu({ x: e.clientX, y: e.clientY, path, type });
    };

    const handleCreate = (type: 'file' | 'directory') => {
        if (!contextMenu) return;
        const parentPath = contextMenu.type === 'file' 
            ? contextMenu.path.substring(0, contextMenu.path.lastIndexOf('/')) 
            : contextMenu.path;
        
        setCreating({ parentPath, type });
        setExpandedFolders(prev => new Set(prev).add(parentPath));
        setContextMenu(null);
    };

    const handleDelete = () => {
        if (!contextMenu) return;
        if (confirm(`Delete ${contextMenu.path}?`)) {
            fs.delete(contextMenu.path);
        }
        setContextMenu(null);
    };

    const submitNewItem = () => {
        if (!creating || !newItemName.trim()) {
            setCreating(null);
            return;
        }
        const fullPath = `${creating.parentPath}/${newItemName.trim()}`;
        try {
            if (creating.type === 'file') {
                fs.writeFile(fullPath, '');
                onFileClick(fullPath);
            } else {
                fs.mkdir(fullPath);
                setExpandedFolders(prev => new Set(prev).add(fullPath));
            }
        } catch (e) {
            alert('Error creating item');
        }
        setCreating(null);
        setNewItemName('');
    };

    // DnD Handlers
    const handleDragStart = (e: React.DragEvent, path: string) => {
        e.dataTransfer.setData('text/plain', path);
        setDraggedItem(path);
    };

    const handleDragOver = (e: React.DragEvent, path: string, type: 'file' | 'directory') => {
        e.preventDefault();
        if (type === 'directory' && draggedItem !== path) {
            setDragOverFolder(path);
        }
    };

    const handleDragLeave = () => {
        setDragOverFolder(null);
    };

    const handleDrop = (e: React.DragEvent, targetPath: string) => {
        e.preventDefault();
        setDragOverFolder(null);
        const sourcePath = e.dataTransfer.getData('text/plain');
        
        if (sourcePath && sourcePath !== targetPath) {
            try {
                const fileName = sourcePath.split('/').pop();
                const destPath = `${targetPath}/${fileName}`;
                fs.move(sourcePath, destPath);
            } catch (err) {
                console.error("Move failed", err);
            }
        }
        setDraggedItem(null);
    };

    const FileTreeItem: React.FC<{ path: string, depth: number }> = ({ path, depth }) => {
        const files = fetchFiles(path);
        const isCreatingHere = creating && creating.parentPath === path;

        return (
            <div className="flex flex-col">
                {files.map(file => {
                    const isOver = dragOverFolder === file.path;
                    
                    return (
                        <div key={file.path} className="touch-manipulation group/item">
                            <div 
                                draggable
                                onDragStart={(e) => handleDragStart(e, file.path)}
                                onDragOver={(e) => handleDragOver(e, file.path, file.type)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => file.type === 'directory' ? handleDrop(e, file.path) : undefined}
                                className={`
                                    flex items-center gap-2 py-3 md:py-1.5 px-2 cursor-pointer text-sm select-none transition-colors border-l-2 relative
                                    ${isOver ? 'bg-aussie-500/20 border-aussie-500 text-white' : 'hover:bg-os-panel border-transparent hover:border-aussie-500/50 text-os-textDim hover:text-white'}
                                `}
                                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (file.type === 'directory') toggleFolder(file.path);
                                    else onFileClick(file.path);
                                }}
                                onContextMenu={(e) => handleContextMenu(e, file.path, file.type)}
                            >
                                {file.type === 'directory' && (
                                    expandedFolders.has(file.path) ? 
                                    <ChevronDown className="w-4 h-4 text-os-textDim shrink-0" /> : 
                                    <ChevronRight className="w-4 h-4 text-os-textDim shrink-0" />
                                )}
                                {file.type === 'directory' ? 
                                    (expandedFolders.has(file.path) ? <FolderOpen className="w-4 h-4 text-aussie-500 shrink-0" /> : <Folder className="w-4 h-4 text-aussie-500 shrink-0" />) :
                                    <File className="w-4 h-4 text-blue-400 shrink-0" />
                                }
                                <span className="truncate opacity-90 flex-1">{file.name}</span>
                                
                                {/* Mobile Context Menu Trigger */}
                                <button 
                                    className="md:hidden p-2 -mr-2 text-gray-500 active:text-white"
                                    onClick={(e) => handleContextMenu(e, file.path, file.type)}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                            {file.type === 'directory' && expandedFolders.has(file.path) && (
                                 <FileTreeItem path={file.path} depth={depth + 1} />
                            )}
                        </div>
                    );
                })}
                
                {isCreatingHere && (
                    <div className="flex items-center gap-1.5 py-2 px-2 animate-in fade-in slide-in-from-left-1 duration-200" style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}>
                        {creating.type === 'directory' ? <Folder className="w-4 h-4 text-aussie-500" /> : <File className="w-4 h-4 text-blue-400" />}
                        <input
                            ref={newItemInputRef}
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => {
                                if(e.key === 'Enter') submitNewItem();
                                if(e.key === 'Escape') setCreating(null);
                            }}
                            onBlur={submitNewItem}
                            className="bg-os-bg border border-aussie-500 rounded px-2 py-1 text-sm text-white outline-none w-full min-w-[100px]"
                            placeholder="Name..."
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-os-bg overflow-hidden" onContextMenu={(e) => handleContextMenu(e, '/workspace', 'directory')}>
            <div className="flex items-center justify-between px-3 py-2 bg-os-panel border-b border-os-border shrink-0 h-10 md:h-9">
                <span className="text-xs font-bold text-os-textDim uppercase tracking-widest">Explorer</span>
                <div className="flex items-center gap-3 md:gap-2">
                    <button onClick={() => handleContextMenu({ clientX: 0, clientY: 0 } as any, '/workspace', 'directory')} className="md:hidden">
                        <Plus className="w-4 h-4 text-os-textDim" />
                    </button>
                    <RefreshCw className="w-3.5 h-3.5 cursor-pointer text-os-textDim hover:text-white transition-colors" onClick={refresh} />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2 custom-scrollbar pb-20 md:pb-4">
                <FileTreeItem path="/workspace" depth={0} />
            </div>

            {contextMenu && (
                <>
                     {/* Mobile Backdrop */}
                    <div className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setContextMenu(null)} />
                    
                    <div 
                        className={`
                            fixed z-[100] bg-os-panel border border-os-border shadow-2xl
                            ${isMobile 
                                ? 'bottom-0 left-0 right-0 rounded-t-2xl border-x-0 border-b-0 pb-safe animate-in slide-in-from-bottom duration-200' 
                                : 'w-48 rounded-lg py-1 animate-in fade-in zoom-in duration-100'}
                        `}
                        style={!isMobile ? { left: Math.min(contextMenu.x, window.innerWidth - 160), top: Math.min(contextMenu.y, window.innerHeight - 120) } : {}}
                        onClick={e => e.stopPropagation()}
                    >
                         {isMobile && (
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-12 h-1 bg-gray-700 rounded-full" />
                            </div>
                        )}
                        
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 border-b border-white/5 mb-1 truncate">
                            {contextMenu.path.split('/').pop() || 'Workspace'}
                        </div>

                        <button onClick={() => handleCreate('file')} className="flex items-center gap-3 px-4 py-3 md:py-2 text-sm text-gray-300 hover:bg-aussie-500 hover:text-[#0f1216] transition-colors text-left w-full">
                            <FilePlus className="w-4 h-4" /> New File
                        </button>
                        <button onClick={() => handleCreate('directory')} className="flex items-center gap-3 px-4 py-3 md:py-2 text-sm text-gray-300 hover:bg-aussie-500 hover:text-[#0f1216] transition-colors text-left w-full">
                            <FolderPlus className="w-4 h-4" /> New Folder
                        </button>
                        
                        {contextMenu.type === 'file' && (
                            <button onClick={() => { onFileClick(contextMenu.path); setContextMenu(null); }} className="flex items-center gap-3 px-4 py-3 md:py-2 text-sm text-gray-300 hover:bg-aussie-500 hover:text-[#0f1216] transition-colors text-left w-full">
                                <Edit className="w-4 h-4" /> Open
                            </button>
                        )}

                        <div className="h-px bg-os-border my-1" />
                        <button onClick={handleDelete} className="flex items-center gap-3 px-4 py-3 md:py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors text-left w-full">
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
