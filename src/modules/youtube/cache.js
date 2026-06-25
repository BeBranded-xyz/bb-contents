/**
 * YouTube — localStorage cache (24h TTL) and in-flight request registry.
 * The registry is module-level state shared across all youtube elements
 * (the module is a singleton), preserving the original instance-Set behavior.
 */

const activeRequests = new Set();

export const cache = {
    get(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(key);
                return null;
            }
            return data.value;
        } catch (e) {
            return null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
        } catch (e) {
            console.error('[bb-contents] youtube cache set failed:', e);
        }
    }
};

export function isRequestActive(cacheKey) { return activeRequests.has(cacheKey); }
export function markRequestActive(cacheKey) { activeRequests.add(cacheKey); }
export function markRequestComplete(cacheKey) { activeRequests.delete(cacheKey); }

export function cleanCache() {
    try {
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('youtube_')) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key));
                    if (now - cached.timestamp > 24 * 60 * 60 * 1000) localStorage.removeItem(key);
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (e) {
        console.error('[bb-contents] youtube cleanCache failed:', e);
    }
}
