
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { Message, WorkflowPhase } from '../types';
import { fs } from './fileSystem';
import { shell } from './shell';
import { github } from './github';
import { orchestrator } from './orchestrator';
import { bus } from './eventBus';
import { AUSSIE_SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { appRegistry } from './appRegistry';
import { scheduler } from './scheduler';
import { deployment } from './deployment';
import { apm } from './packageManager';
import { browserAutomation } from './browserAutomation';
import { wm } from './windowManager';

const uuid = () => Math.random().toString(36).substring(2, 15);

/**
 * JulesAgent: The Autonomous OS Kernel
 * 
 * Manages the Gemini 3.0 Chat Session, Tool Execution Loop, and Workflow State.
 */
class JulesAgent {
    private ai: GoogleGenAI | null = null;
    private chatSession: Chat | null = null;
    private messageHistory: Message[] = [];
    private isProcessing: boolean = false;
    private phase: WorkflowPhase = 'idle';

    private static instance: JulesAgent;

    private constructor() {
        this.initAI();
    }

    public static getInstance(): JulesAgent {
        if (!JulesAgent.instance) {
            JulesAgent.instance = new JulesAgent();
        }
        return JulesAgent.instance;
    }

    public initAI() {
        if (process.env.API_KEY) {
            this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
    }

    public getMessages() {
        return this.messageHistory;
    }

    public getStatus() {
        return { isProcessing: this.isProcessing, phase: this.phase };
    }

    public clearHistory() {
        this.messageHistory = [];
        this.chatSession = null;
        this.notifyUpdate();
    }

    private notifyUpdate() {
        bus.emit('agent-state-update', { 
            messages: this.messageHistory, 
            isProcessing: this.isProcessing, 
            phase: this.phase 
        });
    }

    private setPhase(phase: WorkflowPhase) {
        this.phase = phase;
        this.notifyUpdate();
    }

    /**
     * Core Input Handler
     */
    public async processInput(text: string) {
        if (!process.env.API_KEY) {
             this.addMessage('system', 'Error: API_KEY not found. Please check your environment variables.');
             return;
        }

        if (!this.ai) {
            this.initAI();
        }

        this.isProcessing = true;
        this.setPhase('planning');
        this.addMessage('user', text);

        try {
            if (!this.chatSession) {
                // Only create session once if possible, but ensure AI is ready
                if (!this.ai) this.initAI();
                
                if (this.ai) {
                    this.chatSession = this.ai.chats.create({
                        model: 'gemini-3-pro-preview',
                        config: { 
                            systemInstruction: AUSSIE_SYSTEM_INSTRUCTION, 
                            tools: [{ functionDeclarations: TOOLS }] 
                        },
                    });
                } else {
                    throw new Error("Failed to initialize AI client.");
                }
            }

            let response: GenerateContentResponse = await this.chatSession.sendMessage({ message: text });
            
            // The Execution Loop (Think-Act-Observe)
            // Loop limit to prevent infinite tool loops
            let loopCount = 0;
            const MAX_LOOPS = 10;

            while (this.isProcessing && loopCount < MAX_LOOPS) {
                loopCount++;
                const candidates = response.candidates;
                if (!candidates || !candidates.length) break;

                const content = candidates[0].content;
                const parts = content.parts;
                
                // 1. Handle Text (Thoughts/Responses)
                const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n');
                if (textParts) {
                    this.addMessage('model', textParts, 'Jules');
                    bus.emit('agent-thought', { text: textParts });
                }

                // 2. Handle Tool Calls
                const calls = parts.filter((p: any) => p.functionCall);
                if (calls.length > 0) {
                    this.setPhase('coding');
                    const responses = [];
                    
                    for (const callPart of calls) {
                        const call = callPart.functionCall;
                        if (!call) continue;

                        // Execute Tool
                        const result = await this.executeTool(call.name, call.args);
                        
                        // Check for explicit exit
                        if (call.name === 'idle') {
                            this.isProcessing = false;
                        }

                        responses.push({
                            functionResponse: {
                                name: call.name,
                                response: { result },
                                id: call.id 
                            }
                        });
                    }

                    // Loop back if still processing and we have tool outputs
                    if (this.isProcessing && responses.length > 0) {
                        response = await this.chatSession.sendMessage({ message: responses });
                    } else {
                        break;
                    }
                } else {
                    // No tool calls implies turn completion
                    this.isProcessing = false;
                }
            }

        } catch (error: any) {
            console.error(error);
            this.addMessage('system', `System Error: ${error.message}`);
        } finally {
            this.isProcessing = false;
            this.setPhase('idle');
        }
    }

    /**
     * Tool Execution Engine
     */
    private async executeTool(name: string, args: any): Promise<any> {
        bus.emit('tool-execution', { name, args });
        
        try {
            switch (name) {
                case 'message_notify_user':
                    this.addMessage('model', args.text, 'Jules');
                    return { status: "ok" };
                
                case 'switch_view':
                    bus.emit('switch-view', { view: args.view });
                    return { status: "success" };

                case 'create_bot_app':
                    const app = appRegistry.createBotApp(args);
                    
                    // Create Desktop Shortcut - Use app-window: protocol to ensure it opens as window
                    const shortcutPath = `/home/aussie/Desktop/${app.name}.lnk`;
                    fs.writeFile(shortcutPath, `app-window:${app.id}`);

                    // Open Window Immediately (Desktop OS behavior)
                    wm.openWindow(app.id, app.name);
                    
                    // Switch to Dashboard to see it
                    bus.emit('switch-view', { view: 'dashboard' });

                    return { 
                        status: "created", 
                        appId: app.id, 
                        message: `App "${app.name}" created, installed to Desktop, and launched.` 
                    };

                case 'deploy_app':
                    const deployId = await deployment.deploy(args.provider || 'render', args.repoUrl);
                    this.setPhase('deploying');
                    return { status: "initiated", deploymentId: deployId };

                case 'file_read': return { content: fs.readFile(args.file) };
                case 'file_write': 
                    fs.writeFile(args.file, args.content, args.append);
                    return { status: "success" };
                case 'file_list': 
                    return { files: fs.readDir(args.path).map(f => f.name) };
                
                case 'shell_exec':
                    return await shell.execute(args.command);

                case 'apm_install':
                    return { status: "installed", message: await apm.install(args.package) };

                case 'github_ops':
                    return await github.processOperation(args.operation, args.data);

                case 'media_gen':
                    return await orchestrator.generateMedia(args.service, args.prompt, args.params);
                
                case 'browser_navigate': return { result: await browserAutomation.goto(args.url) };
                case 'browser_click': return { result: await browserAutomation.click(args.selector) };
                case 'browser_scrape': return { content: await browserAutomation.scrape() };
                case 'browser_screenshot': return { result: await browserAutomation.screenshot() };

                case 'schedule_task':
                    scheduler.addTask({ 
                        name: args.name, 
                        type: args.type, 
                        action: args.action, 
                        schedule: args.interval ? 'interval' : 'once', 
                        intervalSeconds: args.interval, 
                        nextRun: Date.now() 
                    });
                    return { status: "scheduled" };

                case 'idle':
                    return { status: "idle" };

                default:
                    return { error: `Tool ${name} not found.` };
            }
        } catch (e: any) {
            return { error: e.message };
        }
    }

    private addMessage(role: Message['role'], text: string, sender?: string) {
        const msg: Message = {
            id: uuid(),
            role,
            text,
            timestamp: Date.now(),
            sender
        };
        this.messageHistory = [...this.messageHistory, msg];
        this.notifyUpdate();
    }
}

export const julesAgent = JulesAgent.getInstance();

/**
 * JulesOrchestrator: Flow Graph Execution
 */
export class JulesOrchestrator {
    private graph: any;
    private updateNodeCallback: any;
    private logCallback: any;

    constructor(graph: any, onUpdateNode: any, onLog: any) {
        this.graph = graph;
        this.updateNodeCallback = onUpdateNode;
        this.logCallback = onLog;
    }
    
    public async run() {
        if (!process.env.API_KEY) {
            this.logCallback("Error: No API Key");
            return;
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chat = ai.chats.create({
            model: 'gemini-3-pro-preview',
            config: { systemInstruction: AUSSIE_SYSTEM_INSTRUCTION, tools: [{ functionDeclarations: TOOLS }] }
        });
        
        this.logCallback("Starting Flow...");
        const startNode = this.graph.nodes.find((n: any) => n.type === 'trigger');
        if(startNode) await this.traverse(startNode, "Flow Start", chat);
    }

    private async traverse(node: any, context: string, chat: Chat) {
        this.updateNodeCallback(node.id, { status: 'running' });
        try {
            let result = "";
            if(node.type !== 'trigger') {
                const prompt = `Context: ${context}. Task: ${node.prompt}. Execute this using available tools.`;
                const response = await chat.sendMessage({ message: prompt });
                const parts = response.candidates?.[0]?.content?.parts || [];
                const text = parts.filter((p:any)=>p.text).map((p:any)=>p.text).join('');
                result = text || "Executed.";
            }
            this.updateNodeCallback(node.id, { status: 'success', result });
            this.logCallback(`Node ${node.label} complete.`);
            
            const edges = this.graph.edges.filter((e: any) => e.source === node.id);
            for(const edge of edges) {
                const next = this.graph.nodes.find((n: any) => n.id === edge.target);
                if(next) await this.traverse(next, result, chat);
            }

        } catch(e: any) {
            this.updateNodeCallback(node.id, { status: 'error', result: e.message });
            this.logCallback(`Error in ${node.label}: ${e.message}`);
        }
    }
}
