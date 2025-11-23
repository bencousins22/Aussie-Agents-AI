/**
 * IndexedDB Service
 * High-performance client-side storage for large file systems
 * Replaces localStorage with a more scalable solution
 */

const DB_NAME = 'AussieOS_FileSystem';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export interface FileEntry {
    path: string;
    content: string;
    type: 'file' | 'directory';
    modified: number;
    size: number;
}

class IndexedDBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.initPromise = this.initialize();
    }

    /**
     * Initialize IndexedDB connection
     */
    private async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('modified', 'modified', { unique: false });
                }
            };
        });
    }

    /**
     * Ensure database is initialized
     */
    private async ensureDB(): Promise<IDBDatabase> {
        if (this.initPromise) {
            await this.initPromise;
            this.initPromise = null;
        }

        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return this.db;
    }

    /**
     * Write file to IndexedDB
     */
    async writeFile(path: string, content: string): Promise<void> {
        const db = await this.ensureDB();

        const entry: FileEntry = {
            path,
            content,
            type: 'file',
            modified: Date.now(),
            size: content.length,
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(entry);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Read file from IndexedDB
     */
    async readFile(path: string): Promise<string | null> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(path);

            request.onsuccess = () => {
                const entry = request.result as FileEntry | undefined;
                resolve(entry?.content || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete file from IndexedDB
     */
    async deleteFile(path: string): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(path);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Check if file exists
     */
    async exists(path: string): Promise<boolean> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(path);

            request.onsuccess = () => resolve(!!request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * List all files (or files matching a pattern)
     */
    async listFiles(prefix?: string): Promise<FileEntry[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                let files = request.result as FileEntry[];

                if (prefix) {
                    files = files.filter(f => f.path.startsWith(prefix));
                }

                resolve(files);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get total storage size used
     */
    async getStorageSize(): Promise<number> {
        const files = await this.listFiles();
        return files.reduce((total, file) => total + file.size, 0);
    }

    /**
     * Clear all files
     */
    async clearAll(): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Export all files (for backup/migration)
     */
    async exportAll(): Promise<Record<string, string>> {
        const files = await this.listFiles();
        const exported: Record<string, string> = {};

        files.forEach(file => {
            if (file.type === 'file') {
                exported[file.path] = file.content;
            }
        });

        return exported;
    }

    /**
     * Import files (from backup/migration)
     */
    async importAll(files: Record<string, string>): Promise<void> {
        const db = await this.ensureDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        for (const [path, content] of Object.entries(files)) {
            const entry: FileEntry = {
                path,
                content,
                type: 'file',
                modified: Date.now(),
                size: content.length,
            };

            store.put(entry);
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Migrate from localStorage to IndexedDB
     */
    async migrateFromLocalStorage(key: string = 'aussie_os_fs_v2'): Promise<void> {
        const data = localStorage.getItem(key);
        if (!data) return;

        try {
            const parsed = JSON.parse(data);

            // Recursively flatten the file tree
            const flatten = (node: any, currentPath: string = ''): Record<string, string> => {
                const files: Record<string, string> = {};

                if (node.type === 'file' && node.content) {
                    files[currentPath] = node.content;
                } else if (node.children) {
                    for (const [name, child] of Object.entries(node.children)) {
                        const childPath = currentPath ? `${currentPath}/${name}` : name;
                        Object.assign(files, flatten(child, childPath));
                    }
                }

                return files;
            };

            const files = flatten(parsed);
            await this.importAll(files);

            console.log(`Migrated ${Object.keys(files).length} files from localStorage to IndexedDB`);
        } catch (err) {
            console.error('Migration failed:', err);
        }
    }
}

export const indexedDBService = new IndexedDBService();
