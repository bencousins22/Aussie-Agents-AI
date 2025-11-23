
import React, { useState, useEffect } from 'react';
import { X, Minus, Square } from 'lucide-react';
import { wm } from '../services/windowManager';
import { appRegistry } from '../services/appRegistry';
import { OSWindow } from '../types';
import { bus } from '../services/eventBus';

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

    // Re-render if registry changes
    useEffect(() => {
        const sub = bus.subscribe(e => {
            if (e.type === 'app-created' || e.type === 'app-installed') {
                setWindows(prev => [...prev]); // Force re-render to pick up new components
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
                
                // On mobile, force maximize logic visually
                const effectiveMaximized = isMobile ? true : win.isMaximized;

                return (
                    <WindowFrame key={win.id} window={win} isMobile={isMobile} maximizedOverride={effectiveMaximized}>
                        {Component ? (
                            // Pass botConfig if it exists, or standard props
                            <Component {...(appDef?.botConfig ? { config: appDef.botConfig } : win.props)} />
                        ) : (
                            <div className="p-4 text-red-500 bg-[#0f1216] h-full">
                                <h3 className="font-bold">Application Error</h3>
                                <p>Could not load application: {win.appId}</p>
                                <p className="text-xs opacity-50 mt-2">The app definition might be missing from the registry.</p>
                            </div>
                        )}
                    </WindowFrame>
                );
            })}
        </div>
    );
};

const WindowFrame: React.FC<{ window: OSWindow, children: React.ReactNode, isMobile: boolean, maximizedOverride: boolean }> = ({ window: win, children, isMobile, maximizedOverride }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleMouseDown = (e: React.MouseEvent) => {
        wm.focusWindow(win.id);
    };

    const handleDragStart = (e: React.MouseEvent) => {
        if (maximizedOverride) return;
        e.preventDefault();
        setIsDragging(true);
        
        const startX = e.clientX - win.x;
        const startY = e.clientY - win.y;

        const onMouseMove = (mv: MouseEvent) => {
            wm.moveWindow(win.id, mv.clientX - startX, mv.clientY - startY);
        };

        const onMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const style: React.CSSProperties = maximizedOverride ? {
        top: 0, left: 0, right: 0, bottom: isMobile ? '70px' : 0, width: '100%', height: isMobile ? 'calc(100% - 70px)' : '100%', borderRadius: 0
    } : {
        top: win.y, left: win.x, width: win.width, height: win.height
    };

    return (
        <div 
            className={`absolute bg-[#0f1216] border border-os-border shadow-2xl flex flex-col pointer-events-auto overflow-hidden ring-1 ring-white/5 ${maximizedOverride ? '' : 'rounded-lg'}`}
            style={{ ...style, zIndex: win.zIndex }}
            onMouseDown={handleMouseDown}
        >
            {/* Title Bar */}
            <div 
                className="h-9 bg-[#161b22] border-b border-os-border flex items-center justify-between px-3 select-none shrink-0"
                onMouseDown={handleDragStart}
                onDoubleClick={() => !isMobile && wm.maximizeWindow(win.id)}
            >
                <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                    {win.title}
                </span>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); wm.minimizeWindow(win.id, true); }} className="p-1 hover:bg-white/10 rounded text-gray-400"><Minus className="w-3 h-3" /></button>
                    {!isMobile && (
                        <button onClick={(e) => { e.stopPropagation(); wm.maximizeWindow(win.id); }} className="p-1 hover:bg-white/10 rounded text-gray-400"><Square className="w-3 h-3" /></button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); wm.closeWindow(win.id); }} className="p-1 hover:bg-red-500 hover:text-white rounded text-gray-400"><X className="w-3 h-3" /></button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-os-bg">
                {children}
            </div>

            {/* Resize Handle */}
            {!maximizedOverride && (
                <div 
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startW = win.width;
                        const startH = win.height;

                        const onMove = (mv: MouseEvent) => {
                            wm.resizeWindow(win.id, startW + (mv.clientX - startX), startH + (mv.clientY - startY));
                        };
                        const onUp = () => {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                        };
                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                    }}
                />
            )}
        </div>
    );
};
