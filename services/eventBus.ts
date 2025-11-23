
import { SystemEvent, SystemEventType } from '../types';

type Listener = (event: SystemEvent) => void;
type TypedListener = (payload: any) => void;

class EventBus {
    private listeners: Set<Listener> = new Set();
    private typedListeners: Map<SystemEventType, Set<TypedListener>> = new Map();

    public subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public emit(type: SystemEventType, payload: any) {
        const event: SystemEvent = { type, payload };

        // Call global listeners
        this.listeners.forEach(l => l(event));

        // Call typed listeners
        const typed = this.typedListeners.get(type);
        if (typed) {
            typed.forEach(l => l(payload));
        }
    }

    /**
     * Register listener for specific event type
     */
    public on(type: SystemEventType, listener: TypedListener): void {
        if (!this.typedListeners.has(type)) {
            this.typedListeners.set(type, new Set());
        }
        this.typedListeners.get(type)!.add(listener);
    }

    /**
     * Unregister listener for specific event type
     */
    public off(type: SystemEventType, listener: TypedListener): void {
        const typed = this.typedListeners.get(type);
        if (typed) {
            typed.delete(listener);
        }
    }

    /**
     * Clear all listeners for a specific type
     */
    public clearType(type: SystemEventType): void {
        this.typedListeners.delete(type);
    }

    /**
     * Clear all listeners
     */
    public clearAll(): void {
        this.listeners.clear();
        this.typedListeners.clear();
    }
}

export const bus = new EventBus();
