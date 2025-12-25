/**
 * Logger Service - Production-ready logging with level filtering
 * Replaces console.log/error/warn throughout the app
 */

import * as Sentry from '@sentry/react';
import { bus } from './eventBus';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    meta?: any;
    context?: string;
}

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs = 1000;
    private isDevelopment = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true;

    /**
     * Initialize error tracking service
     */
    init() {
        if (!this.isDevelopment && import.meta.env.VITE_SENTRY_DSN) {
            try {
                Sentry.init({
                    dsn: import.meta.env.VITE_SENTRY_DSN,
                    integrations: [
                        Sentry.browserTracingIntegration(),
                        Sentry.replayIntegration(),
                    ],
                    // Tracing
                    tracesSampleRate: 1.0, // Capture 100% of the transactions
                    // Session Replay
                    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
                    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
                });
                console.log('[Logger] Sentry initialized');
            } catch (error) {
                console.error('[Logger] Failed to initialize Sentry:', error);
            }
        }
    }

    /**
     * Log debug information (development only)
     */
    debug(message: string, meta?: any, context?: string) {
        if (this.isDevelopment) {
            console.log(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, meta || '');
        }
        this.addLog('debug', message, meta, context);
    }

    /**
     * Log informational messages
     */
    info(message: string, meta?: any, context?: string) {
        if (this.isDevelopment) {
            console.info(`[INFO] ${context ? `[${context}] ` : ''}${message}`, meta || '');
        }
        this.addLog('info', message, meta, context);
    }

    /**
     * Log warnings
     */
    warn(message: string, meta?: any, context?: string) {
        console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, meta || '');
        this.addLog('warn', message, meta, context);

        // Emit notification for warnings
        bus.emit('notification', {
            type: 'warning',
            title: 'Warning',
            message: message,
        });
    }

    /**
     * Log errors
     */
    error(message: string, error?: Error | any, context?: string) {
        console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error || '');

        this.addLog('error', message, error, context);

        // Emit notification for errors
        bus.emit('notification', {
            type: 'error',
            title: 'Error',
            message: message,
        });

        // In production, send to error tracking service
        if (!this.isDevelopment) {
            this.sendToErrorTracking(message, error, context);
        }
    }

    /**
     * Add log entry to internal buffer
     */
    private addLog(level: LogLevel, message: string, meta?: any, context?: string) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: Date.now(),
            meta,
            context,
        };

        this.logs.push(entry);

        // Trim logs if exceeding max
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Emit log event for real-time monitoring
        bus.emit('agent-daemon-log', entry); // reuse existing event type for UI log stream
    }

    /**
     * Get recent logs
     */
    getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
        const filtered = level
            ? this.logs.filter(log => log.level === level)
            : this.logs;

        return filtered.slice(-limit);
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Export logs for debugging
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Send to error tracking service (Sentry, etc.)
     */
    private sendToErrorTracking(message: string, error?: Error | any, context?: string) {
        if (this.isDevelopment) return;

        try {
            if (error) {
                Sentry.captureException(error, {
                    tags: { context: context || 'unknown' },
                    extra: { message }
                });
            } else {
                Sentry.captureMessage(message, {
                    level: 'error',
                    tags: { context: context || 'unknown' }
                });
            }
        } catch (e) {
            console.error('[Logger] Failed to send error to Sentry:', e);
        }
    }
}

export const logger = new Logger();
