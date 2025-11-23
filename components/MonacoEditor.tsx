
import React, { useEffect, useState, useRef } from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import { fs } from '../services/fileSystem';
import { collaboration } from '../services/collaboration';

// Configure Monaco to load from a stable CDN
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

interface Props {
    filePath: string | null;
    language: string;
    isMobile?: boolean;
}

export const MonacoEditor: React.FC<Props> = ({ filePath, language, isMobile }) => {
    const [content, setContent] = useState('');
    const editorRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);

    useEffect(() => {
        if (filePath) {
            try {
                const c = fs.readFile(filePath);
                setContent(c);
            } catch (e) {
                setContent('// File not found');
            }
        } else {
            setContent('// Select a file to view content');
        }
    }, [filePath]);

    const handleEditorChange = (value: string | undefined) => {
        if (filePath && value !== undefined) {
            fs.writeFile(filePath, value);
        }
    };

    // Collaborative Cursor Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            if (!editorRef.current || !filePath) return;
            
            const collaborators = collaboration.getCollaborators().filter(c => c.status === 'coding' && c.cursor);
            
            const newDecorations = collaborators.map(user => {
                return {
                    range: new (window as any).monaco.Range(user.cursor!.lineNumber, user.cursor!.column, user.cursor!.lineNumber, user.cursor!.column + 1),
                    options: {
                        className: `remote-cursor-${user.id}`,
                        hoverMessage: { value: `**${user.name}** (${user.role})` },
                        beforeContentClassName: `remote-cursor-label-${user.id}`
                    }
                };
            });

            // Apply decorations
            decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);

            // Inject dynamic CSS for cursors
            collaborators.forEach(user => {
                const styleId = `cursor-style-${user.id}`;
                if (!document.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.innerHTML = `
                        .remote-cursor-${user.id} { border-left: 2px solid ${user.color}; background: ${user.color}20; }
                        .remote-cursor-label-${user.id}::before {
                            content: "${user.name}";
                            position: absolute;
                            top: -18px;
                            left: 0;
                            background: ${user.color};
                            color: black;
                            font-size: 10px;
                            padding: 1px 4px;
                            border-radius: 2px;
                            white-space: nowrap;
                            font-weight: bold;
                        }
                    `;
                    document.head.appendChild(style);
                }
            });

        }, 500);

        return () => clearInterval(interval);
    }, [filePath]);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        (window as any).monaco = monaco;

        // Define theme safely
        monaco.editor.defineTheme('aussie-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6a737d' },
                { token: 'keyword', foreground: '00e599' }, // Mint
                { token: 'string', foreground: 'a5d6ff' },
                { token: 'number', foreground: '79c0ff' },
                { token: 'type', foreground: '00e599' }
            ],
            colors: {
                'editor.background': '#0d1117', 
                'editor.foreground': '#e6edf3',
                'editor.lineHighlightBackground': '#161b22',
                'editorCursor.foreground': '#00e599',
                'editor.selectionBackground': '#00e59930',
                'editorLineNumber.foreground': '#484f58',
                'editorLineNumber.activeForeground': '#00e599'
            }
        });
        
        monaco.editor.setTheme('aussie-dark');
    };

    if (!filePath) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0d1117] text-gray-500">
                <div className="text-center">
                    <div className="text-6xl mb-4 opacity-20 text-aussie-500">⌘</div>
                    <p className="text-xs font-mono text-aussie-500/50">NO_ACTIVE_BUFFER</p>
                </div>
            </div>
        );
    }

    return (
        <Editor
            height="100%"
            language={language}
            value={content}
            theme="aussie-dark"
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
                minimap: { enabled: !isMobile },
                fontSize: isMobile ? 12 : 13,
                fontFamily: "'JetBrains Mono', monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
                wordWrap: 'on',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                contextmenu: !isMobile,
                lineHeight: 21,
                glyphMargin: !isMobile,
                folding: !isMobile,
                lineNumbersMinChars: isMobile ? 3 : 5,
                renderLineHighlight: 'all',
            }}
        />
    );
};
