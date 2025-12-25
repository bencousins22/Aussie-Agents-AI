/**
 * React 19 Error Boundary with Recovery
 * Catches errors in component tree and provides recovery UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import { logger } from '../services/logger';

interface Props {
    children: ReactNode;
    fallbackType?: 'full' | 'inline' | 'minimal';
    onReset?: () => void;
    context?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    resetCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        resetCount: 0,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const context = this.props.context || 'ErrorBoundary';

        // Pass both error and errorInfo to logger.
        // logger.error handles environment checks (dev vs prod) internally.
        logger.error(`Component error caught in ${context}`, { error, errorInfo }, context);

        this.setState({
            error,
            errorInfo,
        });
    }

    private handleReset = () => {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            resetCount: prevState.resetCount + 1,
        }));

        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    private renderFullScreen() {
        const { error, errorInfo } = this.state;

        return (
            <div className="fixed inset-0 bg-gradient-to-br from-red-900/20 via-[#0d1117] to-[#0d1117] flex items-center justify-center p-6 z-[9999]">
                <div className="max-w-2xl w-full bg-[#161b22] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500/20 to-transparent p-6 border-b border-red-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">Something went wrong</h1>
                                <p className="text-gray-400 text-sm">
                                    {this.props.context ? `Error in ${this.props.context}` : 'An unexpected error occurred'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Details */}
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Error Message</h3>
                                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-sm">
                                    {error.message}
                                </div>
                            </div>
                        )}

                        {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && errorInfo && (
                            <details className="space-y-2">
                                <summary className="text-sm font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                    Stack Trace (Development Only)
                                </summary>
                                <div className="mt-2 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-gray-400 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                                    <pre>{errorInfo.componentStack}</pre>
                                </div>
                            </details>
                        )}

                        {this.state.resetCount > 0 && (
                            <div className="px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                                ⚠️ This component has crashed {this.state.resetCount} time(s). Consider reloading the page.
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-black/30 border-t border-white/10 flex flex-wrap gap-3">
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-2.5 rounded-lg bg-aussie-500 hover:bg-aussie-600 text-black font-semibold flex items-center gap-2 transition-all active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>

                        <button
                            onClick={this.handleReload}
                            className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center gap-2 transition-all active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Page
                        </button>

                        <button
                            onClick={this.handleGoHome}
                            className="px-6 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </button>

                        {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                            <button
                                onClick={() => {
                                    const report = {
                                        error: error?.message,
                                        stack: error?.stack,
                                        componentStack: errorInfo?.componentStack,
                                        context: this.props.context,
                                    };
                                    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
                                    alert('Error report copied to clipboard');
                                }}
                                className="ml-auto px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-sm flex items-center gap-2 transition-all"
                            >
                                <FileText className="w-4 h-4" />
                                Copy Error Report
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    private renderInline() {
        return (
            <div className="w-full p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">Component Error</h3>
                        <p className="text-red-300 text-sm mb-4">
                            {this.state.error?.message || 'This component encountered an error'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="px-4 py-2 rounded-lg bg-aussie-500 hover:bg-aussie-600 text-black font-semibold text-sm flex items-center gap-2 transition-all active:scale-95"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    private renderMinimal() {
        return (
            <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-300 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Failed to load</span>
                </div>
                <button
                    onClick={this.handleReset}
                    className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-all"
                >
                    Retry
                </button>
            </div>
        );
    }

    public render() {
        if (this.state.hasError) {
            const fallbackType = this.props.fallbackType || 'full';

            switch (fallbackType) {
                case 'inline':
                    return this.renderInline();
                case 'minimal':
                    return this.renderMinimal();
                case 'full':
                default:
                    return this.renderFullScreen();
            }
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    options?: {
        fallbackType?: Props['fallbackType'];
        context?: string;
        onReset?: () => void;
    }
) {
    return function WithErrorBoundaryComponent(props: P) {
        return (
            <ErrorBoundary
                fallbackType={options?.fallbackType}
                context={options?.context || Component.displayName || Component.name}
                onReset={options?.onReset}
            >
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
