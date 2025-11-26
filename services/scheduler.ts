
import { ScheduledTask } from '../types';
import { fs } from './fileSystem';
import { shell } from './shell';
import { bus } from './eventBus';
import { notify } from './notification';
import { julesRest } from './julesRest';

const TASKS_FILE = '/workspace/system/schedule.json';

class SchedulerService {
    private tasks: ScheduledTask[] = [];
    private intervalId: any = null;

    constructor() {
        this.loadTasks();
    }

    private loadTasks() {
        try {
            if (fs.exists(TASKS_FILE)) {
                const content = fs.readFile(TASKS_FILE);
                this.tasks = JSON.parse(content);
            } else {
                // Ensure directory exists
                if (!fs.exists('/workspace/system')) fs.mkdir('/workspace/system');
            }
        } catch (e) {
            console.error("Scheduler load error", e);
            this.tasks = [];
        }
    }

    private saveTasks() {
        try {
            if (!fs.exists('/workspace/system')) fs.mkdir('/workspace/system');
            fs.writeFile(TASKS_FILE, JSON.stringify(this.tasks, null, 2));
        } catch (e) {
            console.error("Scheduler save error", e);
        }
    }

    public start() {
        if (this.intervalId) return;
        console.log("Scheduler started");
        // Check every second
        this.intervalId = setInterval(() => this.tick(), 1000);
    }

    public stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
    }

    public addTask(task: Omit<ScheduledTask, 'id' | 'lastRun' | 'status'>) {
        const newTask: ScheduledTask = {
            id: Math.random().toString(36).substr(2, 9),
            status: 'active',
            ...task
        };
        this.tasks.push(newTask);
        this.saveTasks();
        notify.success("Task Scheduled", `Task '${task.name}' added.`);
        return newTask;
    }

    public removeTask(id: string) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    }

    public getTasks() {
        return this.tasks;
    }

    private async tick() {
        const now = Date.now();
        
        for (const task of this.tasks) {
            if (task.status === 'active' && task.nextRun <= now) {
                await this.executeTask(task);
            }
        }
    }

    private async executeTask(task: ScheduledTask) {
        bus.emit('task-run', { taskId: task.id, name: task.name });
        notify.info("Scheduler", `Running task: ${task.name}`);

        let output = "";
        try {
            if (task.type === 'command') {
                const res = await shell.execute(task.action);
                output = res.exitCode === 0 ? "Success" : `Failed: ${res.stderr}`;
            } else if (task.type === 'swarm') {
                const res = await shell.execute(`gemini-flow hive-mind spawn --objective "${task.action}"`);
                output = res.stdout;
            } else if (task.type === 'flow') {
                // Execute flow by ID using the shell gemini-flow command
                let flowId = task.action;
                let flowOptions: { roles?: string[] } | null = null;
                if (task.action.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(task.action);
                        if (parsed.flowId) {
                            flowId = parsed.flowId;
                            flowOptions = parsed;
                        }
                    } catch {
                        // Continue with raw string if parsing fails
                    }
                }
                const roleArgs = flowOptions?.roles ? ` --roles ${flowOptions.roles.join(',')}` : '';
                const res = await shell.execute(`gemini-flow run-flow ${flowId}${roleArgs}`);
                output = res.exitCode === 0 ? res.stdout : `Failed: ${res.stderr}`;
            } else if (task.type === 'jules') {

                try {
                    const payload = task.action ? JSON.parse(task.action) : {};
                    const session = await julesRest.createSession(payload);
                    output = `Jules session ${session.id} created`;
                    if (payload.autoApprove !== false) {
                        await julesRest.approvePlan(session.id);
                        output += ' (plan approved)';
                    }
                } catch (error: any) {
                    output = `Jules error: ${error.message}`;
                }
            }
        } catch (e: any) {
            output = `Error: ${e.message}`;
        }

        // Update Task State
        const now = Date.now();
        task.lastRun = now;
        task.lastResult = output.substring(0, 100) + (output.length > 100 ? '...' : '');

        // Schedule Next Run
        if (task.schedule === 'once') {
            task.status = 'completed';
        } else if (task.schedule === 'interval' && task.intervalSeconds) {
            task.nextRun = now + (task.intervalSeconds * 1000);
        } else if (task.schedule === 'hourly') {
            task.nextRun = now + (60 * 60 * 1000);
        } else if (task.schedule === 'daily') {
            task.nextRun = now + (24 * 60 * 60 * 1000);
        } else if (task.schedule === 'weekly') {
            task.nextRun = now + (7 * 24 * 60 * 60 * 1000);
        } else if (task.schedule === 'monthly') {
            const d = new Date(now);
            d.setMonth(d.getMonth() + 1);
            task.nextRun = d.getTime();
        }

        this.saveTasks();
        bus.emit('task-complete', { taskId: task.id, result: output });
    }
}

export const scheduler = new SchedulerService();
