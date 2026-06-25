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
export default {
    _activeRequests: new Set(),

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

    cache: {
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
    },

    isRequestActive(cacheKey) { return this._activeRequests.has(cacheKey); },
    markRequestActive(cacheKey) { this._activeRequests.add(cacheKey); },
    markRequestComplete(cacheKey) { this._activeRequests.delete(cacheKey); },

    init(root) {
        const scope = root || document;
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        if (this.isBot()) return;

        this.cleanCache();

        const allElements = scope.querySelectorAll(bbContents._attrSelector('youtube-channel'));
        if (allElements.length === 0) return;

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

        Object.keys(elementsByConfig).forEach(configKey => {
            const group = elementsByConfig[configKey];
            group.elements.forEach(element => {
                const videoCount = parseInt(bbContents._getAttr(element, 'bb-youtube-video-count') || '10', 10);
                const skip = parseInt(bbContents._getAttr(element, 'bb-youtube-skip') || '0', 10);
                this.initElement(element, group, videoCount, skip);
            });
        });
    },

    initElement(element, groupConfig, videoCount, skip) {
        if (this.isBot()) return;

        if (!groupConfig) {
            const channelIdsRaw = bbContents._getAttr(element, 'bb-youtube-channel');
            if (!channelIdsRaw) return;
            const channelIds = channelIdsRaw.split(',').map(id => id.trim()).filter(id => id);
            if (channelIds.length === 0) return;
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

        const endpoint = bbContents.checkYouTubeConfig() ? bbContents.config.youtubeEndpoint : null;

        if (!endpoint) {
            const retries = parseInt(element.getAttribute('data-youtube-retry-count') || '0', 10);
            if (retries < 10) {
                element.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Configuration YouTube en cours...</div>';
                element.setAttribute('data-youtube-retry-count', (retries + 1).toString());
                setTimeout(() => this.initElement(element), 500);
            } else {
                element.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Configuration YouTube manquante</strong><br>Ajoutez dans le &lt;head&gt; :<br><code style="display: block; background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace;">&lt;script&gt;<br>bbContents.config.youtubeEndpoint = \'votre-worker-url\';<br>&lt;/script&gt;</code></div>';
            }
            return;
        }

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
            return;
        }

        template.style.display = 'none';
        element.setAttribute('data-bb-youtube-processed', 'true');

        const baseCacheKey = `youtube_${groupConfig.channelIds}_${groupConfig.allowShorts}_${groupConfig.language}`;
        const cachedData = this.cache.get(baseCacheKey);
        const minItemsNeeded = skip + videoCount;

        if (cachedData && cachedData.items && cachedData.items.length >= minItemsNeeded) {
            const limitedData = this.applySkipAndLimit(cachedData, skip, videoCount);
            this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
            return;
        }
        if (cachedData && cachedData.items && cachedData.items.length < minItemsNeeded) {
            try { localStorage.removeItem(baseCacheKey); } catch (e) { console.error('[bb-contents] youtube cache remove failed:', e); }
        }

        if (this.isRequestActive(baseCacheKey)) {
            let activeAttempts = 0;
            const checkActive = () => {
                // Bounded wait (~20s) so a stuck in-flight marker can never poll forever.
                if (activeAttempts >= 100) {
                    container.innerHTML = this._errorBox('Délai dépassé');
                    return;
                }
                if (!this.isRequestActive(baseCacheKey)) {
                    const newCachedData = this.cache.get(baseCacheKey);
                    if (newCachedData && newCachedData.items && newCachedData.items.length >= minItemsNeeded) {
                        const limitedData = this.applySkipAndLimit(newCachedData, skip, videoCount);
                        this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
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
            return;
        }

        this.markRequestActive(baseCacheKey);
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Chargement des vidéos YouTube...</div>';

        const apiVideoCount = groupConfig.maxVideoCount + groupConfig.maxSkip;

        // Validate config gracefully — never throw out of initElement, or a single
        // bad attribute would abort init for every other element on the page and
        // leave the request marker stuck active (deadlocking other elements).
        const endpointInvalid =
            !endpoint || typeof endpoint !== 'string' ||
            (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) ||
            (bbContents.config.youtubeEndpoint && !endpoint.startsWith(bbContents.config.youtubeEndpoint));
        if (endpointInvalid) {
            this.markRequestComplete(baseCacheKey);
            container.innerHTML = this._errorBox('Endpoint YouTube invalide');
            return;
        }

        const channelIds = groupConfig.channelIds.split(',');
        const invalidChannelId = channelIds.find(id => !id || !/^[a-zA-Z0-9_-]+$/.test(id));
        if (invalidChannelId !== undefined) {
            this.markRequestComplete(baseCacheKey);
            container.innerHTML = this._errorBox('Channel ID invalide : ' + invalidChannelId);
            return;
        }

        const safeAllowShorts = groupConfig.allowShorts === true || groupConfig.allowShorts === 'true';

        if (channelIds.length > 1) {
            this.fetchMultipleChannels(endpoint, channelIds, apiVideoCount, safeAllowShorts)
                .then(data => {
                    if (data.error) throw new Error(data.error.message || 'Erreur API YouTube');
                    this.cache.set(baseCacheKey, data);
                    const limitedData = this.applySkipAndLimit(data, skip, videoCount);
                    this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
                    this.markRequestComplete(baseCacheKey);
                })
                .catch(error => {
                    this.markRequestComplete(baseCacheKey);
                    this.handleFetchError(error, container, baseCacheKey, skip, videoCount, template, groupConfig);
                });
        } else {
            fetch(`${endpoint}?channelId=${encodeURIComponent(channelIds[0])}&maxResults=${apiVideoCount}&allowShorts=${safeAllowShorts}`)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    if (data.error) throw new Error(data.error.message || 'Erreur API YouTube');
                    this.cache.set(baseCacheKey, data);
                    const limitedData = this.applySkipAndLimit(data, skip, videoCount);
                    this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
                    this.markRequestComplete(baseCacheKey);
                })
                .catch(error => {
                    this.markRequestComplete(baseCacheKey);
                    this.handleFetchError(error, container, baseCacheKey, skip, videoCount, template, groupConfig);
                });
        }
    },

    _errorBox(message) {
        return '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>' +
            bbContents.utils.sanitize(message || 'Erreur inconnue') + '</div>';
    },

    applySkipAndLimit(data, skip, videoCount) {
        if (!data || !data.items) return data;
        const afterSkip = skip > 0 ? data.items.slice(skip) : data.items;
        return { ...data, items: afterSkip.slice(0, videoCount) };
    },

    fetchMultipleChannels(endpoint, channelIds, maxResults, allowShorts) {
        if (channelIds.length > 10) throw new Error('Maximum 10 channelIds allowed');

        const promises = channelIds.map(channelId => {
            return fetch(`${endpoint}?channelId=${encodeURIComponent(channelId)}&maxResults=${maxResults}&allowShorts=${allowShorts}`)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status} for channel ${channelId}`);
                    return response.json();
                })
                .then(data => {
                    if (data.error) throw new Error(data.error.message || 'Erreur API YouTube');
                    return { success: true, items: data.items || [] };
                })
                .catch(() => ({ success: false, items: [] }));
        });

        return Promise.all(promises).then(allResults => {
            const allChannelsFailed = allResults.every(result => !result.success);
            const mergedItems = [].concat(...allResults.map(result => result.items));
            mergedItems.sort((a, b) => {
                const dateA = new Date(a.snippet?.publishedAt || 0);
                const dateB = new Date(b.snippet?.publishedAt || 0);
                return dateB - dateA;
            });
            return {
                items: mergedItems,
                pageInfo: { totalResults: mergedItems.length, resultsPerPage: mergedItems.length },
                allChannelsFailed
            };
        });
    },

    handleFetchError(error, container, cacheKey, skip, videoCount, template, groupConfig) {
        const expiredCache = localStorage.getItem(cacheKey);
        if (expiredCache) {
            try {
                const cachedData = JSON.parse(expiredCache);
                const limitedData = this.applySkipAndLimit(cachedData.value, skip, videoCount);
                this.generateYouTubeFeed(container, template, limitedData, groupConfig.allowShorts, groupConfig.language);
                return;
            } catch (e) {
                console.error('[bb-contents] youtube expired cache parse failed:', e);
            }
        }
        container.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>${bbContents.utils.sanitize(error.message || 'Erreur inconnue')}</div>`;
    },

    generateYouTubeFeed(container, template, data, allowShorts, language = 'fr') {
        if (!data || !data.items || data.items.length === 0) {
            if (data && data.allChannelsFailed) {
                container.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626; text-align: center;"><strong>Erreur de chargement</strong><br>Impossible de récupérer les vidéos des chaînes YouTube</div>';
            } else {
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Aucune vidéo trouvée</div>';
            }
            return;
        }

        const marqueeElements = container.querySelectorAll('[data-bb-marquee-processed]');
        container.innerHTML = '';
        marqueeElements.forEach(marqueeEl => container.appendChild(marqueeEl));

        data.items.forEach(item => {
            const videoId = item.id?.videoId;
            if (!videoId) return;
            const snippet = item.snippet;
            const clone = template.cloneNode(true);
            clone.style.display = '';
            this.fillVideoData(clone, videoId, snippet, language);
            container.appendChild(clone);
        });
    },

    fillVideoData(element, videoId, snippet, language = 'fr') {
        if (element.tagName === 'A' || element.hasAttribute('bb-youtube-item') || element.hasAttribute('data-bb-youtube-item')) {
            element.href = `https://www.youtube.com/watch?v=${videoId}`;
            element.target = '_blank';
            element.rel = 'noopener noreferrer';
        }

        const thumbnail = element.querySelector(bbContents._attrSelector('youtube-thumbnail'));
        if (thumbnail) {
            const t = snippet.thumbnails;
            const bestUrl = (t.maxres || t.high || t.medium || t.default || {}).url;
            if (bestUrl && bbContents.utils.isValidUrl(bestUrl)) {
                thumbnail.src = bestUrl;
                thumbnail.alt = snippet.title;
            }
        }

        const title = element.querySelector(bbContents._attrSelector('youtube-title'));
        if (title) title.textContent = this.decodeHtmlEntities(snippet.title);

        const description = element.querySelector(bbContents._attrSelector('youtube-description'));
        if (description) description.textContent = this.decodeHtmlEntities(snippet.description);

        const date = element.querySelector(bbContents._attrSelector('youtube-date'));
        if (date) date.textContent = this.formatDate(snippet.publishedAt, language);

        const channel = element.querySelector(bbContents._attrSelector('youtube-channel'));
        if (channel) channel.textContent = snippet.channelTitle;
    },

    formatDate(dateString, language = 'fr') {
        const date = new Date(dateString);
        const diffDays = Math.ceil(Math.abs(new Date() - date) / (1000 * 60 * 60 * 24));

        const t = {
            fr: { day: 'jour', days: 'jours', week: 'semaine', weeks: 'semaines', month: 'mois', months: 'mois', year: 'an', years: 'ans', ago: 'Il y a' },
            en: { day: 'day', days: 'days', week: 'week', weeks: 'weeks', month: 'month', months: 'months', year: 'year', years: 'years', ago: 'ago' }
        }[language] || { day: 'jour', days: 'jours', week: 'semaine', weeks: 'semaines', month: 'mois', months: 'mois', year: 'an', years: 'ans', ago: 'Il y a' };

        if (diffDays === 1) return `${t.ago} 1 ${t.day}`;
        if (diffDays < 7) return `${t.ago} ${diffDays} ${t.days}`;
        const weeks = Math.floor(diffDays / 7);
        if (weeks === 1) return `${t.ago} 1 ${t.week}`;
        if (diffDays < 30) return `${t.ago} ${weeks} ${t.weeks}`;
        const months = Math.floor(diffDays / 30);
        if (months === 1) return `${t.ago} 1 ${t.month}`;
        if (diffDays < 365) return `${t.ago} ${months} ${t.months}`;
        const years = Math.floor(diffDays / 365);
        if (years === 1) return `${t.ago} 1 ${t.year}`;
        return `${t.ago} ${years} ${t.years}`;
    },

    decodeHtmlEntities(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        const textarea = document.createElement('textarea');
        textarea.innerHTML = div.innerHTML;
        return textarea.value;
    },

    cleanCache() {
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
};
