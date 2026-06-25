/**
 * Module YouTube
 * Affiche un feed de vidéos YouTube dynamique dans un élément Webflow via un Worker proxy.
 *
 * @attr {string} bb-youtube-channel - ID de la chaîne YouTube (ou plusieurs séparés par virgule)
 * @attr {number} [bb-youtube-video-count=10] - Nombre de vidéos à afficher
 * @attr {number} [bb-youtube-skip=0] - Nombre de vidéos à ignorer depuis le début
 * @attr {'fr'|'en'} [bb-youtube-language=fr] - Langue pour les dates relatives
 * @attr {'true'|'false'} [bb-youtube-allow-shorts=false] - Inclure les YouTube Shorts
 */
import { applySkipAndLimit, errorBox } from './youtube/format.js';
import { cache, cleanCache, isRequestActive, markRequestActive, markRequestComplete } from './youtube/cache.js';
import { fetchChannelFeed, fetchMultipleChannels } from './youtube/fetch.js';
import { generateYouTubeFeed } from './youtube/render.js';

export default {
    isBot() {
        const userAgent = navigator.userAgent.toLowerCase();
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'googlebot', 'bingbot', 'slurp',
            'duckduckbot', 'baiduspider', 'yandexbot', 'facebookexternalhit', 'twitterbot',
            'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot', 'slackbot', 'headless',
            'phantom', 'selenium', 'puppeteer', 'playwright', 'lighthouse', 'gtmetrix',
            'pagespeed', 'pingdom', 'uptime', 'monitor', 'check', 'test'
        ];
        // NB: do NOT gate on `!window.chrome` or `plugins.length === 0` — those
        // flag every Firefox/Safari (and most modern browsers) as bots and hide
        // the feed from real visitors.
        const isBot = botPatterns.some(pattern => userAgent.includes(pattern)) ||
               navigator.webdriver ||
               !navigator.userAgent ||
               navigator.userAgent.includes('HeadlessChrome');

        if (isBot && bbContents.config.debug) {
            bbContents.utils.log('Bot détecté, pas d\'appel API YouTube');
        }
        return isBot;
    },

    init(root) {
        const scope = root || document;
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        if (this.isBot()) return;

        cleanCache();

        const allElements = scope.querySelectorAll(bbContents._attrSelector('youtube-channel'));
        if (allElements.length === 0) return;

        const elementsByConfig = this._groupByConfig(allElements);

        Object.keys(elementsByConfig).forEach(configKey => {
            const group = elementsByConfig[configKey];
            group.elements.forEach(element => {
                const videoCount = parseInt(bbContents._getAttr(element, 'bb-youtube-video-count') || '10', 10);
                const skip = parseInt(bbContents._getAttr(element, 'bb-youtube-skip') || '0', 10);
                this.initElement(element, group, videoCount, skip);
            });
        });
    },

    _groupByConfig(allElements) {
        const elementsByConfig = {};
        allElements.forEach(element => {
            if (element.hasAttribute('data-bb-youtube-processed')) return;

            const channelIdsRaw = bbContents._getAttr(element, 'bb-youtube-channel');
            if (!channelIdsRaw) return;

            const channelIds = channelIdsRaw.split(',').map(id => id.trim()).filter(id => id);
            if (channelIds.length === 0) return;

            const normalizedChannelIds = channelIds.sort().join(',');
            const allowShorts = bbContents._getAttr(element, 'bb-youtube-allow-shorts') === 'true';
            const language = bbContents._getAttr(element, 'bb-youtube-language') || 'fr';
            const videoCount = parseInt(bbContents._getAttr(element, 'bb-youtube-video-count') || '10', 10);
            const skip = parseInt(bbContents._getAttr(element, 'bb-youtube-skip') || '0', 10);
            const configKey = `${normalizedChannelIds}_${allowShorts}_${language}`;

            if (!elementsByConfig[configKey]) {
                elementsByConfig[configKey] = {
                    elements: [],
                    maxVideoCount: 0,
                    maxSkip: 0,
                    channelIds: normalizedChannelIds,
                    allowShorts,
                    language
                };
            }

            elementsByConfig[configKey].maxVideoCount = Math.max(elementsByConfig[configKey].maxVideoCount, videoCount);
            elementsByConfig[configKey].maxSkip = Math.max(elementsByConfig[configKey].maxSkip, skip);

            element.setAttribute('data-bb-youtube-processed', 'true');
            elementsByConfig[configKey].elements.push(element);
        });
        return elementsByConfig;
    },

    initElement(element, groupConfig, videoCount, skip) {
        if (this.isBot()) return;

        const resolved = this._resolveConfig(element, groupConfig, videoCount, skip);
        if (!resolved) return;
        groupConfig = resolved.groupConfig;
        videoCount = resolved.videoCount;
        skip = resolved.skip;

        const endpoint = bbContents.checkYouTubeConfig() ? bbContents.config.youtubeEndpoint : null;
        if (!endpoint) { this._renderEndpointRetry(element); return; }

        const tpl = this._resolveTemplate(element);
        if (!tpl) return;

        tpl.template.style.display = 'none';
        element.setAttribute('data-bb-youtube-processed', 'true');

        this._loadFeed(element, tpl.container, tpl.template, groupConfig, videoCount, skip);
    },

    _resolveConfig(element, groupConfig, videoCount, skip) {
        if (!groupConfig) {
            const channelIdsRaw = bbContents._getAttr(element, 'bb-youtube-channel');
            if (!channelIdsRaw) return null;
            const channelIds = channelIdsRaw.split(',').map(id => id.trim()).filter(id => id);
            if (channelIds.length === 0) return null;
            const normalizedChannelIds = channelIds.sort().join(',');
            const allowShorts = bbContents._getAttr(element, 'bb-youtube-allow-shorts') === 'true';
            const language = bbContents._getAttr(element, 'bb-youtube-language') || 'fr';
            groupConfig = {
                channelIds: normalizedChannelIds,
                allowShorts,
                language,
                maxVideoCount: parseInt(bbContents._getAttr(element, 'bb-youtube-video-count') || '10', 10),
                maxSkip: parseInt(bbContents._getAttr(element, 'bb-youtube-skip') || '0', 10)
            };
            videoCount = groupConfig.maxVideoCount;
            skip = groupConfig.maxSkip;
        }

        if (!videoCount) videoCount = parseInt(bbContents._getAttr(element, 'bb-youtube-video-count') || '10', 10);
        if (skip === undefined || skip === null) skip = parseInt(bbContents._getAttr(element, 'bb-youtube-skip') || '0', 10);

        return { groupConfig, videoCount, skip };
    },

    _renderEndpointRetry(element) {
        const retries = parseInt(element.getAttribute('data-youtube-retry-count') || '0', 10);
        if (retries < 10) {
            element.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Configuration YouTube en cours...</div>';
            element.setAttribute('data-youtube-retry-count', (retries + 1).toString());
            setTimeout(() => this.initElement(element), 500);
        } else {
            element.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Configuration YouTube manquante</strong><br>Ajoutez dans le &lt;head&gt; :<br><code style="display: block; background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace;">&lt;script&gt;<br>bbContents.config.youtubeEndpoint = \'votre-worker-url\';<br>&lt;/script&gt;</code></div>';
        }
    },

    _resolveTemplate(element) {
        let template = element.querySelector(bbContents._attrSelector('youtube-item'));
        let container = element;

        if (!template) {
            const containerElement = element.querySelector(bbContents._attrSelector('youtube-container'));
            if (containerElement) {
                container = containerElement;
                template = containerElement.querySelector(bbContents._attrSelector('youtube-item'));
            }
        }

        if (!template) {
            element.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Template manquant</strong><br>Ajoutez un élément avec l\'attribut bb-youtube-item</div>';
            return null;
        }

        return { template, container };
    },

    _loadFeed(element, container, template, groupConfig, videoCount, skip) {
        const baseCacheKey = `youtube_${groupConfig.channelIds}_${groupConfig.allowShorts}_${groupConfig.language}`;
        const cachedData = cache.get(baseCacheKey);
        const minItemsNeeded = skip + videoCount;

        if (cachedData && cachedData.items && cachedData.items.length >= minItemsNeeded) {
            this._render(container, template, cachedData, groupConfig, skip, videoCount);
            return;
        }
        if (cachedData && cachedData.items && cachedData.items.length < minItemsNeeded) {
            try { localStorage.removeItem(baseCacheKey); } catch (e) { console.error('[bb-contents] youtube cache remove failed:', e); }
        }

        if (isRequestActive(baseCacheKey)) {
            this._waitForInflight(element, container, template, groupConfig, videoCount, skip, baseCacheKey, minItemsNeeded);
            return;
        }

        this._startFetch(container, template, groupConfig, videoCount, skip, baseCacheKey);
    },

    _render(container, template, data, groupConfig, skip, videoCount) {
        const limitedData = applySkipAndLimit(data, skip, videoCount);
        generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
    },

    _waitForInflight(element, container, template, groupConfig, videoCount, skip, baseCacheKey, minItemsNeeded) {
        let activeAttempts = 0;
        const checkActive = () => {
            // Bounded wait (~20s) so a stuck in-flight marker can never poll forever.
            if (activeAttempts >= 100) {
                container.innerHTML = errorBox('Délai dépassé');
                return;
            }
            if (!isRequestActive(baseCacheKey)) {
                const newCachedData = cache.get(baseCacheKey);
                if (newCachedData && newCachedData.items && newCachedData.items.length >= minItemsNeeded) {
                    this._render(container, template, newCachedData, groupConfig, skip, videoCount);
                } else if (newCachedData && newCachedData.items && newCachedData.items.length < minItemsNeeded) {
                    try { localStorage.removeItem(baseCacheKey); } catch (e) { console.error('[bb-contents] youtube cache remove failed:', e); }
                    this.initElement(element, groupConfig, videoCount, skip);
                } else {
                    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Erreur de chargement</div>';
                }
            } else {
                activeAttempts++;
                setTimeout(checkActive, 200);
            }
        };
        checkActive();
    },

    _startFetch(container, template, groupConfig, videoCount, skip, baseCacheKey) {
        markRequestActive(baseCacheKey);
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Chargement des vidéos YouTube...</div>';

        const endpoint = bbContents.config.youtubeEndpoint;
        const apiVideoCount = groupConfig.maxVideoCount + groupConfig.maxSkip;

        // Validate config gracefully — never throw out of initElement, or a single
        // bad attribute would abort init for every other element on the page and
        // leave the request marker stuck active (deadlocking other elements).
        const endpointInvalid =
            !endpoint || typeof endpoint !== 'string' ||
            (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) ||
            (bbContents.config.youtubeEndpoint && !endpoint.startsWith(bbContents.config.youtubeEndpoint));
        if (endpointInvalid) {
            markRequestComplete(baseCacheKey);
            container.innerHTML = errorBox('Endpoint YouTube invalide');
            return;
        }

        const channelIds = groupConfig.channelIds.split(',');
        const invalidChannelId = channelIds.find(id => !id || !/^[a-zA-Z0-9_-]+$/.test(id));
        if (invalidChannelId !== undefined) {
            markRequestComplete(baseCacheKey);
            container.innerHTML = errorBox('Channel ID invalide : ' + invalidChannelId);
            return;
        }

        const safeAllowShorts = groupConfig.allowShorts === true || groupConfig.allowShorts === 'true';

        const onSuccess = data => {
            if (data.error) throw new Error(data.error.message || 'Erreur API YouTube');
            cache.set(baseCacheKey, data);
            this._render(container, template, data, groupConfig, skip, videoCount);
            markRequestComplete(baseCacheKey);
        };
        const onError = error => {
            markRequestComplete(baseCacheKey);
            this.handleFetchError(error, container, baseCacheKey, skip, videoCount, template, groupConfig);
        };

        if (channelIds.length > 1) {
            fetchMultipleChannels(endpoint, channelIds, apiVideoCount, safeAllowShorts).then(onSuccess).catch(onError);
        } else {
            fetchChannelFeed(endpoint, channelIds[0], apiVideoCount, safeAllowShorts).then(onSuccess).catch(onError);
        }
    },

    handleFetchError(error, container, cacheKey, skip, videoCount, template, groupConfig) {
        const expiredCache = localStorage.getItem(cacheKey);
        if (expiredCache) {
            try {
                const cachedData = JSON.parse(expiredCache);
                const limitedData = applySkipAndLimit(cachedData.value, skip, videoCount);
                generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
                return;
            } catch (e) {
                console.error('[bb-contents] youtube expired cache parse failed:', e);
            }
        }
        container.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>${bbContents.utils.sanitize(error.message || 'Erreur inconnue')}</div>`;
    }
};
