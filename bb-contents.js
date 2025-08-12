/**
 * BeBranded Contents
 * Contenus additionnels français pour Webflow
 * @version 1.0.0
 * @author BeBranded
 * @license MIT
 * @website https://www.bebranded.xyz
 */
(function() {
    'use strict';

    // Protection contre le double chargement
    if (window.bbContents) {
        console.warn('BeBranded Contents est déjà chargé');
        return;
    }

    // Configuration
    const config = {
        version: '1.0.0',
        debug: window.location.hostname === 'localhost' || window.location.hostname.includes('webflow.io'),
        prefix: 'bb-', // utilisé pour générer les sélecteurs (data-bb-*)
        i18n: {
            copied: 'Lien copié !'
        }
    };

    // Objet principal
    const bbContents = {
        config: config,
        modules: {},
        _observer: null,
        _reinitScheduled: false,
        
        // Utilitaires
        utils: {
            log: function(...args) {
                if (config.debug) {
                    console.log('[BB Contents]', ...args);
                }
            },
            
            // Protection XSS
            sanitize: function(str) {
                if (typeof str !== 'string') return '';
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            },
            
            // Validation des URLs
            isValidUrl: function(string) {
                try {
                    new URL(string);
                    return true;
                } catch (_) {
                    return false;
                }
            }
        },
        
        // Helper: construire des sélecteurs d’attributs selon le prefix
        _attrSelector: function(name) {
            const p = (this.config.prefix || 'bb-').replace(/-?$/, '-');
            const legacy = name.startsWith('bb-') ? name : (p + name);
            const dataName = 'data-' + legacy.replace(/^bb-/, 'bb-');
            return '[' + legacy + '], [' + dataName + ']';
        },

        // Helper: lire un attribut avec compat data-bb-*
        _getAttr: function(element, name) {
            const p = (this.config.prefix || 'bb-').replace(/-?$/, '-');
            const legacy = name.startsWith('bb-') ? name : (p + name);
            return element.getAttribute(legacy) || element.getAttribute('data-' + legacy);
        },

        // Initialisation
        init: function() {
            this.utils.log('Initialisation v' + this.config.version);
            
            // Déterminer la portée
            const scope = document.querySelector('[data-bb-scope]') || document;

            // Initialiser seulement les modules qui ont des attributs sur la page courante
            Object.keys(this.modules).forEach(function(moduleName) {
                const module = bbContents.modules[moduleName];
                if (module.detect && module.detect(scope)) {
                    bbContents.utils.log('Module détecté:', moduleName);
                    try {
                        module.init(scope);
                    } catch (error) {
                        console.error('[BB Contents] Erreur dans le module', moduleName, error);
                        // Continuer avec les autres modules même si un échoue
                    }
                }
            });

            // Activer l'observer DOM pour contenu dynamique
            this.setupObserver();
        },

        // Ré-initialiser une sous-arborescence DOM (pour contenus ajoutés dynamiquement)
        reinit: function(root) {
            const rootNode = root && root.nodeType ? root : document;
            // Ne pas traiter les sous-arbres marqués en disable
            if (rootNode.closest && rootNode.closest('[data-bb-disable]')) return;
            
            // Éviter les ré-initialisations multiples sur le même scope
            if (rootNode === document && this._lastReinitTime && (Date.now() - this._lastReinitTime) < 1000) {
                return; // Éviter les reinit trop fréquents sur document
            }
            this._lastReinitTime = Date.now();
            
            Object.keys(this.modules).forEach(function(moduleName) {
                const module = bbContents.modules[moduleName];
                try {
                    module.init(rootNode);
                } catch (error) {
                    console.error('[BB Contents] Erreur reinit dans le module', moduleName, error);
                }
            });
        },

        // Mise en place d'un MutationObserver avec debounce
        setupObserver: function() {
            if (!('MutationObserver' in window) || this._observer) return;
            const self = this;
            this._observer = new MutationObserver(function(mutations) {
                let hasRelevantChanges = false;
                for (let i = 0; i < mutations.length; i++) {
                    const mutation = mutations[i];
                    // Vérifier si les changements concernent des éléments avec nos attributs
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        for (let j = 0; j < mutation.addedNodes.length; j++) {
                            const node = mutation.addedNodes[j];
                            if (node.nodeType === 1) { // Element node
                                if (node.querySelector && (
                                    node.querySelector('[bb-], [data-bb-]') || 
                                    node.matches && node.matches('[bb-], [data-bb-]')
                                )) {
                                    hasRelevantChanges = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (!hasRelevantChanges) return;
                if (self._reinitScheduled) return;
                self._reinitScheduled = true;
                setTimeout(function() {
                    try {
                        self.reinit(document);
                    } finally {
                        self._reinitScheduled = false;
                    }
                }, 200); // Augmenté à 200ms pour réduire la fréquence
            });
            try {
                this._observer.observe(document.body, { childList: true, subtree: true });
                this.utils.log('MutationObserver actif');
            } catch (e) {
                // No-op si document.body indisponible
            }
        }
    };

    // ========================================
    // MODULE: SHARE (Partage Social)
    // ========================================
    bbContents.modules.share = {
        // Configuration des réseaux
        networks: {
            twitter: function(data) {
                return 'https://twitter.com/intent/tweet?url=' + 
                       encodeURIComponent(data.url) + 
                       '&text=' + encodeURIComponent(data.text);
            },
            facebook: function(data) {
                return 'https://facebook.com/sharer/sharer.php?u=' + 
                       encodeURIComponent(data.url);
            },
            linkedin: function(data) {
                // LinkedIn - URL de partage officielle (2024+)
                return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(data.url);
            },
            whatsapp: function(data) {
                return 'https://wa.me/?text=' + 
                       encodeURIComponent(data.text + ' ' + data.url);
            },
            telegram: function(data) {
                return 'https://t.me/share/url?url=' + 
                       encodeURIComponent(data.url) + 
                       '&text=' + encodeURIComponent(data.text);
            },
            email: function(data) {
                return 'mailto:?subject=' + 
                       encodeURIComponent(data.text) + 
                       '&body=' + encodeURIComponent(data.text + ' ' + data.url);
            },
            copy: function(data) {
                return 'copy:' + data.url;
            },
            native: function(data) {
                return 'native:' + JSON.stringify(data);
            }
        },
        
        // Détection
        detect: function(scope) {
            const s = scope || document;
            return s.querySelector(bbContents._attrSelector('share')) !== null;
        },
        
        // Initialisation
        init: function(root) {
            const scope = root || document;
            if (scope.closest && scope.closest('[data-bb-disable]')) return;
            const elements = scope.querySelectorAll(bbContents._attrSelector('share'));
            
            elements.forEach(function(element) {
                // Vérifier si déjà traité
                if (element.bbProcessed) return;
                element.bbProcessed = true;
                
                // Récupérer les données
                const network = bbContents._getAttr(element, 'bb-share');
                const customUrl = bbContents._getAttr(element, 'bb-url');
                const customText = bbContents._getAttr(element, 'bb-text');
                
                // Valeurs par défaut sécurisées
                const data = {
                    url: bbContents.utils.isValidUrl(customUrl) ? customUrl : window.location.href,
                    text: bbContents.utils.sanitize(customText || document.title || 'Découvrez ce site')
                };
                
                // Gestionnaire de clic
                element.addEventListener('click', function(e) {
                    e.preventDefault();
                    bbContents.modules.share.share(network, data, element);
                });
                
                // Accessibilité
                if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
                    element.setAttribute('role', 'button');
                    element.setAttribute('tabindex', '0');
                    
                    // Support clavier
                    element.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            bbContents.modules.share.share(network, data, element);
                        }
                    });
                }
                
                element.style.cursor = 'pointer';
            });
            
            bbContents.utils.log('Module Share initialisé:', elements.length, 'éléments');
        },
        
        // Fonction de partage
        share: function(network, data, element) {
            const networkFunc = this.networks[network];
            
            if (!networkFunc) {
                console.error('[BB Contents] Réseau non supporté:', network);
                return;
            }
            
            const shareUrl = networkFunc(data);
            
            // Cas spécial : copier le lien
            if (shareUrl.startsWith('copy:')) {
                const url = shareUrl.substring(5);
                // Copie silencieuse (pas de feedback visuel)
                this.copyToClipboard(url, element, true);
                return;
            }
            
            // Cas spécial : partage natif (Web Share API)
            if (shareUrl.startsWith('native:')) {
                const shareData = JSON.parse(shareUrl.substring(7));
                this.nativeShare(shareData, element);
                return;
            }
            
            // Ouvrir popup de partage
            const width = 600;
            const height = 400;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;
            
            window.open(
                shareUrl,
                'bbshare',
                'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',noopener,noreferrer'
            );
            
            bbContents.utils.log('Partage sur', network, data);
        },
        
        // Copier dans le presse-papier
        copyToClipboard: function(text, element, silent) {
            const isSilent = !!silent;
            // Méthode moderne
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    if (!isSilent) {
                        bbContents.modules.share.showFeedback(element, '✓ ' + (bbContents.config.i18n.copied || 'Lien copié !'));
                    }
                }).catch(function() {
                    bbContents.modules.share.fallbackCopy(text, element, isSilent);
                });
            } else {
                // Fallback pour environnements sans Clipboard API
                this.fallbackCopy(text, element, isSilent);
            }
        },
        
        // Fallback copie
        fallbackCopy: function(text, element, silent) {
            const isSilent = !!silent;
            // Pas de UI si silencieux (exigence produit)
            if (isSilent) return;
            try {
                // Afficher un prompt natif pour permettre à l'utilisateur de copier manuellement
                // (solution universelle sans execCommand)
                window.prompt('Copiez le lien ci-dessous (Ctrl/Cmd+C) :', text);
            } catch (err) {
                // Dernier recours: ne rien faire
            }
        },
        
        // Partage natif (Web Share API)
        nativeShare: function(data, element) {
            // Vérifier si Web Share API est disponible
            if (navigator.share) {
                navigator.share({
                    title: data.text,
                    url: data.url
                }).then(function() {
                    bbContents.utils.log('Partage natif réussi');
                }).catch(function(error) {
                    if (error.name !== 'AbortError') {
                        console.error('[BB Contents] Erreur partage natif:', error);
                        // Fallback vers copie si échec
                        bbContents.modules.share.copyToClipboard(data.url, element, false);
                    }
                });
            } else {
                // Fallback si Web Share API non disponible
                bbContents.utils.log('Web Share API non disponible, fallback vers copie');
                this.copyToClipboard(data.url, element, false);
            }
        },
        
        // Feedback visuel
        showFeedback: function(element, message) {
            const originalText = element.textContent;
            element.textContent = message;
            element.style.pointerEvents = 'none';
            
            setTimeout(function() {
                element.textContent = originalText;
                element.style.pointerEvents = '';
            }, 2000);
        }
    };

    // ========================================
    // MODULE: CURRENT YEAR (Année courante)
    // ========================================
    bbContents.modules.currentYear = {
        detect: function(scope) {
            const s = scope || document;
            return s.querySelector(bbContents._attrSelector('current-year')) !== null;
        },
        init: function(root) {
            const scope = root || document;
            if (scope.closest && scope.closest('[data-bb-disable]')) return;
            const elements = scope.querySelectorAll(bbContents._attrSelector('current-year'));

            const year = String(new Date().getFullYear());
            elements.forEach(function(element) {
                if (element.bbProcessed) return;
                element.bbProcessed = true;

                const customFormat = bbContents._getAttr(element, 'bb-current-year-format');
                const prefix = bbContents._getAttr(element, 'bb-current-year-prefix');
                const suffix = bbContents._getAttr(element, 'bb-current-year-suffix');

                if (customFormat && customFormat.includes('{year}')) {
                    element.textContent = customFormat.replace('{year}', year);
                } else if (prefix || suffix) {
                    element.textContent = prefix + year + suffix;
                } else {
                    element.textContent = year;
                }
            });

            bbContents.utils.log('Module CurrentYear initialisé:', elements.length, 'éléments');
        }
    };



    // ========================================
    // MODULE: READING TIME (Temps de lecture)
    // ========================================
    bbContents.modules.readingTime = {
        detect: function(scope) {
            const s = scope || document;
            return s.querySelector(bbContents._attrSelector('reading-time')) !== null;
        },
        init: function(root) {
            const scope = root || document;
            if (scope.closest && scope.closest('[data-bb-disable]')) return;
            const elements = scope.querySelectorAll(bbContents._attrSelector('reading-time'));

            elements.forEach(function(element) {
                if (element.bbProcessed) return;
                element.bbProcessed = true;

                const targetSelector = bbContents._getAttr(element, 'bb-reading-time-target');
                const speedAttr = bbContents._getAttr(element, 'bb-reading-time-speed');
                const imageSpeedAttr = bbContents._getAttr(element, 'bb-reading-time-image-speed');
                const format = bbContents._getAttr(element, 'bb-reading-time-format') || '{minutes} min';

                const wordsPerMinute = Number(speedAttr) > 0 ? Number(speedAttr) : 230;
                const secondsPerImage = Number(imageSpeedAttr) > 0 ? Number(imageSpeedAttr) : 12;
                
                // Validation des valeurs
                if (isNaN(wordsPerMinute) || wordsPerMinute <= 0) {
                    bbContents.utils.log('Vitesse de lecture invalide, utilisation de la valeur par défaut (230)');
                }
                if (isNaN(secondsPerImage) || secondsPerImage < 0) {
                    bbContents.utils.log('Temps par image invalide, utilisation de la valeur par défaut (12)');
                }

                let sourceNode = element;
                if (targetSelector) {
                    const found = document.querySelector(targetSelector);
                    if (found) sourceNode = found;
                }

                const text = (sourceNode.textContent || '').trim();
                const wordCount = text ? (text.match(/\b\w+\b/g) || []).length : 0;
                
                // Compter les images dans le contenu ciblé
                const images = sourceNode.querySelectorAll('img');
                const imageCount = images.length;
                const imageTimeInMinutes = (imageCount * secondsPerImage) / 60;
                
                let minutesFloat = (wordCount / wordsPerMinute) + imageTimeInMinutes;
                let minutes = Math.ceil(minutesFloat);

                if ((wordCount > 0 || imageCount > 0) && minutes < 1) minutes = 1; // affichage minimal 1 min si contenu non vide
                if (wordCount === 0 && imageCount === 0) minutes = 0;

                const output = format.replace('{minutes}', String(minutes));
                element.textContent = output;
            });

            bbContents.utils.log('Module ReadingTime initialisé:', elements.length, 'éléments');
        }
    };

    // ========================================
    // MODULE: FAVICON (Favicon Dynamique)
    // ========================================
    bbContents.modules.favicon = {
        originalFavicon: null,
        
        // Détection
        detect: function(scope) {
            const s = scope || document;
            return s.querySelector(bbContents._attrSelector('favicon')) !== null;
        },
        
        // Initialisation
        init: function(root) {
            const scope = root || document;
            if (scope.closest && scope.closest('[data-bb-disable]')) return;
            
            // Chercher les éléments avec bb-favicon ou bb-favicon-dark
            const elements = scope.querySelectorAll(bbContents._attrSelector('favicon') + ', ' + bbContents._attrSelector('favicon-dark'));
            if (elements.length === 0) return;
            
            // Sauvegarder le favicon original
            const existingLink = document.querySelector("link[rel*='icon']");
            if (existingLink) {
                this.originalFavicon = existingLink.href;
            }
            
            // Collecter les URLs depuis tous les éléments
            let faviconUrl = null;
            let darkUrl = null;
            
            elements.forEach(function(element) {
                const light = bbContents._getAttr(element, 'bb-favicon') || bbContents._getAttr(element, 'favicon');
                const dark = bbContents._getAttr(element, 'bb-favicon-dark') || bbContents._getAttr(element, 'favicon-dark');
                
                if (light) faviconUrl = light;
                if (dark) darkUrl = dark;
            });
            
            // Appliquer la logique
            if (faviconUrl && darkUrl) {
                this.setupDarkMode(faviconUrl, darkUrl);
            } else if (faviconUrl) {
                this.setFavicon(faviconUrl);
                bbContents.utils.log('Favicon changé:', faviconUrl);
            }
        },
        
        // Helper: Récupérer ou créer un élément favicon
        getFaviconElement: function() {
            let favicon = document.querySelector('link[rel="icon"]') ||
                document.querySelector('link[rel="shortcut icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            return favicon;
        },
        
        // Changer le favicon
        setFavicon: function(url) {
            if (!url) return;
            
            // Ajouter un timestamp pour forcer le rafraîchissement du cache
            const cacheBuster = '?v=' + Date.now();
            const urlWithCacheBuster = url + cacheBuster;
            
            const favicon = this.getFaviconElement();
            favicon.href = urlWithCacheBuster;
        },
        
        // Support dark mode (méthode simplifiée et directe)
        setupDarkMode: function(lightUrl, darkUrl) {
            // Fonction pour mettre à jour le favicon selon le mode sombre
            const updateFavicon = function(e) {
                const darkModeOn = e ? e.matches : window.matchMedia('(prefers-color-scheme: dark)').matches;
                const selectedUrl = darkModeOn ? darkUrl : lightUrl;
                bbContents.modules.favicon.setFavicon(selectedUrl);
            };
            
            // Initialiser le favicon au chargement de la page
            updateFavicon();
            
            // Écouter les changements du mode sombre
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (typeof darkModeMediaQuery.addEventListener === 'function') {
                darkModeMediaQuery.addEventListener('change', updateFavicon);
            } else if (typeof darkModeMediaQuery.addListener === 'function') {
                darkModeMediaQuery.addListener(updateFavicon);
            }
        }
    };

    // ========================================
    // MODULE: MARQUEE (Défilement Infini)
    // ========================================
    bbContents.modules.marquee = {
        // Détection
        detect: function(scope) {
            const s = scope || document;
            return s.querySelector(bbContents._attrSelector('marquee')) !== null;
        },
        
        // Initialisation
        init: function(root) {
            const scope = root || document;
            if (scope.closest && scope.closest('[data-bb-disable]')) return;
            const elements = scope.querySelectorAll(bbContents._attrSelector('marquee'));

            elements.forEach(function(element) {
                if (element.bbProcessed) return;
                element.bbProcessed = true;

                // Récupérer les options
                const speed = bbContents._getAttr(element, 'bb-marquee-speed') || '100';
                const direction = bbContents._getAttr(element, 'bb-marquee-direction') || 'left';
                const pauseOnHover = bbContents._getAttr(element, 'bb-marquee-pause') || 'true';
                const gap = bbContents._getAttr(element, 'bb-marquee-gap') || '50';
                const orientation = bbContents._getAttr(element, 'bb-marquee-orientation') || 'horizontal';
                const height = bbContents._getAttr(element, 'bb-marquee-height') || '300';

                // Sauvegarder le contenu original
                const originalHTML = element.innerHTML;
                
                // Créer le conteneur principal
                const mainContainer = document.createElement('div');
                const isVertical = orientation === 'vertical';
                mainContainer.style.cssText = `
                    position: relative;
                    width: 100%;
                    height: ${isVertical ? height + 'px' : 'auto'};
                    overflow: hidden;
                    min-height: ${isVertical ? '100px' : '50px'};
                `;

                // Créer le conteneur de défilement
                const scrollContainer = document.createElement('div');
                scrollContainer.style.cssText = `
                    position: absolute;
                    will-change: transform;
                    height: 100%;
                    top: 0px;
                    left: 0px;
                    display: flex;
                    ${isVertical ? 'flex-direction: column;' : ''}
                    align-items: center;
                    gap: ${gap}px;
                    ${isVertical ? '' : 'white-space: nowrap;'}
                    flex-shrink: 0;
                `;

                // Créer le bloc de contenu principal
                const mainBlock = document.createElement('div');
                mainBlock.innerHTML = originalHTML;
                mainBlock.style.cssText = `
                    display: flex;
                    ${isVertical ? 'flex-direction: column;' : ''}
                    align-items: center;
                    gap: ${gap}px;
                    ${isVertical ? '' : 'white-space: nowrap;'}
                    flex-shrink: 0;
                    ${isVertical ? 'min-height: 100px;' : ''}
                `;

                // Créer plusieurs répétitions pour un défilement continu
                const repeatBlock1 = mainBlock.cloneNode(true);
                const repeatBlock2 = mainBlock.cloneNode(true);
                const repeatBlock3 = mainBlock.cloneNode(true);
                
                // Assembler la structure
                scrollContainer.appendChild(mainBlock);
                scrollContainer.appendChild(repeatBlock1);
                scrollContainer.appendChild(repeatBlock2);
                scrollContainer.appendChild(repeatBlock3);
                mainContainer.appendChild(scrollContainer);
                
                // Vider et remplacer le contenu original
                element.innerHTML = '';
                element.appendChild(mainContainer);

                // Fonction pour initialiser l'animation
                const initAnimation = () => {
                    // Attendre que le contenu soit dans le DOM
                    requestAnimationFrame(() => {
                        const contentWidth = mainBlock.offsetWidth;
                        const contentHeight = mainBlock.offsetHeight;
                        
                        // Debug
                        bbContents.utils.log('Debug - Largeur du contenu:', contentWidth, 'px', 'Hauteur:', contentHeight, 'px', 'Enfants:', mainBlock.children.length, 'Vertical:', isVertical, 'Direction:', direction);
                        
                        // Si pas de contenu, réessayer
                        if ((isVertical && contentHeight === 0) || (!isVertical && contentWidth === 0)) {
                            bbContents.utils.log('Contenu non prêt, nouvelle tentative dans 200ms');
                            setTimeout(initAnimation, 200);
                            return;
                        }
                        
                        // Pour le vertical, s'assurer qu'on a une hauteur minimale
                        if (isVertical && contentHeight < 50) {
                            bbContents.utils.log('Hauteur insuffisante pour le marquee vertical (' + contentHeight + 'px), nouvelle tentative dans 200ms');
                            setTimeout(initAnimation, 200);
                            return;
                        }
                        
                        if (isVertical) {
                            // Animation JavaScript pour le vertical
                            const contentSize = contentHeight;
                            const totalSize = contentSize * 4 + parseInt(gap) * 3; // 4 copies au lieu de 3
                            scrollContainer.style.height = totalSize + 'px';
                            
                            let currentPosition = direction === 'bottom' ? -contentSize - parseInt(gap) : 0;
                            const step = (parseFloat(speed) * 2) / 60; // Vitesse différente
                            let isPaused = false;
                            
                            // Fonction d'animation JavaScript
                            const animate = () => {
                                if (!isPaused) {
                                    if (direction === 'bottom') {
                                        currentPosition += step;
                                        if (currentPosition >= 0) {
                                            currentPosition = -contentSize - parseInt(gap);
                                        }
                                    } else {
                                        currentPosition -= step;
                                        if (currentPosition <= -contentSize - parseInt(gap)) {
                                            currentPosition = 0;
                                        }
                                    }
                                    
                                    scrollContainer.style.transform = `translate3d(0px, ${currentPosition}px, 0px)`;
                                }
                                requestAnimationFrame(animate);
                            };
                            
                            // Démarrer l'animation
                            animate();
                            
                            bbContents.utils.log('Marquee vertical créé avec animation JS - direction:', direction, 'taille:', contentSize + 'px', 'total:', totalSize + 'px', 'hauteur-wrapper:', height + 'px');
                            
                            // Pause au survol
                            if (pauseOnHover === 'true') {
                                element.addEventListener('mouseenter', function() {
                                    isPaused = true;
                                });
                                element.addEventListener('mouseleave', function() {
                                    isPaused = false;
                                });
                            }
                        } else {
                            // Animation CSS pour l'horizontal (modifiée)
                            const contentSize = contentWidth;
                            const totalSize = contentSize * 4 + parseInt(gap) * 3; // 4 copies au lieu de 3
                            scrollContainer.style.width = totalSize + 'px';
                            
                            // Créer l'animation CSS optimisée
                            const animationName = 'bb-scroll-' + Math.random().toString(36).substr(2, 9);
                            const animationDuration = (totalSize / (parseFloat(speed) * 1.5)).toFixed(2) + 's'; // Vitesse différente
                            
                            // Animation avec translate3d pour hardware acceleration
                            let keyframes;
                            if (direction === 'right') {
                                keyframes = `@keyframes ${animationName} {
                                    0% { transform: translate3d(-${contentSize + parseInt(gap)}px, 0px, 0px); }
                                    100% { transform: translate3d(0px, 0px, 0px); }
                                }`;
                            } else {
                                // Direction 'left' par défaut
                                keyframes = `@keyframes ${animationName} {
                                    0% { transform: translate3d(0px, 0px, 0px); }
                                    100% { transform: translate3d(-${contentSize + parseInt(gap)}px, 0px, 0px); }
                                }`;
                            }

                            // Ajouter les styles
                            const style = document.createElement('style');
                            style.textContent = keyframes;
                            document.head.appendChild(style);

                            // Appliquer l'animation
                            scrollContainer.style.animation = `${animationName} ${animationDuration} linear infinite`;
                            
                            bbContents.utils.log('Marquee horizontal créé:', animationName, 'durée:', animationDuration + 's', 'direction:', direction, 'taille:', contentSize + 'px', 'total:', totalSize + 'px');

                            // Pause au survol
                            if (pauseOnHover === 'true') {
                                element.addEventListener('mouseenter', function() {
                                    scrollContainer.style.animationPlayState = 'paused';
                                });
                                element.addEventListener('mouseleave', function() {
                                    scrollContainer.style.animationPlayState = 'running';
                                });
                            }
                        }
                    });
                };
                
                // Démarrer l'initialisation
                setTimeout(initAnimation, isVertical ? 300 : 100);
            });

            bbContents.utils.log('Module Marquee initialisé:', elements.length, 'éléments');
        }
    };



    // Exposer globalement
    window.bbContents = bbContents;

    // Initialisation automatique avec délai pour éviter le blocage
    function initBBContents() {
        // Attendre que la page soit prête
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                // Délai pour éviter le blocage du rendu
                setTimeout(function() {
                    bbContents.init();
                }, 100);
            });
        } else {
            // Délai pour éviter le blocage du rendu
            setTimeout(function() {
                bbContents.init();
            }, 100);
        }
    }

    // Initialisation
    initBBContents();

    // Message de confirmation
    console.log(
        '%cBeBranded Contents v' + config.version + ' chargé avec succès !',
        'color: #422eff; font-weight: bold; font-size: 14px;'
    );
})();