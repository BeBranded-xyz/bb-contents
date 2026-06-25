/**
 * Shared utilities, exposed at runtime as `bbContents.utils`.
 *
 * `log` reads the live debug flag from the global `bbContents` (set on window by
 * the bundle entry, the same global the feature modules reference); every other
 * helper is pure.
 */
export default {
    log(...args) {
        if (bbContents.config.debug) {
            console.log('[BB Contents]', ...args);
        }
    },

    // Escapes for safe insertion into HTML, in both text-node AND
    // attribute (value="...") contexts. A plain textContent->innerHTML
    // round-trip does NOT escape " or ', allowing attribute-context breakout.
    sanitize(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    isValidCountryCode(code) {
        if (!code || typeof code !== 'string') return false;
        return /^[a-z]{2}$/i.test(code.trim());
    },

    escapeCss(value) {
        if (!value || typeof value !== 'string') return '';
        return value.replace(/[<>"']/g, match => ({
            '<': '\\3C ', '>': '\\3E ', '"': '\\22 ', "'": '\\27 '
        }[match] || match));
    },

    cleanHtml(html) {
        if (!html || typeof html !== 'string') return '';
        let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
        cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
        return cleaned;
    },

    // Accepts only absolute http(s) URLs. Rejects javascript:, data:, etc.
    isValidUrl(string) {
        try {
            const protocol = new URL(string).protocol;
            return protocol === 'http:' || protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
};
