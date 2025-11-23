
import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, Maximize } from 'lucide-react';
import { fs } from '../services/fileSystem';

interface Props {
    file: { path: string; type: 'video' | 'image' | 'audio' } | null;
    onClose: () => void;
}

export const MediaPlayer: React.FC<Props> = ({ file, onClose }) => {
    const [src, setSrc] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (file) {
            try {
                // In our simulated FS, media files contain the URL string
                const content = fs.readFile(file.path);
                setSrc(content.trim());
                setError(false);
            } catch (e) {
                setError(true);
            }
        }
    }, [file]);

    if (!file) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-[80%] max-w-4xl bg-[#161b22] rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-[#0d1117]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-1 bg-blue-600 rounded text-white uppercase">{file.type}</span>
                        <span className="text-sm text-gray-300 font-mono">{file.path}</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-black flex items-center justify-center min-h-[400px] relative group">
                    {error ? (
                        <div className="text-red-400">Failed to load media source.</div>
                    ) : (
                        <>
                            {file.type === 'video' && (
                                <video 
                                    src={src} 
                                    controls 
                                    autoPlay 
                                    className="w-full h-full max-h-[600px] outline-none"
                                />
                            )}
                            {file.type === 'audio' && (
                                <div className="w-full p-8 flex flex-col items-center gap-4">
                                    <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full animate-pulse"></div>
                                    <audio src={src} controls className="w-full" />
                                </div>
                            )}
                            {file.type === 'image' && (
                                <img src={src} alt="Preview" className="max-w-full max-h-[600px] object-contain" />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
