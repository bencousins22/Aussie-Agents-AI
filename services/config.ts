/**
 * Configuration Service
 * Centralized API key and configuration management
 * Supports both environment variables (build-time) and localStorage (runtime)
 */

export type ConfigKey =
  | 'gemini'
  | 'github'
  | 'render'
  | 'vercel'
  | 'netlify'
  | 'replit'
  | 'browserless';

class ConfigService {
  private storageKeys: Record<ConfigKey, string> = {
    gemini: 'aussie_os_api_key_gemini',
    github: 'aussie_os_api_key_github',
    render: 'aussie_os_api_key_render',
    vercel: 'aussie_os_api_key_vercel',
    netlify: 'aussie_os_api_key_netlify',
    replit: 'aussie_os_api_key_replit',
    browserless: 'aussie_os_api_key_browserless',
  };

  private envKeys: Record<ConfigKey, string> = {
    gemini: 'GEMINI_API_KEY',
    github: 'GITHUB_PAT',
    render: 'RENDER_API_KEY',
    vercel: 'VERCEL_API_KEY',
    netlify: 'NETLIFY_API_KEY',
    replit: 'REPLIT_API_KEY',
    browserless: 'BROWSERLESS_API_KEY',
  };

  /**
   * Get API key - priority: localStorage > environment variable
   */
  get(key: ConfigKey): string | null {
    // First check localStorage (user-configured at runtime)
    const stored = localStorage.getItem(this.storageKeys[key]);
    if (stored) return stored;

    // Fallback to environment variable (build-time)
    const envKey = this.envKeys[key];
    const envValue = process.env[envKey];

    return envValue || null;
  }

  /**
   * Set API key in localStorage
   */
  set(key: ConfigKey, value: string): void {
    localStorage.setItem(this.storageKeys[key], value);
  }

  /**
   * Remove API key from localStorage
   */
  remove(key: ConfigKey): void {
    localStorage.removeItem(this.storageKeys[key]);
  }

  /**
   * Check if API key is configured
   */
  has(key: ConfigKey): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get all configured keys (for settings UI)
   */
  getAll(): Record<ConfigKey, string | null> {
    return {
      gemini: this.get('gemini'),
      github: this.get('github'),
      render: this.get('render'),
      vercel: this.get('vercel'),
      netlify: this.get('netlify'),
      replit: this.get('replit'),
      browserless: this.get('browserless'),
    };
  }

  /**
   * Validate API key format (basic check)
   */
  validate(key: ConfigKey, value: string): boolean {
    if (!value || value.trim() === '') return false;

    // Basic validation patterns
    const patterns: Partial<Record<ConfigKey, RegExp>> = {
      gemini: /^AIza[0-9A-Za-z_-]{35}$/,
      github: /^gh[ps]_[a-zA-Z0-9]{36,}$/,
      render: /^rnd_[a-zA-Z0-9]{20,}$/,
    };

    const pattern = patterns[key];
    if (pattern) {
      return pattern.test(value);
    }

    // If no pattern, accept any non-empty string
    return true;
  }

  /**
   * Clear all stored API keys
   */
  clearAll(): void {
    Object.keys(this.storageKeys).forEach(key => {
      this.remove(key as ConfigKey);
    });
  }
}

export const config = new ConfigService();
