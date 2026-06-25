/**
 * Module Share
 * Ajoute des boutons de partage social sur des éléments cliquables.
 *
 * @attr {'twitter'|'facebook'|'linkedin'|'whatsapp'|'telegram'|'email'|'copy'|'native'} bb-share - Réseau de partage
 * @attr {string} [bb-url] - URL à partager (défaut : URL de la page courante)
 * @attr {string} [bb-text] - Texte à partager (défaut : titre de la page)
 */
export default {
    networks: {
        twitter: (data) =>
            'https://twitter.com/intent/tweet?url=' + encodeURIComponent(data.url) +
            '&text=' + encodeURIComponent(data.text),
        facebook: (data) =>
            'https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(data.url),
        linkedin: (data) =>
            'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(data.url),
        whatsapp: (data) =>
            'https://wa.me/?text=' + encodeURIComponent(data.text + ' ' + data.url),
        telegram: (data) =>
            'https://t.me/share/url?url=' + encodeURIComponent(data.url) +
            '&text=' + encodeURIComponent(data.text),
        email: (data) =>
            'mailto:?subject=' + encodeURIComponent(data.text) +
            '&body=' + encodeURIComponent(data.text + ' ' + data.url),
        copy: (data) => 'copy:' + data.url,
        native: (data) => 'native:' + JSON.stringify(data),
    },

    init(scope) {
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('share'));
        const self = this;

        elements.forEach(function(element) {
            if (element.hasAttribute('data-bb-share-processed')) return;
            element.setAttribute('data-bb-share-processed', '1');

            const network = bbContents._getAttr(element, 'bb-share');
            const customUrl = bbContents._getAttr(element, 'bb-url');
            const customText = bbContents._getAttr(element, 'bb-text');

            const data = {
                // text is only ever percent-encoded into share URLs or passed to
                // navigator.share — never inserted as HTML — so it stays raw.
                url: bbContents.utils.isValidUrl(customUrl) ? customUrl : window.location.href,
                text: customText || document.title || 'Découvrez ce site'
            };

            element.addEventListener('click', function(e) {
                e.preventDefault();
                self.share(network, data, element);
            });

            if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
                element.setAttribute('role', 'button');
                element.setAttribute('tabindex', '0');
                element.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        self.share(network, data, element);
                    }
                });
            }

            element.style.cursor = 'pointer';
        });

        bbContents.utils.log('Module Share initialisé:', elements.length, 'éléments');
    },

    share(network, data, element) {
        const networkFunc = this.networks[network];
        if (!networkFunc) return;

        const shareUrl = networkFunc(data);

        if (shareUrl.startsWith('copy:')) {
            this.copyToClipboard(shareUrl.substring(5), element, true);
            return;
        }
        if (shareUrl.startsWith('native:')) {
            this.nativeShare(JSON.parse(shareUrl.substring(7)), element);
            return;
        }

        const width = 600, height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        window.open(shareUrl, 'bbshare',
            `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`);
    },

    copyToClipboard(text, element, silent) {
        const isSilent = !!silent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (!isSilent) {
                    this.showFeedback(element, '✓ ' + (bbContents.config.i18n.copied || 'Lien copié !'));
                }
            }).catch(() => {
                this.fallbackCopy(text, element, isSilent);
            });
        } else {
            this.fallbackCopy(text, element, isSilent);
        }
    },

    fallbackCopy(text, element, silent) {
        if (!!silent) return;
        try {
            window.prompt('Copiez le lien ci-dessous (Ctrl/Cmd+C) :', text);
        } catch (err) {
            console.error('[bb-contents] share: fallbackCopy failed:', err);
        }
    },

    nativeShare(data, element) {
        if (navigator.share) {
            navigator.share({ title: data.text, url: data.url })
                .catch(error => {
                    if (error.name !== 'AbortError') {
                        this.copyToClipboard(data.url, element, false);
                    }
                });
        } else {
            this.copyToClipboard(data.url, element, false);
        }
    },

    showFeedback(element, message) {
        const originalText = element.textContent;
        element.textContent = message;
        element.style.pointerEvents = 'none';
        setTimeout(() => {
            element.textContent = originalText;
            element.style.pointerEvents = '';
        }, 2000);
    }
};
