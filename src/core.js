'use strict';

import marquee from './modules/marquee.js';
import share from './modules/share.js';
import currentYear from './modules/currentYear.js';
import readingTime from './modules/readingTime.js';
import countrySelect from './modules/countrySelect.js';
import favicon from './modules/favicon.js';
import youtube from './modules/youtube.js';
import utils from './internal/utils.js';
import optionRules from './internal/option-rules.js';

const BB_CONTENTS_VERSION = '1.1.22-test.1';

// rAF fallback for WebViews / JSDOM / SSR hydration edge cases
const _schedule = (typeof window !== 'undefined' && window.requestAnimationFrame)
    ? window.requestAnimationFrame.bind(window)
    : (cb) => setTimeout(cb, 16);

// Guard against double-loading (silent bail, matches original behaviour)
if (typeof window !== 'undefined') {
    if (!window._bbContentsConfig) window._bbContentsConfig = {};
    if (window.bbContents || window._bbContentsVersionDisplayed || window._bbContentsInitialized) {
        // Already loaded — skip the rest of this module
        // esbuild top-level: we cannot `return`, so we use a flag checked below
        window._bbContentsSkipInit = true;
    }
    window._bbContentsVersionDisplayed = true;
    window._bbContentsInitialized = true;
}

if (typeof window === 'undefined' || !window._bbContentsSkipInit) {
    console.log('bb-contents | v' + BB_CONTENTS_VERSION);
}

const config = {
    version: BB_CONTENTS_VERSION,
    debug: false,
    prefix: 'bb-',
    youtubeEndpoint: null,
    i18n: {
        copied: 'Lien copié !',
        selectCountry: { fr: 'Sélectionner un pays', en: 'Select country' },
        searchCountry: { fr: 'Rechercher un pays...', en: 'Search country...' },
        noCountryFound: { fr: 'Aucun pays trouvé', en: 'No country found' }
    }
};

// Pick up YouTube endpoint set before script load
if (typeof window !== 'undefined') {
    if (window._bbContentsConfig && window._bbContentsConfig.youtubeEndpoint) {
        config.youtubeEndpoint = window._bbContentsConfig.youtubeEndpoint;
    }
}

