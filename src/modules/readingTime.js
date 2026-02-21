/**
 * Module Reading Time
 * Calcule et affiche le temps de lecture estimé d'un article ou d'un contenu.
 *
 * @attr {string} bb-reading-time - Active le module sur l'élément d'affichage
 * @attr {string} [bb-reading-time-target] - Sélecteur CSS de l'élément contenant le texte à analyser
 * @attr {number} [bb-reading-time-speed=230] - Vitesse de lecture en mots/minute
 * @attr {number} [bb-reading-time-image-speed=12] - Temps de lecture par image (secondes)
 * @attr {string} [bb-reading-time-format={minutes} min] - Format d'affichage avec placeholder {minutes}
 * @attr {string} [bb-reading-time-url] - URL de l'article à analyser (même domaine uniquement)
 */
export default {
    fetchContentFromUrl(url, targetSelector) {
        return fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(function(html) {
                const cleanedHtml = bbContents.utils.cleanHtml(html);
                const parser = new DOMParser();
                const doc = parser.parseFromString(cleanedHtml, 'text/html');

                let contentNode = null;

                if (targetSelector) contentNode = doc.querySelector(targetSelector);

                if (!contentNode) {
                    const contentSelectors = [
                        'article',
                        '[role="article"]',
                        '.blog-post-content',
                        '.post-content',
                        '.article-content',
                        '.content',
                        'main article',
                        'main .w-dyn-bind-empty',
                        'main .w-richtext'
                    ];
                    for (let i = 0; i < contentSelectors.length; i++) {
                        contentNode = doc.querySelector(contentSelectors[i]);
                        if (contentNode) break;
                    }
                }

                if (!contentNode) contentNode = doc.body;
                if (!contentNode) return { text: '', images: [] };

                const text = contentNode.textContent.trim();
                const images = contentNode.querySelectorAll('img');

                return { text, images };
            });
    },

    calculateReadingTime(text, images, wordsPerMinute, secondsPerImage) {
        const wordCount = text ? text.trim().split(/\s+/).filter(function(word) { return word.length > 0; }).length : 0;
        const imageCount = images ? images.length : 0;
        const imageTimeInMinutes = (imageCount * secondsPerImage) / 60;

        let minutesFloat = (wordCount / wordsPerMinute) + imageTimeInMinutes;
        let minutes = Math.ceil(minutesFloat);

        if ((wordCount > 0 || imageCount > 0) && minutes < 1) minutes = 1;
        if (wordCount === 0 && imageCount === 0) minutes = 0;

        return minutes;
    },

    init(root) {
        const scope = root || document;
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('reading-time'));
        const self = this;

        elements.forEach(function(element) {
            if (element.hasAttribute('data-bb-reading-time-processed')) return;
            element.setAttribute('data-bb-reading-time-processed', '1');

            const targetSelector = bbContents._getAttr(element, 'bb-reading-time-target');
            const speedAttr = bbContents._getAttr(element, 'bb-reading-time-speed');
            const imageSpeedAttr = bbContents._getAttr(element, 'bb-reading-time-image-speed');
            const format = bbContents._getAttr(element, 'bb-reading-time-format') || '{minutes} min';
            const urlAttr = bbContents._getAttr(element, 'bb-reading-time-url');

            let wordsPerMinute = Number(speedAttr);
            if (isNaN(wordsPerMinute) || wordsPerMinute <= 0) wordsPerMinute = 230;

            let secondsPerImage = Number(imageSpeedAttr);
            if (isNaN(secondsPerImage) || secondsPerImage < 0) secondsPerImage = 12;

            let articleUrl = null;

            const linkElement = element.closest('a');
            if (linkElement && linkElement.href) articleUrl = linkElement.href;

            if (!articleUrl && urlAttr) {
                articleUrl = urlAttr;
                if (articleUrl && !bbContents.utils.isValidUrl(articleUrl)) {
                    try {
                        const url = new URL(articleUrl, window.location.origin);
                        if (url.origin !== window.location.origin) {
                            articleUrl = null;
                        } else {
                            articleUrl = url.href;
                        }
                    } catch (e) {
                        articleUrl = null;
                    }
                } else if (articleUrl && bbContents.utils.isValidUrl(articleUrl)) {
                    try {
                        const url = new URL(articleUrl);
                        if (url.origin !== window.location.origin) articleUrl = null;
                    } catch (e) {
                        articleUrl = null;
                    }
                }
            }

            if (articleUrl && bbContents.utils.isValidUrl(articleUrl)) {
                const originalText = element.textContent;
                self.fetchContentFromUrl(articleUrl, targetSelector)
                    .then(function(data) {
                        const minutes = self.calculateReadingTime(data.text, data.images, wordsPerMinute, secondsPerImage);
                        element.textContent = format.replace('{minutes}', String(minutes));
                    })
                    .catch(function(error) {
                        bbContents.utils.log('Erreur reading-time fetch:', error);
                        element.textContent = originalText || '';
                    });
                return;
            }

            let sourceNodes = [];
            if (targetSelector) {
                const foundNodes = document.querySelectorAll(targetSelector);
                sourceNodes = foundNodes.length === 0 ? [element] : Array.from(foundNodes);
            } else {
                sourceNodes = [element];
            }

            let totalText = '';
            let totalImages = [];

            sourceNodes.forEach(function(node) {
                const nodeText = (node.textContent || '').trim();
                if (nodeText) totalText += (totalText ? ' ' : '') + nodeText;
                totalImages = totalImages.concat(Array.from(node.querySelectorAll('img')));
            });

            const minutes = self.calculateReadingTime(totalText.trim(), totalImages, wordsPerMinute, secondsPerImage);
            element.textContent = format.replace('{minutes}', String(minutes));
        });

        bbContents.utils.log('Module ReadingTime initialisé:', elements.length, 'éléments');
    }
};
