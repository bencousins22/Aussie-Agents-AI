
import { bus } from './eventBus';

/**
 * Jules VM
 * Provides an isolated execution environment using Web Workers.
 * Supports "Remote" (Worker) and "Local" (Main Thread) execution modes.
 */
export class JulesVM {
    
    public async execute(code: string, mode: 'local' | 'remote' | 'quantum' = 'local'): Promise<any> {
        bus.emit('shell-output', `[JulesVM] Provisioning ${mode.toUpperCase()} environment...`);

        if (mode === 'remote' || mode === 'quantum') {
            return this.executeInWorker(code);
        } else {
            return this.executeLocally(code);
        }
    }

    private executeLocally(code: string): Promise<any> {
        // Simulated local execution (simulating main thread blocking/risk)
        // In a real scenario, this is eval() or new Function() in the main context
        return new Promise((resolve) => {
            try {
                // We wrap in a try/catch block inside the VM logic
                // Note: This has access to global scope in this simplified implementation
                // but in a real VM we'd sandbox it.
                const result = `[Local Execution Success]\nCode analyzed and processed locally.`;
                setTimeout(() => resolve({ status: 'success', output: result }), 500);
            } catch (e: any) {
                resolve({ status: 'error', error: e.message });
            }
        });
    }

    private executeInWorker(code: string): Promise<any> {
        return new Promise((resolve) => {
            // Create a blob for the worker
            const workerCode = `
                self.onmessage = function(e) {
                    const code = e.data;
                    try {
                        // Minimal sandbox
                        const result = "Worker executed successfully"; 
                        // In reality, we would eval(code) here, but for safety in this demo 
                        // we just simulate the processing of the "task".
                        
                        // Simulate heavy computation
                        let k = 0;
                        for(let i=0; i<1000000; i++) { k += i };
                        
                        self.postMessage({ status: 'success', output: 'Computed hash: ' + k + '\\n' + result });
                    } catch(err) {
                        self.postMessage({ status: 'error', error: err.message });
                    }
                }
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            
            worker.onmessage = (e) => {
                resolve(e.data);
                worker.terminate();
            };
            
            worker.onerror = (e) => {
                resolve({ status: 'error', error: e.message });
                worker.terminate();
            };

            worker.postMessage(code);
        });
    }
}

export const julesVM = new JulesVM();
