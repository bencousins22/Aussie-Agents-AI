
import React, { useState, useEffect } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { wm } from '../services/windowManager';
import { appRegistry } from '../services/appRegistry';
import { OSWindow } from '../types';
import { bus } from '../services/eventBus';
import { LAYOUT } from '../constants/ui';

export const WindowManager: React.FC = () => {
    const [windows, setWindows] = useState<OSWindow[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        return wm.subscribe(setWindows);
    }, []);

    useEffect(() => {
        const sub = bus.subscribe(e => {
            if (e.type === 'app-created' || e.type === 'app-installed') {
                setWindows(prev => [...prev]);
            }
        });
        return () => sub();
    }, []);

    if (windows.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {windows.map(win => {
                if (win.isMinimized) return null;

                const appDef = appRegistry.get(win.appId);
                const Component = appDef?.component;
                const effectiveMaximized = isMobile ? true : win.isMaximized;

                return (
                    <WindowFrame key={win.id} window={win} isMobile={isMobile} maximizedOverride={effectiveMaximized}>
                        {Component ? (
                            <Component {...win.props} />
                        ) : (
                            <div className="p-4 text-red-400 bg-[#0a0e14] h-full">
                                <h3 className="font-semibold text-sm">Application Error</h3>
                                <p className="text-xs text-gray-500 mt-1">Could not load: {win.appId}</p>
                            </div>
                        )}
                    </WindowFrame>
                );
            })}
        </div>
    );
};

const WindowFrame: React.FC<{ window: OSWindow, children: React.ReactNode, isMobile: boolean, maximizedOverride: boolean }> = ({ window: win, children, isMobile, maximizedOverride }) => {
    const handleMouseDown = () => {
        wm.focusWindow(win.id);
    };

    const handleDragStart = (e: React.MouseEvent) => {
        if (maximizedOverride) return;
        e.preventDefault();
        const startX = e.clientX - win.x;
        const startY = e.clientY - win.y;

        const onMouseMove = (mv: MouseEvent) => {
            wm.moveWindow(win.id, mv.clientX - startX, mv.clientY - startY);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleResize = (e: React.MouseEvent, edge: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') => {
        if (maximizedOverride) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = win.width;
        const startH = win.height;
        const startPosX = win.x;
        const startPosY = win.y;

        const onMove = (mv: MouseEvent) => {
            const deltaX = mv.clientX - startX;
            const deltaY = mv.clientY - startY;
            let newWidth = startW;
            let newHeight = startH;
            let newX = startPosX;
            let newY = startPosY;

            if (edge.includes('e')) newWidth = Math.max(LAYOUT.WINDOW_MIN_WIDTH, startW + deltaX);
            if (edge.includes('w')) {
                newWidth = Math.max(LAYOUT.WINDOW_MIN_WIDTH, startW - deltaX);
                newX = startPosX + (startW - newWidth);
            }
            if (edge.includes('s')) newHeight = Math.max(LAYOUT.WINDOW_MIN_HEIGHT, startH + deltaY);
            if (edge.includes('n')) {
                newHeight = Math.max(LAYOUT.WINDOW_MIN_HEIGHT, startH - deltaY);
                newY = startPosY + (startH - newHeight);
            }

            if (newX !== startPosX || newY !== startPosY) {
                wm.moveWindow(win.id, newX, newY);
            }
            wm.resizeWindow(win.id, newWidth, newHeight);
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const style: React.CSSProperties = maximizedOverride ? {
        top: 0, left: 0, right: 0, bottom: isMobile ? '64px' : 0, width: '100%', height: isMobile ? 'calc(100% - 64px)' : '100%', borderRadius: 0
    } : {
        top: win.y, left: win.x, width: win.width, height: win.height
    };

    return (
        <div
            className={`absolute bg-[#0a0e14] border border-white/10 shadow-2xl flex flex-col pointer-events-auto overflow-hidden ${maximizedOverride ? '' : 'rounded-xl'}`}
            style={{ ...style, zIndex: win.zIndex }}
            onMouseDown={handleMouseDown}
        >
            {/* Title Bar */}
            <div
                className="h-9 bg-[#0d1117] border-b border-white/[0.06] flex items-center justify-between px-3 select-none shrink-0"
                onMouseDown={handleDragStart}
                onDoubleClick={() => !isMobile && wm.maximizeWindow(win.id)}
            >
                <span className="text-xs font-medium text-gray-300 truncate">
                    {win.title}
                </span>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); wm.minimizeWindow(win.id, true); }}
                        className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                    {!isMobile && (
                        <button
                            onClick={(e) => { e.stopPropagation(); wm.maximizeWindow(win.id); }}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                        >
                            {win.isMaximized ? <Maximize2 className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); wm.closeWindow(win.id); }}
                        className="w-6 h-6 flex items-center justify-center hover:bg-red-500/80 rounded text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-[#0a0e14]">
                {children}
            </div>

            {/* Resize Handles */}
            {!maximizedOverride && (
                <>
                    {/* Edge handles */}
                    <div className="absolute top-0 left-4 right-4 h-1 cursor-n-resize hover:bg-aussie-500/20 transition-colors" onMouseDown={(e) => handleResize(e, 'n')} />
                    <div className="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize hover:bg-aussie-500/20 transition-colors" onMouseDown={(e) => handleResize(e, 's')} />
                    <div className="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize hover:bg-aussie-500/20 transition-colors" onMouseDown={(e) => handleResize(e, 'w')} />
                    <div className="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize hover:bg-aussie-500/20 transition-colors" onMouseDown={(e) => handleResize(e, 'e')} />

                    {/* Corner handles */}
                    <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize" onMouseDown={(e) => handleResize(e, 'nw')} />
                    <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize" onMouseDown={(e) => handleResize(e, 'ne')} />
                    <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize" onMouseDown={(e) => handleResize(e, 'sw')} />
                    <div
                        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize group"
                        onMouseDown={(e) => handleResize(e, 'se')}
                    >
                        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 opacity-30 group-hover:opacity-60 transition-opacity">
                            <div className="absolute bottom-0 right-0 w-1 h-1 bg-gray-400 rounded-full" />
                            <div className="absolute bottom-0 right-1.5 w-1 h-1 bg-gray-400 rounded-full" />
                            <div className="absolute bottom-1.5 right-0 w-1 h-1 bg-gray-400 rounded-full" />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
