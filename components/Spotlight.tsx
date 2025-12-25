
import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, File, Command, Bot, Calculator, CloudSun } from 'lucide-react';
import { shell } from '../services/shell';
import { fs } from '../services/fileSystem';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: any) => void;
}

// Simple safe arithmetic evaluator (supports + - * / and parentheses)
function safeEvaluate(expr: string): number | null {
    // Tokenize
    const tokens: string[] = [];
    let numBuf = '';
    for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        if ((ch >= '0' && ch <= '9') || ch === '.') {
            numBuf += ch;
        } else if (ch === ' ' || ch === '\t') {
            if (numBuf) { tokens.push(numBuf); numBuf = ''; }
            continue;
        } else if ('+-*/()'.includes(ch)) {
            if (numBuf) { tokens.push(numBuf); numBuf = ''; }
            tokens.push(ch);
        } else {
            return null; // invalid character
        }
    }
    if (numBuf) tokens.push(numBuf);

    // Shunting-yard to RPN
    const output: string[] = [];
    const ops: string[] = [];
    const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

    for (const t of tokens) {
        if (!isNaN(Number(t))) {
            output.push(t);
        } else if ('+-*/'.includes(t)) {
            while (ops.length > 0 && ops[ops.length - 1] !== '(' && prec[ops[ops.length - 1]] >= prec[t]) {
                output.push(ops.pop() as string);
            }
            ops.push(t);
        } else if (t === '(') {
            ops.push(t);
        } else if (t === ')') {
            while (ops.length > 0 && ops[ops.length - 1] !== '(') {
                output.push(ops.pop() as string);
            }
            if (ops.length === 0) return null; // mismatched
            ops.pop(); // remove '('
        }
    }
    while (ops.length > 0) {
        const op = ops.pop() as string;
        if (op === '(' || op === ')') return null;
        output.push(op);
    }

    // Evaluate RPN
    const stack: number[] = [];
    for (const t of output) {
        if (!isNaN(Number(t))) {
            stack.push(Number(t));
        } else if ('+-*/'.includes(t)) {
            if (stack.length < 2) return null;
            const b = stack.pop() as number;
            const a = stack.pop() as number;
            switch (t) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': stack.push(b === 0 ? NaN : a / b); break;
            }
        } else return null;
    }
    if (stack.length !== 1) return null;
    return stack[0];
}

export const Spotlight: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const searchResults = [];

        // 1. Math Calculation
            // Detect math-like input and evaluate safely
            if (/^[\d\s+\-*/().]+$/.test(query) && /\d/.test(query)) {
                const result = safeEvaluate(query);
                if (result !== null && !isNaN(result)) {
                    searchResults.push({
                        type: 'math',
                        label: `= ${result}`,
                        sub: 'Calculation',
                        action: () => { navigator.clipboard.writeText(String(result)); }
                    });
                }
            }        // 2. Weather
        if ('weather'.includes(query.toLowerCase())) {
            searchResults.push({
                type: 'weather',
                label: 'Sydney, Australia',
                sub: '24°C • Sunny',
                action: () => {}
            });
        }

        // 3. Commands
        if (query.startsWith('>')) {
            const cmd = query.slice(1).trim();
            searchResults.push({ type: 'command', label: `Run: ${cmd}`, action: () => shell.execute(cmd) });
        }

        // 4. Navigation
        if ('dashboard'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Dashboard', action: () => onNavigate('dashboard') });
        if ('editor'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Editor', action: () => onNavigate('code') });
        if ('browser'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Browser', action: () => onNavigate('browser') });
        if ('flow'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'Go to Flow Automator', action: () => onNavigate('flow') });
        if ('settings'.includes(query.toLowerCase())) searchResults.push({ type: 'nav', label: 'System Settings', action: () => onNavigate('settings') });

        // 5. Files
        try {
            const files = fs.readDir('/workspace'); // Simple flat search
            files.forEach(f => {
                if (f.name.toLowerCase().includes(query.toLowerCase())) {
                    searchResults.push({ type: 'file', label: f.name, sub: f.path, action: () => { /* Open logic */ } });
                }
            });
        } catch(e) {}

        setResults(searchResults);
        setSelectedIndex(0);
    }, [query, onNavigate]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % results.length);
            e.preventDefault();
        }
        if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            e.preventDefault();
        }
        if (e.key === 'Enter') {
            if (results[selectedIndex]) {
                results[selectedIndex].action();
                onClose();
            }
            e.preventDefault();
        }
        if (e.key === 'Escape') onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] md:pt-[20vh]"
            onClick={onClose}
            aria-label="Close spotlight search"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="w-[90%] md:w-[600px] bg-[#161b22]/90 backdrop-blur-xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center px-4 py-4 border-b border-gray-700 gap-3">
                    <Search className="w-5 h-5 text-aussie-500" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search apps, files, or calculate..."
                        className="flex-1 bg-transparent outline-none text-lg md:text-xl text-white placeholder-gray-500 font-light"
                        autoFocus
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={results.length > 0}
                        aria-controls="spotlight-results"
                        aria-activedescendant={results.length > 0 ? `result-${selectedIndex}` : undefined}
                        aria-label="Spotlight Search"
                    />
                    <div className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700 hidden md:block" aria-hidden="true">ESC</div>
                </div>

                <div
                    id="spotlight-results"
                    className="max-h-[400px] overflow-y-auto p-2"
                    role="listbox"
                >
                    {results.length === 0 && query && (
                        <div className="p-4 text-center text-gray-500" role="status">No results found</div>
                    )}
                    {results.map((res, idx) => (
                        <div 
                            key={idx}
                            id={`result-${idx}`}
                            onClick={() => { res.action(); onClose(); }}
                            role="option"
                            aria-selected={idx === selectedIndex}
                            className={`
                                flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                                ${idx === selectedIndex ? 'bg-aussie-500 text-[#0f1216]' : 'text-gray-300 hover:bg-gray-800'}
                            `}
                        >
                            <div className={`${idx === selectedIndex ? 'text-[#0f1216]' : 'text-gray-500'}`} aria-hidden="true">
                                {res.type === 'command' && <Terminal className="w-5 h-5" />}
                                {res.type === 'file' && <File className="w-5 h-5" />}
                                {res.type === 'nav' && <Command className="w-5 h-5" />}
                                {res.type === 'math' && <Calculator className="w-5 h-5" />}
                                {res.type === 'weather' && <CloudSun className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold">{res.label}</div>
                                {res.sub && <div className={`text-xs ${idx === selectedIndex ? 'text-black/60' : 'text-gray-500'}`}>{res.sub}</div>}
                            </div>
                            {idx === selectedIndex && <div className="text-[10px] uppercase font-bold opacity-50 hidden md:block" aria-hidden="true">Enter</div>}
                        </div>
                    ))}
                    {!query && (
                        <div className="p-8 text-center text-gray-600">
                            <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Type to search Aussie OS</p>
                            <div className="flex gap-2 justify-center mt-4 flex-wrap">
                                <span className="text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700">24 * 7</span>
                                <span className="text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700">weather</span>
                                <span className="text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700">&gt; echo hi</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
