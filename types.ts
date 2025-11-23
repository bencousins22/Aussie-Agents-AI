
import React from 'react';

export type Role = 'user' | 'model' | 'system';

export interface Message {
    id: string;
    role: Role;
    text: string;
    timestamp: number;
    attachments?: string[];
    sender?: string; // Name of the specific agent/service
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    lastModified: number;
}

export interface FileNode {
    name: string;
    type: 'file' | 'directory';
    content?: string;
    children?: Map<string, FileNode>;
    lastModified: number;
    path?: string;
}

export interface FileStat {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size: number;
    lastModified: number;
    language?: string;
}

export type BlockType = 'command' | 'output' | 'ai-thought' | 'tool-call' | 'error' | 'system';

export interface TerminalBlock {
    id: string;
    type: BlockType;
    content: string;
    timestamp: number;
    metadata?: any;
}

export type WorkflowPhase = 'idle' | 'exploring' | 'planning' | 'coding' | 'verifying' | 'reviewing' | 'deploying' | 'error';

export interface EditorTab {
    path: string;
    title: string;
    isDirty: boolean;
    language: string;
}

export interface ShellResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export type FlowNodeType = 'trigger' | 'action' | 'decision' | 'end';

export interface FlowNode {
    id: string;
    type: FlowNodeType;
    label: string;
    prompt?: string;
    x: number;
    y: number;
    status?: 'pending' | 'running' | 'success' | 'error';
    result?: any;
}

export interface FlowEdge {
    id: string;
    source: string;
    target: string;
}

export interface FlowGraph {
    id: string;
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
}

export type SystemEventType = 'file-change' | 'shell-output' | 'browser-navigate' | 'browser-action' | 'notification' | 'task-run' | 'task-complete' | 'agent-message' | 'switch-view' | 'open-window' | 'app-installed' | 'app-created' | 'bot-update' | 'agent-state-update' | 'agent-thought' | 'tool-execution';

export interface SystemEvent {
    type: SystemEventType;
    payload: any;
}

export type BrowserAction = 
    | { type: 'click', selector: string }
    | { type: 'type', selector: string, value: string }
    | { type: 'screenshot' };

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: number;
}

export interface ScheduledTask {
    id: string;
    name: string;
    type: 'command' | 'swarm' | 'flow';
    action: string;
    schedule: 'once' | 'hourly' | 'daily' | 'interval';
    intervalSeconds?: number;
    lastRun?: number;
    nextRun: number;
    status: 'active' | 'paused' | 'completed';
    lastResult?: string;
}

export interface GitStatusItem {
    path: string;
    status: 'modified' | 'new' | 'deleted' | 'unmodified';
    staged: boolean;
}

// --- DEPLOYMENT ---
export type DeploymentProvider = 'render' | 'vercel' | 'replit' | 'netlify';

export type DeployStatus = 'pending' | 'build_started' | 'build_success' | 'deploy_started' | 'live' | 'failed' | 'canceled';

export interface DeployLog {
    timestamp: number;
    line: string;
}

export interface DeployState {
    id: string | null;
    provider: DeploymentProvider;
    status: DeployStatus;
    logs: DeployLog[];
    url: string | null;
}

export type MainView = 'dashboard' | 'code' | 'flow' | 'browser' | 'scheduler' | 'github' | 'settings' | 'deploy' | 'projects' | 'marketplace';

export interface ThemeConfig {
    editorFontSize: number;
    editorFontFamily: string;
    editorMinimap: boolean;
    editorWordWrap: boolean;
    editorLineNumbers: boolean;
    editorTheme: string;
}

// --- COLLABORATION ---
export interface Project {
    id: string;
    name: string;
    description: string;
    stack: ('react' | 'node' | 'python' | 'rust' | 'gemini')[];
    lastUpdated: number;
    path: string;
    repoUrl?: string;
}

export interface Collaborator {
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: 'online' | 'coding' | 'idle' | 'reviewing';
    file?: string;
    cursor?: { lineNumber: number; column: number };
    color: string;
}

export interface DesktopItem {
    name: string;
    path: string;
    type: 'app' | 'file' | 'folder';
    appTarget?: MainView;
    windowAppId?: string; // If it opens a window
}

export type WidgetType = 'clock' | 'system' | 'network' | 'weather' | 'note' | 'todo';

export interface Widget {
    id: string;
    type: WidgetType;
    x: number;
    y: number;
    data?: any;
}

// --- WINDOW MANAGER ---
export interface OSWindow {
    id: string;
    title: string;
    appId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isMinimized: boolean;
    isMaximized: boolean;
    zIndex: number;
    props?: any;
}

export interface AppDefinition {
    id: string;
    name: string;
    description: string;
    icon: any;
    category: 'sports' | 'finance' | 'utility' | 'dev';
    version: string;
    author: string;
    component: React.FC<any>;
    installed: boolean;
    price?: string;
    botConfig?: BotAppConfig; 
}

export interface BotAppConfig {
    sport: string;
    title: string;
    themeColor: string;
    accentColor: string;
    dataFeedUrl?: string;
}

// --- BOT MANAGER ---
export interface Trade {
    id: string;
    timestamp: number;
    type: 'buy' | 'sell';
    amount: number;
    asset: string;
    pnl: number;
    status: 'open' | 'won' | 'lost';
}

export interface BotInstance {
    id: string;
    name: string;
    status: 'running' | 'paused' | 'stopped';
    pnl: number;
    roi: number;
    wins: number;
    losses: number;
    activeTrades: number;
    trades: Trade[];
    config: BotAppConfig;
}
