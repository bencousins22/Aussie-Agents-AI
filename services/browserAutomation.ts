
import { bus } from './eventBus';
import { BrowserAction } from '../types';
import { config } from './config';

/**
 * Browser Automation Service
 * Real browser control using either embedded iframe manipulation or Browserless.io API
 */
class BrowserAutomationService {
    private pageContent: string = '';
    private currentUrl: string = '';
    private screenshotCache: Map<string, string> = new Map();

    constructor() {
        // Listen for page updates from BrowserView
        bus.on('browser-page-loaded', (data: any) => {
            this.currentUrl = data.url;
            this.pageContent = data.content || '';
        });
    }

    public setPageContent(content: string) {
        this.pageContent = content;
    }

    /**
     * Navigate to URL - uses real navigation, no artificial delay
     */
    public async goto(url: string): Promise<string> {
        bus.emit('browser-navigate', { url });
        this.currentUrl = url;

        // Wait for actual navigation event
        return new Promise((resolve) => {
            const handler = (data: any) => {
                if (data.url === url) {
                    bus.off('browser-page-loaded', handler);
                    resolve(`Navigated to ${url}`);
                }
            };
            bus.on('browser-page-loaded', handler);

            // Timeout after 30s
            setTimeout(() => {
                bus.off('browser-page-loaded', handler);
                resolve(`Navigation to ${url} timed out`);
            }, 30000);
        });
    }

    /**
     * Click element - instant action, no artificial delay
     */
    public async click(selector: string): Promise<string> {
        bus.emit('browser-action', { type: 'click', selector });

        // Try to execute click on actual DOM if available
        if (typeof document !== 'undefined') {
            try {
                const iframe = document.querySelector('iframe[data-browser-view]') as HTMLIFrameElement;
                if (iframe?.contentDocument) {
                    const element = iframe.contentDocument.querySelector(selector);
                    if (element) {
                        (element as HTMLElement).click();
                        return `Clicked element: ${selector}`;
                    }
                }
            } catch (err) {
                // Cross-origin iframe, fallback to event emission
            }
        }

        return `Click action sent for: ${selector}`;
    }

    /**
     * Type text - instant action, no artificial delay
     */
    public async type(selector: string, text: string): Promise<string> {
        bus.emit('browser-action', { type: 'type', selector, value: text });

        // Try to execute typing on actual DOM if available
        if (typeof document !== 'undefined') {
            try {
                const iframe = document.querySelector('iframe[data-browser-view]') as HTMLIFrameElement;
                if (iframe?.contentDocument) {
                    const element = iframe.contentDocument.querySelector(selector) as HTMLInputElement;
                    if (element) {
                        element.value = text;
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        return `Typed "${text}" into ${selector}`;
                    }
                }
            } catch (err) {
                // Cross-origin iframe, fallback to event emission
            }
        }

        return `Type action sent for: ${selector}`;
    }

    /**
     * Scrape page content - returns actual DOM content
     */
    public async scrape(): Promise<string> {
        // First try to get content from iframe
        if (typeof document !== 'undefined') {
            try {
                const iframe = document.querySelector('iframe[data-browser-view]') as HTMLIFrameElement;
                if (iframe?.contentDocument) {
                    return iframe.contentDocument.documentElement.outerHTML;
                }
            } catch (err) {
                // Cross-origin, use buffered content
            }
        }

        // Fallback to buffered content
        return this.pageContent || "<html><body><h1>No content available</h1></body></html>";
    }

    /**
     * Take screenshot - uses real screenshot API
     */
    public async screenshot(): Promise<string> {
        // Check cache first
        if (this.screenshotCache.has(this.currentUrl)) {
            return this.screenshotCache.get(this.currentUrl)!;
        }

        bus.emit('browser-action', { type: 'screenshot' });

        // Try using Browserless.io API if configured
        const browserlessKey = config.get('browserless');
        if (browserlessKey && this.currentUrl) {
            try {
                const screenshot = await this.captureWithBrowserless(this.currentUrl, browserlessKey);
                this.screenshotCache.set(this.currentUrl, screenshot);
                return screenshot;
            } catch (err) {
                console.error('Browserless screenshot failed:', err);
            }
        }

        // Try using html2canvas for local pages
        if (typeof document !== 'undefined' && this.currentUrl.includes('localhost')) {
            try {
                const screenshot = await this.captureLocalPage();
                if (screenshot) {
                    this.screenshotCache.set(this.currentUrl, screenshot);
                    return screenshot;
                }
            } catch (err) {
                console.error('Local screenshot failed:', err);
            }
        }

        // Return empty canvas as fallback (not a fake screenshot)
        return this.createEmptyScreenshot();
    }

    /**
     * Capture screenshot using Browserless.io API
     */
    private async captureWithBrowserless(url: string, apiKey: string): Promise<string> {
        const response = await fetch(`https://chrome.browserless.io/screenshot?token=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                options: {
                    fullPage: false,
                    type: 'png',
                    quality: 80,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Browserless API error: ${response.statusText}`);
        }

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Capture screenshot of local iframe using modern browser APIs
     */
    private async captureLocalPage(): Promise<string | null> {
        try {
            const iframe = document.querySelector('iframe[data-browser-view]') as HTMLIFrameElement;
            if (!iframe) return null;

            // Use modern browser screenshot API if available
            if ('captureStream' in HTMLVideoElement.prototype) {
                const canvas = document.createElement('canvas');
                canvas.width = iframe.offsetWidth;
                canvas.height = iframe.offsetHeight;
                const ctx = canvas.getContext('2d');

                if (ctx && iframe.contentWindow) {
                    // This requires same-origin or proper CORS headers
                    ctx.drawImage(iframe as any, 0, 0);
                    return canvas.toDataURL('image/png');
                }
            }
        } catch (err) {
            // Cross-origin or other error
            return null;
        }

        return null;
    }

    /**
     * Create a minimal empty screenshot (better than fake data)
     */
    private createEmptyScreenshot(): string {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // Draw a simple placeholder
            ctx.fillStyle = '#14161b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#8b949e';
            ctx.font = '24px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Screenshot not available', canvas.width / 2, canvas.height / 2);
            ctx.fillText(`URL: ${this.currentUrl}`, canvas.width / 2, canvas.height / 2 + 40);
        }

        return canvas.toDataURL('image/png');
    }

    /**
     * Clear screenshot cache
     */
    public clearCache() {
        this.screenshotCache.clear();
    }
}

export const browserAutomation = new BrowserAutomationService();
