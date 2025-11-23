import React, { useState } from 'react';
import { FileNode } from '../types';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';

interface Props {
    files: FileNode[];
}

export const VirtualFileSystem: React.FC<Props> = ({ files }) => {
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <Folder className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Workspace is empty</p>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* File List */}
            <div className="w-1/3 border-r border-gray-800 overflow-y-auto bg-[#0d1117]">
                <div className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project Root
                </div>
                <div className="px-2">
                    {files.map((file, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setSelectedFile(file)}
                            className={`
                                flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors
                                ${selectedFile?.path === file.path ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}
                            `}
                        >
                            <File className="w-4 h-4" />
                            <span className="truncate">{file.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* File Content Preview */}
            <div className="flex-1 bg-[#010409] overflow-hidden flex flex-col">
                {selectedFile ? (
                    <>
                        <div className="h-10 border-b border-gray-800 flex items-center px-4 text-xs text-gray-500 font-mono">
                            {selectedFile.path}
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                                {selectedFile.content}
                            </pre>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <p className="text-sm">Select a file to view content</p>
                    </div>
                )}
            </div>
        </div>
    );
};
