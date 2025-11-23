
import { useState, useEffect } from 'react';
import { Message, TerminalBlock, WorkflowPhase, EditorTab } from '../types';
import { julesAgent } from './jules';
import { bus } from './eventBus';
import { fs } from './fileSystem';
import { shell } from './shell';
import { audioUtils } from './audio';
import { GoogleGenAI, Modality } from '@google/genai';

const uuid = () => Math.random().toString(36).substring(2, 15);

export const useAgent = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [terminalBlocks, setTerminalBlocks] = useState<TerminalBlock[]>([]);
    const [workflowPhase, setWorkflowPhase] = useState<WorkflowPhase>('idle');
    const [editorTabs, setEditorTabs] = useState<EditorTab[]>([]);
    const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<{ path: string; type: 'video' | 'image' | 'audio' } | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Sync with JulesAgent
    useEffect(() => {
        const updateState = (data: any) => {
            setMessages(data.messages);
            setIsProcessing(data.isProcessing);
            setWorkflowPhase(data.phase);
        };

        // Initial state
        const status = julesAgent.getStatus();
        setMessages(julesAgent.getMessages());
        setIsProcessing(status.isProcessing);
        setWorkflowPhase(status.phase);

        const unsubState = bus.subscribe(e => {
            if (e.type === 'agent-state-update') {
                updateState(e.payload);
            }
            if (e.type === 'agent-thought') {
                addBlock('ai-thought', e.payload.text);
            }
            if (e.type === 'tool-execution') {
                addBlock('tool-call', e.payload.name, e.payload.args);
            }
            if (e.type === 'shell-output') {
                addBlock('output', e.payload);
            }
        });

        return () => unsubState();
    }, []);

    const addBlock = (type: TerminalBlock['type'], content: string, metadata?: any) => {
        setTerminalBlocks(prev => [...prev, {
            id: uuid(),
            timestamp: Date.now(),
            type,
            content,
            metadata
        }]);
    };

    const openFile = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase();
        if (['mp4', 'webm', 'mov'].includes(ext || '')) { setMediaFile({ path, type: 'video' }); return; }
        if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) { setMediaFile({ path, type: 'image' }); return; }
        if (['mp3', 'wav', 'ogg'].includes(ext || '')) { setMediaFile({ path, type: 'audio' }); return; }

        try {
            fs.readFile(path);
            const name = path.split('/').pop() || 'file';
            setEditorTabs(prev => {
                if (prev.find(t => t.path === path)) return prev;
                const langMap: any = { ts: 'typescript', js: 'javascript', py: 'python', md: 'markdown', json: 'json' };
                return [...prev, { path, title: name, isDirty: false, language: langMap[ext || ''] || 'plaintext' }];
            });
            setActiveTabPath(path);
        } catch (e) { addBlock('error', `Cannot open file: ${path}`); }
    };

    const speakText = async (text: string) => {
        if (!process.env.API_KEY || !text || !isTtsEnabled) return;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
            });
            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (audioData) await audioUtils.playBase64(audioData);
        } catch (error) { console.error("TTS Error", error); }
    };

    // Watch messages for TTS
    useEffect(() => {
        if (messages.length > 0 && isTtsEnabled) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'model' && lastMsg.sender === 'Jules') {
                speakText(lastMsg.text);
            }
        }
    }, [messages.length, isTtsEnabled]);

    const processUserMessage = async (text: string) => {
        await julesAgent.processInput(text);
    };

    const runShellCommand = async (cmd: string) => {
        addBlock('command', cmd);
        const res = await shell.execute(cmd);
        if (res.stdout) addBlock('output', res.stdout);
        if (res.stderr) addBlock('error', res.stderr);
    };

    const toggleLive = () => setIsLive(!isLive);
    const toggleMute = () => setIsMuted(!isMuted);
    const toggleTts = () => setIsTtsEnabled(!isTtsEnabled);
    const clearMessages = () => julesAgent.clearHistory();
    const handleFileUpload = (file: File) => { 
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const path = `/workspace/${file.name}`;
            fs.writeFile(path, content);
            addBlock('output', `Uploaded ${file.name} to /workspace`);
        };
        reader.readAsText(file);
    };

    return {
        messages, isProcessing, workflowPhase, terminalBlocks, editorTabs, activeTabPath, setActiveTabPath, 
        openFile, mediaFile, setMediaFile, processUserMessage, runShellCommand, 
        isLive, isMuted, isTtsEnabled, toggleLive, toggleMute, toggleTts, clearMessages, handleFileUpload
    };
};