const bbContents = {
    config,

    modules: { marquee, share, currentYear, readingTime, countrySelect, favicon, youtube },

    // Attribute → module name mapping. Single source of truth.
    attrMap: {
        'marquee':        'marquee',
        'share':          'share',
        'current-year':   'currentYear',
        'reading-time':   'readingTime',
        'country-select': 'countrySelect',
        'favicon':        'favicon',
        'youtube-channel': 'youtube',
    },

    // Internal attribute suffixes that must never trigger module init
    _internalSuffixes: ['processed', 'initialized'],

    // Option → root rules for dev-mode validation
    _optionRules: optionRules,

    // Cached compound CSS selector (compiled once in init)
    _scanSelector: null,

    // Observer state
    _observer: null,
    _reinitScheduled: false,
    _pending: null, // Map<moduleName, Set<Element>>

    // ─── Utilities ────────────────────────────────────────────────────────────

    utils,

    // ─── Helpers ──────────────────────────────────────────────────────────────

    // Accepts both 'marquee' and 'bb-marquee'
    _attrSelector(name) {
        const bare = name.replace(/^bb-/, '');
        return `[bb-${bare}], [data-bb-${bare}]`;
    },

    _getAttr(element, name) {
        const bare = name.replace(/^bb-/, '');
        return element.getAttribute(`bb-${bare}`) || element.getAttribute(`data-bb-${bare}`);
    },

    // ─── Module detection ─────────────────────────────────────────────────────

    _buildScanSelector() {
        return Object.keys(this.attrMap).flatMap(key => [
            `[bb-${key}]`, `[data-bb-${key}]`
        ]).join(',');
    },

    _resolveModule(attrName) {
        const name = attrName.replace(/^data-/, '').replace(/^bb-/, '');
        // Ignore internal state attributes — must not trigger module init
        if (this._internalSuffixes.some(s => name.endsWith('-' + s))) return null;
        // Direct match
        if (this.attrMap[name]) return this.attrMap[name];
        // Longest-prefix-match: a-b-c → a-b → a
        const parts = name.split('-');
        for (let len = parts.length - 1; len > 0; len--) {
            const candidate = parts.slice(0, len).join('-');
            if (this.attrMap[candidate]) return this.attrMap[candidate];
        }
        return null;
    },

    _detectPresentModules(scope) {
        const found = new Set();
        const collect = (el) => {
            for (const attr of el.attributes) {
                const mod = this._resolveModule(attr.name);
                if (mod) found.add(mod);
            }
        };
        // querySelectorAll does not return scope itself
        if (scope.matches && scope.matches(this._scanSelector)) collect(scope);
        scope.querySelectorAll(this._scanSelector).forEach(collect);
        return found;
    },

    // ─── Debug guard ──────────────────────────────────────────────────────────

    _checkOptionRules(scope) {
        if (!this.config.debug) return;
        this._optionRules.forEach(({ option, root }) => {
            scope.querySelectorAll(`[bb-${option}], [data-bb-${option}]`).forEach(el => {
                if (!el.hasAttribute(`bb-${root}`) && !el.hasAttribute(`data-bb-${root}`)) {
                    console.warn(`[bb-contents] bb-${option} found without bb-${root} on`, el);
                }
            });
        });
    },

    // ─── Init ─────────────────────────────────────────────────────────────────

    init() {
        this.utils.log('Initialisation v' + this.config.version);

        // Compile scan selector once and cache
        if (!this._scanSelector) {
            this._scanSelector = this._buildScanSelector();
        }

        const scope = document.querySelector('[data-bb-scope]') || document;
        const needed = this._detectPresentModules(scope);

        needed.forEach(name => {
            const mod = this.modules[name];
            if (!mod) return;
            try { mod.init(scope); }
            catch (e) { console.error('[bb-contents]', name, 'init failed:', e); }
        });

        this._checkOptionRules(scope);
        this.setupObserver();
    },

    reinit() {
        this.init();
    },

    checkYouTubeConfig() {
        if (this.config.youtubeEndpoint) return true;
        if (window._bbContentsConfig && window._bbContentsConfig.youtubeEndpoint) {
            this.config.youtubeEndpoint = window._bbContentsConfig.youtubeEndpoint;
            return true;
        }
        return false;
    },

    // ─── Observer ─────────────────────────────────────────────────────────────

    setupObserver() {
        if (this._observer) {
            this._observer.disconnect();
        }

        this._pending = new Map(); // Map<moduleName, Set<Element>>

        this._observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    const process = (el) => {
                        for (const attr of el.attributes) {
                            const mod = this._resolveModule(attr.name);
                            if (!mod) continue;
                            if (!this._pending.has(mod)) this._pending.set(mod, new Set());
                            this._pending.get(mod).add(node); // root = added subtree root
                        }
                    };
                    if (node.matches && node.matches(this._scanSelector)) process(node);
                    node.querySelectorAll(this._scanSelector).forEach(process);
                });
            });

            if (this._pending.size && !this._reinitScheduled) {
                this._reinitScheduled = true;
                _schedule(() => {
                    const toFlush = this._pending;
                    this._pending = new Map(); // swap before iterating
                    this._reinitScheduled = false;
                    toFlush.forEach((roots, name) => {
                        roots.forEach(root => {
                            try { this.modules[name].init(root); }
                            catch (e) { console.error('[bb-contents]', name, e); }
                        });
                    });
                    this._checkOptionRules(document.querySelector('[data-bb-scope]') || document);
                });
            }
        });

        this._observer.observe(document.body, { childList: true, subtree: true });
        this.utils.log('MutationObserver actif');
    }
};

// ─── Expose globally ──────────────────────────────────────────────────────────

if (typeof window !== 'undefined' && !window._bbContentsSkipInit) {
    window.bbContents = bbContents;

    window.configureYouTube = function(endpoint) {
        if (!endpoint || typeof endpoint !== 'string') {
            console.error('bb-contents: Endpoint YouTube invalide');
            return;
        }
        if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
            console.error('bb-contents: Endpoint YouTube doit être une URL valide (http:// ou https://)');
            return;
        }
        bbContents.config.youtubeEndpoint = endpoint;
        bbContents.reinit();
    };
}

// ─── Auto-init ────────────────────────────────────────────────────────────────

function initBBContents() {
    if (typeof window !== 'undefined' && window._bbContentsSkipInit) return;
    const delay = (typeof document !== 'undefined' && document.body &&
                   document.body.hasAttribute('bb-performance-boost')) ? 300 : 100;
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => bbContents.init(), delay));
    } else {
        setTimeout(() => bbContents.init(), delay);
    }
}

initBBContents();

export default bbContents;
