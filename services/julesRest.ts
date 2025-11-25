import { getJulesApiKey, getJulesApiUrl } from './julesKeys';

const JULES_VERSION_ROUTER = 'v1alpha';

const resolveUrl = (suffix: string) => {
    const base = getJulesApiUrl().replace(/\/+$/, '');
    return `${base}/${JULES_VERSION_ROUTER}${suffix}`;
};

const request = async (path: string, init: RequestInit = {}) => {
    const apiKey = getJulesApiKey();
    if (!apiKey) {
        throw new Error('Jules API key missing; set JULES_API_KEY or use Settings.');
    }

    const headers = {
        'X-Goog-Api-Key': apiKey,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
    };

    const res = await fetch(resolveUrl(path), {
        ...init,
        headers,
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(`Jules API ${res.status}: ${text}`);
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

export const julesRest = {
    async status() {
        return request('/status', { method: 'GET' });
    },
    async health() {
        return request('/health', { method: 'GET' });
    },
    async listSources(pageSize = 20) {
        return request(`/sources?pageSize=${pageSize}`, { method: 'GET' });
    },
    async createSession(payload: any) {
        return request('/sessions', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
    async sendMessage(sessionId: string, body: any) {
        return request(`/sessions/${sessionId}:sendMessage`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
    async approvePlan(sessionId: string) {
        return request(`/sessions/${sessionId}:approvePlan`, {
            method: 'POST',
        });
    },
};
