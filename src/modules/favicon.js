/**
 * Module Favicon
 * Remplace le favicon de la page dynamiquement, avec support du mode sombre.
 *
 * @attr {string} bb-favicon - URL du favicon (mode clair)
 * @attr {string} [bb-favicon-dark] - URL du favicon pour le mode sombre (prefers-color-scheme: dark)
 */
export default {
    originalFavicon: null,

    init(scope) {
        if (scope.closest && scope.closest('[data-bb-disable]')) return;

        const elements = scope.querySelectorAll(
            bbContents._attrSelector('favicon') + ', ' + bbContents._attrSelector('favicon-dark')
        );
        if (elements.length === 0) return;

        const existingLink = document.querySelector("link[rel*='icon']");
        if (existingLink && !this.originalFavicon) {
            this.originalFavicon = existingLink.href;
        }

        let faviconUrl = null;
        let darkUrl = null;

        elements.forEach(element => {
            if (element.hasAttribute('data-bb-favicon-processed')) return;
            element.setAttribute('data-bb-favicon-processed', '1');
            const light = bbContents._getAttr(element, 'bb-favicon');
            const dark = bbContents._getAttr(element, 'bb-favicon-dark');
            if (light) faviconUrl = light;
            if (dark) darkUrl = dark;
        });

        if (!faviconUrl && !darkUrl) return;

        if (faviconUrl && darkUrl) {
            this.setupDarkMode(faviconUrl, darkUrl);
        } else if (faviconUrl) {
            this.setFavicon(faviconUrl);
            bbContents.utils.log('Favicon changé:', faviconUrl);
        }
    },

    getFaviconElement() {
        let favicon = document.querySelector('link[rel="icon"]') ||
            document.querySelector('link[rel="shortcut icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        return favicon;
    },

    setFavicon(url) {
        if (!url) return;
        const favicon = this.getFaviconElement();
        favicon.href = url + '?v=' + Date.now();
    },

    setupDarkMode(lightUrl, darkUrl) {
        const updateFavicon = (e) => {
            const darkModeOn = e
                ? e.matches
                : window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setFavicon(darkModeOn ? darkUrl : lightUrl);
        };
        updateFavicon(null);
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', updateFavicon);
        } else if (typeof mq.addListener === 'function') {
            mq.addListener(updateFavicon);
        }
    }
};
