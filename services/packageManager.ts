
/**
 * APM: Aussie Package Manager
 * Simulates installing packages by mapping them to ESM.sh URLs
 */

class PackageManagerService {
    private installedPackages: Map<string, string> = new Map();

    constructor() {
        // Pre-installed standard library mocks could go here
    }

    public async install(packageName: string): Promise<string> {
        // In a real browser environment, we can't download the NPM tarball and unzip it easily without WebContainers.
        // Instead, we will use the ES Module standard.
        // When `require('lodash')` is called, we will return an object that dynamically imports from esm.sh.
        
        const url = `https://esm.sh/${packageName}`;
        
        // Verify it exists by doing a HEAD request
        try {
            const res = await fetch(url, { method: 'HEAD' });
            if (!res.ok) throw new Error(`Package not found: ${res.statusText}`);
            
            this.installedPackages.set(packageName, url);
            return `Package ${packageName} installed from ${url}`;
        } catch (e: any) {
            throw new Error(`Failed to install ${packageName}: ${e.message}`);
        }
    }

    public getPackageUrl(name: string): string | undefined {
        return this.installedPackages.get(name);
    }

    public getInstalled(): string[] {
        return Array.from(this.installedPackages.keys());
    }
}

export const apm = new PackageManagerService();
