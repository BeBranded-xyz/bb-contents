/**
 * BeBranded Contents
 * Contenus additionnels français pour Webflow
 * @version 1.0.64-beta
 * @author BeBranded
 * @license MIT
 * @website https://www.bebranded.xyz
 */
(function() {
    'use strict';

    // Créer l'objet temporaire pour la configuration si il n'existe pas
    if (!window._bbContentsConfig) {
        window._bbContentsConfig = {};
    }

    // Protection contre le double chargement
    if (window.bbContents) {
        console.warn('BeBranded Contents est déjà chargé');
        return;
    }
    
    // Vérifier si la version a déjà été affichée
    if (window._bbContentsVersionDisplayed) {
        return;
    }
    window._bbContentsVersionDisplayed = true;
    
    // Protection supplémentaire contre la double initialisation
    if (window._bbContentsInitialized) {
        return;
    }
    window._bbContentsInitialized = true;

    // Configuration
    const config = {
        version: '1.0.64-beta',
        debug: true, // Debug activé pour diagnostic
        prefix: 'bb-', // utilisé pour générer les sélecteurs (data-bb-*)
        youtubeEndpoint: null, // URL du worker YouTube (à définir par l'utilisateur)
        i18n: {
            copied: 'Lien copié !'
        }
    };
    
    // Détecter la configuration YouTube définie avant le chargement
    if (window.bbContents && window.bbContents.config && window.bbContents.config.youtubeEndpoint) {
        config.youtubeEndpoint = window.bbContents.config.youtubeEndpoint;
    }
    
    // Détecter la configuration dans l'objet temporaire
    if (window._bbContentsConfig && window._bbContentsConfig.youtubeEndpoint) {
        config.youtubeEndpoint = window._bbContentsConfig.youtubeEndpoint;
    }

    // Objet principal
    const bbContents = {
        config: config,
        modules: {},
        _observer: null,
        _reinitScheduled: false,
        _initRetryCount: 0,
        _maxInitRetries: 3,
        _performanceBoostDetected: false,
        
        // Utilitaires
        utils: {
            log: function(...args) {
                if (bbContents.config.debug) {
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
        
        // Helper: construire des sélecteurs d'attributs selon le prefix
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
            // Console simple et épurée
            console.log('bb-contents | v' + this.config.version);
            
            this.utils.log('Initialisation v' + this.config.version);
            
            // Debug environnement supprimé pour console propre
            
            // Détection du bb-performance-boost
            this._performanceBoostDetected = document.body.hasAttribute('bb-performance-boost');
            if (this._performanceBoostDetected) {
                // bb-performance-boost détecté - mode de compatibilité activé
            }
            
            // Déterminer la portée
            const scope = document.querySelector('[data-bb-scope]') || document;

            // Initialiser seulement les modules qui ont des attributs sur la page courante
            Object.keys(this.modules).forEach(function(moduleName) {
                const module = bbContents.modules[moduleName];
                if (module.detect && module.detect(scope)) {
                    // Module détecté
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
            
            // Vérifier et réinitialiser les éléments non initialisés
            this.checkAndReinitFailedElements();
        },
        
        // Nouvelle méthode pour vérifier et réinitialiser les éléments échoués
        checkAndReinitFailedElements: function() {
            const scope = document.querySelector('[data-bb-scope]') || document;
            let needsReinit = false;
            
            // Vérifier les marquees non initialisés
            const marqueeElements = scope.querySelectorAll('[bb-marquee]:not([data-bb-marquee-processed])');
            if (marqueeElements.length > 0) {
                // Marquees non initialisés détectés
                needsReinit = true;
            }
            
            // Vérifier les autres modules si nécessaire
            Object.keys(this.modules).forEach(function(moduleName) {
                const module = bbContents.modules[moduleName];
                if (module.checkFailed && module.checkFailed(scope)) {
                    // Module a des éléments échoués
                    needsReinit = true;
                }
            });
            
            // Réinitialiser si nécessaire et si on n'a pas dépassé le nombre max de tentatives
            if (needsReinit && this._initRetryCount < this._maxInitRetries) {
                this._initRetryCount++;
                // Tentative de réinitialisation
                
                const delay = this._performanceBoostDetected ? 1000 * this._initRetryCount : 500 * this._initRetryCount;
                setTimeout(() => {
                    this.init();
                }, delay); // Délai progressif adaptatif
            }
        },
        
        // Méthode publique pour forcer la réinitialisation
        reinit: function() {
            this._initRetryCount = 0;
            this.init();
        },
        
        // Méthode pour détecter la configuration YouTube définie après le chargement
        checkYouTubeConfig: function() {
            // Vérifier si la configuration a été définie après le chargement
            if (this.config.youtubeEndpoint) {
                return true;
            }
            
            // Vérifier dans l'objet temporaire
            if (window._bbContentsConfig && window._bbContentsConfig.youtubeEndpoint) {
                this.config.youtubeEndpoint = window._bbContentsConfig.youtubeEndpoint;
                return true;
            }
            
            return false;
        },

        // Observer DOM pour contenu dynamique
        setupObserver: function() {
            if (this._observer) {
                this._observer.disconnect();
            }

            this._observer = new MutationObserver((mutations) => {
                let shouldReinit = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Element node
                                // Vérifier si le nouveau nœud ou ses enfants ont des attributs bb-*
                                if (node.querySelector && (
                                    node.querySelector('[bb-]') || 
                                    node.querySelector('[data-bb-]') ||
                                    node.matches && (node.matches('[bb-]') || node.matches('[data-bb-]'))
                                )) {
                                    shouldReinit = true;
                                }
                            }
                        });
                    }
                });

                if (shouldReinit && !this._reinitScheduled) {
                    this._reinitScheduled = true;
                    const delay = this._performanceBoostDetected ? 200 : 100;
                    setTimeout(() => {
                        this.init();
                        this._reinitScheduled = false;
                    }, delay);
                }
            });

            this._observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            this.utils.log('MutationObserver actif');
        }
    };

    // Modules
    bbContents.modules = {
        // Module Marquee - Version 1.0.37-beta robuste avec attente window.load et vérification images
        marquee: {
            detect: function(scope) {
                const s = scope || document;
                return s.querySelector(bbContents._attrSelector('marquee')) !== null;
            },
            
            // Nouvelle méthode pour vérifier les éléments échoués
            checkFailed: function(scope) {
                const s = scope || document;
                const failedElements = s.querySelectorAll('[bb-marquee]:not([data-bb-marquee-processed])');
                return failedElements.length > 0;
            },
            
            init: function(root) {
                const scope = root || document;
                if (scope.closest && scope.closest('[data-bb-disable]')) return;
                const elements = scope.querySelectorAll(bbContents._attrSelector('marquee'));

                console.log('🔍 [DEBUG MARQUEE] DÉBUT INITIALISATION');
                console.log('🔍 [DEBUG MARQUEE] Éléments trouvés:', elements.length);
                console.log('🔍 [DEBUG MARQUEE] Éléments:', elements);

                // Initialisation séquentielle de haut en bas - Hero en priorité
                let currentIndex = 0;
                
                const initNextMarquee = () => {
                    console.log(`🔍 [DEBUG MARQUEE] initNextMarquee appelé - currentIndex: ${currentIndex}/${elements.length}`);
                    
                    if (currentIndex >= elements.length) {
                        console.log('✅ [DEBUG MARQUEE] TOUS LES MARQUEES INITIALISÉS:', elements.length, 'éléments');
                        return;
                    }
                    
                    const element = elements[currentIndex];
                    console.log(`🔍 [DEBUG MARQUEE] Traitement marquee ${currentIndex + 1}:`, element);
                    console.log(`🔍 [DEBUG MARQUEE] bbProcessed:`, element.bbProcessed);
                    console.log(`🔍 [DEBUG MARQUEE] data-bb-youtube-processed:`, element.hasAttribute('data-bb-youtube-processed'));
                    currentIndex++;
                    
                    // Vérifier si l'élément a déjà été traité par un autre module
                    if (element.bbProcessed || element.hasAttribute('data-bb-youtube-processed')) {
                        console.log('⚠️ [DEBUG MARQUEE] Élément déjà traité, passage au suivant');
                        // Passer au suivant immédiatement
                        setTimeout(initNextMarquee, 0);
                        return;
                    }
                    element.bbProcessed = true;
                    console.log('✅ [DEBUG MARQUEE] Élément marqué comme traité');

                    // Récupérer les options
                    const speed = bbContents._getAttr(element, 'bb-marquee-speed') || '100';
                    const direction = bbContents._getAttr(element, 'bb-marquee-direction') || 'left';
                    const pauseOnHover = bbContents._getAttr(element, 'bb-marquee-pause') || 'true';
                    const gap = bbContents._getAttr(element, 'bb-marquee-gap') || '50';
                    const orientation = bbContents._getAttr(element, 'bb-marquee-orientation') || 'horizontal';
                    const height = bbContents._getAttr(element, 'bb-marquee-height') || '300';
                    const minHeight = bbContents._getAttr(element, 'bb-marquee-min-height');
                    
                    console.log(`🔍 [DEBUG MARQUEE] Options récupérées:`, {
                        speed, direction, pauseOnHover, gap, orientation, height, minHeight
                    });

                    // Sauvegarder le contenu original
                    const originalHTML = element.innerHTML;
                    
                    // Créer le conteneur principal
                    const mainContainer = document.createElement('div');
                    const isVertical = orientation === 'vertical';
                    const useAutoHeight = isVertical && height === 'auto';
                    
                    mainContainer.style.cssText = `
                        position: relative;
                        width: 100%;
                        height: ${isVertical ? (height === 'auto' ? 'auto' : height + 'px') : 'auto'};
                        overflow: hidden;
                        min-height: ${isVertical ? '100px' : '50px'};
                        ${minHeight ? `min-height: ${minHeight};` : ''}
                    `;

                    // Créer le conteneur de défilement
                    const scrollContainer = document.createElement('div');
                    scrollContainer.style.cssText = `
                        ${useAutoHeight ? 'position: relative;' : 'position: absolute;'}
                        will-change: transform;
                        ${useAutoHeight ? '' : 'height: 100%; top: 0px; left: 0px;'}
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
                    
                    // Marquer l'élément comme traité par le module marquee
                    element.setAttribute('data-bb-marquee-processed', 'true');

                    // Fonction pour initialiser l'animation avec retry amélioré - Version 1.0.37-beta robuste
                    const initAnimation = (retryCount = 0) => {
                        console.log(`🔍 [DEBUG MARQUEE] initAnimation appelé - retryCount: ${retryCount}`);
                        // Attendre que le contenu soit dans le DOM
                        requestAnimationFrame(() => {
                            const contentWidth = mainBlock.offsetWidth;
                            const contentHeight = mainBlock.offsetHeight;
                            
                            console.log(`🔍 [DEBUG MARQUEE] Dimensions calculées:`, {
                                contentWidth, contentHeight, 
                                children: mainBlock.children.length, 
                                isVertical, direction, 
                                retryCount: retryCount + 1
                            });
                            
                            // Vérifier que les images sont chargées
                            const images = mainBlock.querySelectorAll('img');
                            const imagesLoaded = Array.from(images).every(img => img.complete && img.naturalHeight > 0);
                            
                            console.log(`🔍 [DEBUG MARQUEE] Images:`, {
                                total: images.length,
                                loaded: imagesLoaded,
                                images: Array.from(images).map(img => ({
                                    complete: img.complete,
                                    naturalHeight: img.naturalHeight,
                                    src: img.src
                                }))
                            });
                            
                            // Si pas de contenu, réessayer avec délai progressif
                            if ((isVertical && contentHeight === 0) || (!isVertical && contentWidth === 0)) {
                                if (retryCount < 8) { // Plus de tentatives
                                    console.log(`⚠️ [DEBUG MARQUEE] Contenu non prêt, retry ${retryCount + 1}/8 dans ${200 + retryCount * 100}ms`);
                                    setTimeout(() => initAnimation(retryCount + 1), 200 + retryCount * 100);
                                    return;
                                } else {
                                    console.log('❌ [DEBUG MARQUEE] Échec d\'initialisation après 8 tentatives');
                                    return;
                                }
                            }
                            
                            // Pour le vertical, s'assurer qu'on a une hauteur minimale
                            if (isVertical && contentHeight < 50) {
                                if (retryCount < 8) { // Plus de tentatives
                                    console.log(`⚠️ [DEBUG MARQUEE] Hauteur insuffisante (${contentHeight}px), retry ${retryCount + 1}/8`);
                                    setTimeout(() => initAnimation(retryCount + 1), 200 + retryCount * 100);
                                    return;
                                } else {
                                    console.log('❌ [DEBUG MARQUEE] Échec - hauteur insuffisante après 8 tentatives');
                                    return;
                                }
                            }
                            
                            // Vérifier que les images sont chargées
                            if (!imagesLoaded && images.length > 0) {
                                if (retryCount < 8) { // Plus de tentatives
                                    console.log(`⚠️ [DEBUG MARQUEE] Images non chargées, retry ${retryCount + 1}/8`);
                                    setTimeout(() => initAnimation(retryCount + 1), 200 + retryCount * 100);
                                    return;
                                } else {
                                    console.log('❌ [DEBUG MARQUEE] Échec - images non chargées après 8 tentatives');
                                    return;
                                }
                            }
                        
                            if (isVertical) {
                                console.log('✅ [DEBUG MARQUEE] INITIALISATION VERTICALE');
                                // Animation JavaScript pour le vertical
                                const contentSize = contentHeight;
                                const totalSize = contentSize * 4 + parseInt(gap) * 3; // 4 copies au lieu de 3
                                
                                console.log(`🔍 [DEBUG MARQUEE] Vertical - contentSize: ${contentSize}px, totalSize: ${totalSize}px`);
                                
                                // Ajuster la hauteur du scrollContainer seulement si pas en mode auto
                                if (!useAutoHeight) {
                                    scrollContainer.style.height = totalSize + 'px';
                                }
                                
                                let currentPosition = direction === 'bottom' ? -contentSize - parseInt(gap) : 0;
                                const step = (parseFloat(speed) * 2) / 60; // Vitesse différente
                                let isPaused = false;
                                
                                console.log(`🔍 [DEBUG MARQUEE] Vertical - currentPosition: ${currentPosition}, step: ${step}, direction: ${direction}`);
                                
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
                                
                                console.log('✅ [DEBUG MARQUEE] Marquee vertical créé avec animation JS');
                                
                                // Pause au survol
                                if (pauseOnHover === 'true') {
                                    element.addEventListener('mouseenter', function() {
                                        isPaused = true;
                                    });
                                    element.addEventListener('mouseleave', function() {
                                        isPaused = false;
                                    });
                                }
                            
                                // Marquee vertical créé avec animation JS
                            } else {
                                console.log('✅ [DEBUG MARQUEE] INITIALISATION HORIZONTALE');
                                // Animation JavaScript pour l'horizontal (comme le vertical pour éviter les saccades)
                                const contentSize = contentWidth;
                                const totalSize = contentSize * 4 + parseInt(gap) * 3;
                                scrollContainer.style.width = totalSize + 'px';
                                
                                console.log(`🔍 [DEBUG MARQUEE] Horizontal - contentSize: ${contentSize}px, totalSize: ${totalSize}px`);
                                
                                let currentPosition = direction === 'right' ? -contentSize - parseInt(gap) : 0;
                                const step = (parseFloat(speed) * 0.5) / 60; // Vitesse réduite pour l'horizontal
                                let isPaused = false;
                                
                                console.log(`🔍 [DEBUG MARQUEE] Horizontal - currentPosition: ${currentPosition}, step: ${step}, direction: ${direction}`);
                                
                                // Fonction d'animation JavaScript
                                const animate = () => {
                                    if (!isPaused) {
                                        if (direction === 'right') {
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
                                        
                                        scrollContainer.style.transform = `translate3d(${currentPosition}px, 0px, 0px)`;
                                    }
                                    requestAnimationFrame(animate);
                                };
                                
                                // Démarrer l'animation
                                animate();
                                
                                console.log('✅ [DEBUG MARQUEE] Marquee horizontal créé avec animation JS');
                                
                                // Pause au survol
                                if (pauseOnHover === 'true') {
                                    element.addEventListener('mouseenter', function() {
                                        isPaused = true;
                                    });
                                    element.addEventListener('mouseleave', function() {
                                        isPaused = false;
                                    });
                                }
                                
                                // Marquee horizontal créé avec animation JS
                            }
                        });
                    };
                    
                    // Démarrer l'initialisation avec délai adaptatif - Initialisation séquentielle
                    const baseDelay = isVertical ? 800 : 400; // Délais fixes selon le type
                    
                    console.log(`🔍 [DEBUG MARQUEE] Marquee ${currentIndex} (${isVertical ? 'vertical' : 'horizontal'}) initialisé dans ${baseDelay}ms`);
                    setTimeout(() => {
                        console.log(`🔍 [DEBUG MARQUEE] Démarrage initAnimation pour marquee ${currentIndex}`);
                        initAnimation(0);
                        // Après initialisation, passer au marquee suivant
                        setTimeout(() => {
                            console.log(`🔍 [DEBUG MARQUEE] Passage au marquee suivant après ${currentIndex}`);
                            initNextMarquee();
                        }, 100); // Petit délai entre les marquees
                    }, baseDelay);
                };
                
                // Démarrer l'initialisation séquentielle
                console.log('🔍 [DEBUG MARQUEE] Démarrage de l\'initialisation séquentielle');
                initNextMarquee();
            }
        },

        // Module YouTube Feed
        youtube: {
            // Détection des bots pour éviter les appels API inutiles
            isBot: function() {
                const userAgent = navigator.userAgent.toLowerCase();
                const botPatterns = [
                    'bot', 'crawler', 'spider', 'scraper', 'googlebot', 'bingbot', 'slurp',
                    'duckduckbot', 'baiduspider', 'yandexbot', 'facebookexternalhit', 'twitterbot',
                    'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot', 'slackbot'
                ];
                
                return botPatterns.some(pattern => userAgent.includes(pattern)) || 
                       navigator.webdriver || 
                       !navigator.userAgent;
            },
            
            // Gestion du cache localStorage
            cache: {
                get: function(key) {
                    try {
                        const cached = localStorage.getItem(key);
                        if (!cached) return null;
                        
                        const data = JSON.parse(cached);
                        const now = Date.now();
                        
                        // Cache expiré après 24h
                        if (now - data.timestamp > 24 * 60 * 60 * 1000) {
                            localStorage.removeItem(key);
                            return null;
                        }
                        
                        return data.value;
                    } catch (e) {
                        return null;
                    }
                },
                
                set: function(key, value) {
                    try {
                        const data = {
                            value: value,
                            timestamp: Date.now()
                        };
                        localStorage.setItem(key, JSON.stringify(data));
                    } catch (e) {
                        // Ignorer les erreurs de localStorage
                    }
                }
            },
            
            detect: function(scope) {
                return scope.querySelector('[bb-youtube-channel]') !== null;
            },
            
            init: function(scope) {
                // Vérifier si c'est un bot - pas d'appel API
                if (this.isBot()) {
                    // Bot détecté, pas de chargement YouTube (économie API)
                    return;
                }
                
                // Nettoyer le cache expiré au démarrage
                this.cleanCache();
                
                const elements = scope.querySelectorAll('[bb-youtube-channel]');
                if (elements.length === 0) return;
                
                // Module détecté: youtube
                
                elements.forEach(element => {
                    // Vérifier si l'élément a déjà été traité par un autre module
                    if (element.bbProcessed || element.hasAttribute('data-bb-marquee-processed')) {
                        // Élément youtube déjà traité par un autre module, ignoré
                        return;
                    }
                    element.bbProcessed = true;
                    
                    // Utiliser la nouvelle fonction initElement
                    this.initElement(element);
                });
            },
            
            // Fonction pour initialiser un seul élément YouTube
            initElement: function(element) {
                // Vérifier si c'est un bot - pas d'appel API
                if (this.isBot()) {
                    return;
                }
                
                const channelId = bbContents._getAttr(element, 'bb-youtube-channel');
                const videoCount = bbContents._getAttr(element, 'bb-youtube-video-count') || '10';
                const allowShorts = bbContents._getAttr(element, 'bb-youtube-allow-shorts') === 'true';
                const language = bbContents._getAttr(element, 'bb-youtube-language') || 'fr';
                
                // Vérifier la configuration au moment de l'initialisation
                const endpoint = bbContents.checkYouTubeConfig() ? bbContents.config.youtubeEndpoint : null;
                
                
                if (!channelId) {
                    return;
                }
                
                if (!endpoint) {
                    // Attendre que la configuration soit définie (max 5 secondes)
                    const retryCount = element.getAttribute('data-youtube-retry-count') || '0';
                    const retries = parseInt(retryCount);
                    
                    if (retries < 50) { // 50 * 100ms = 5 secondes max
                        element.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Configuration YouTube en cours...</div>';
                        element.setAttribute('data-youtube-retry-count', (retries + 1).toString());
                        
                        // Réessayer dans 100ms
                        setTimeout(() => {
                            this.initElement(element);
                        }, 100);
                        return;
                    } else {
                        // Timeout après 5 secondes
                        element.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Configuration YouTube manquante</strong><br>Ajoutez dans le &lt;head&gt; :<br><code style="display: block; background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace;">&lt;script&gt;<br>bbContents.config.youtubeEndpoint = \'votre-worker-url\';<br>&lt;/script&gt;</code></div>';
                        return;
                    }
                }
                
                // Chercher le template pour une vidéo (directement dans l'élément ou dans un conteneur)
                let template = element.querySelector('[bb-youtube-item]');
                let container = element;
                
                // Si pas de template direct, chercher dans un conteneur
                if (!template) {
                    const containerElement = element.querySelector('[bb-youtube-container]');
                    if (containerElement) {
                        container = containerElement;
                        template = containerElement.querySelector('[bb-youtube-item]');
                    }
                }
                
                if (!template) {
                    element.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Template manquant</strong><br>Ajoutez un élément avec l\'attribut bb-youtube-item</div>';
                    return;
                }
                
                // Cacher le template original
                template.style.display = 'none';
                
                // Marquer l'élément comme traité par le module YouTube
                element.setAttribute('data-bb-youtube-processed', 'true');
                
                // Vérifier le cache d'abord
                const cacheKey = `youtube_${channelId}_${videoCount}_${allowShorts}_${language}`;
                const cachedData = this.cache.get(cacheKey);
                
                if (cachedData && cachedData.value) {
                    // Données YouTube récupérées du cache (économie API)
                    this.generateYouTubeFeed(container, template, cachedData.value, allowShorts, language);
                    return;
                }
                
                // Vérifier si un appel API est déjà en cours pour cette clé
                const loadingKey = `loading_${cacheKey}`;
                if (window[loadingKey]) {
                    // Attendre que l'autre appel se termine
                    const checkLoading = () => {
                        if (!window[loadingKey]) {
                            // L'autre appel est terminé, vérifier le cache
                            const newCachedData = this.cache.get(cacheKey);
                            if (newCachedData && newCachedData.value) {
                                this.generateYouTubeFeed(container, template, newCachedData.value, allowShorts, language);
                            } else {
                                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Erreur de chargement</div>';
                            }
                        } else {
                            setTimeout(checkLoading, 100);
                        }
                    };
                    checkLoading();
                    return;
                }
                
                // Marquer qu'un appel API est en cours
                window[loadingKey] = true;
                
                // Afficher un loader
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Chargement des vidéos YouTube...</div>';
                
                // Appeler l'API via le Worker
                fetch(`${endpoint}?channelId=${channelId}&maxResults=${videoCount}&allowShorts=${allowShorts}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.error) {
                            throw new Error(data.error.message || 'Erreur API YouTube');
                        }
                        
                        // Sauvegarder en cache pour 24h
                        this.cache.set(cacheKey, data);
                        // Données YouTube mises en cache pour 24h (économie API)
                        
                        this.generateYouTubeFeed(container, template, data, allowShorts, language);
                        
                        // Libérer le verrou
                        window[loadingKey] = false;
                    })
                    .catch(error => {
                        console.error('Erreur API YouTube:', error);
                        // Erreur dans le module youtube
                        
                        // Libérer le verrou en cas d'erreur
                        window[loadingKey] = false;
                        
                        // En cas d'erreur, essayer de récupérer du cache même expiré
                        const expiredCache = localStorage.getItem(cacheKey);
                        if (expiredCache) {
                            try {
                                const cachedData = JSON.parse(expiredCache);
                                // Utilisation du cache expiré en cas d'erreur API
                                this.generateYouTubeFeed(container, template, cachedData.value, allowShorts, language);
                                return;
                            } catch (e) {
                                // Ignorer les erreurs de parsing
                            }
                        }
                        
                        container.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>${error.message}</div>`;
                    });
            },
            
            generateYouTubeFeed: function(container, template, data, allowShorts, language = 'fr') {
                if (!data || !data.items || data.items.length === 0) {
                    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Aucune vidéo trouvée</div>';
                    return;
                }
                
                // Les vidéos sont déjà filtrées par l'API YouTube selon allowShorts
                let videos = data.items;
                // Vidéos reçues de l'API
                
                // Vider le conteneur (en préservant les éléments marquee)
                const marqueeElements = container.querySelectorAll('[data-bb-marquee-processed]');
                container.innerHTML = '';
                
                // Restaurer les éléments marquee si présents
                marqueeElements.forEach(marqueeEl => {
                    container.appendChild(marqueeEl);
                });
                
                // Cloner le template pour chaque vidéo
                videos.forEach(item => {
                    const videoId = item.id.videoId;
                    const snippet = item.snippet;
                    
                    // Cloner le template
                    const clone = template.cloneNode(true);
                    clone.style.display = ''; // Rendre visible
                    
                    // Remplir les données
                    this.fillVideoData(clone, videoId, snippet, language);
                    
                    // Ajouter au conteneur
                    container.appendChild(clone);
                });
                
                // YouTube Feed généré
            },
            
            fillVideoData: function(element, videoId, snippet, language = 'fr') {
                // Remplir le lien directement sur l'élément (link block)
                if (element.tagName === 'A' || element.hasAttribute('bb-youtube-item')) {
                    element.href = `https://www.youtube.com/watch?v=${videoId}`;
                    element.target = '_blank';
                    element.rel = 'noopener noreferrer';
                }
                
                // Remplir la thumbnail (qualité optimisée)
                const thumbnail = element.querySelector('[bb-youtube-thumbnail]');
                if (thumbnail) {
                    // Logique optimisée pour la meilleure qualité disponible
                    let bestThumbnailUrl = null;
                    let bestQuality = 'unknown';
                    
                    // Priorité 1: maxres (1280x720) - qualité maximale
                    if (snippet.thumbnails.maxres?.url) {
                        bestThumbnailUrl = snippet.thumbnails.maxres.url;
                        bestQuality = 'maxres (1280x720)';
                    }
                    // Priorité 2: high (480x360) - bonne qualité pour l'affichage
                    else if (snippet.thumbnails.high?.url) {
                        bestThumbnailUrl = snippet.thumbnails.high.url;
                        bestQuality = 'high (480x360)';
                    }
                    // Priorité 3: medium (320x180) - qualité acceptable en dernier recours
                    else if (snippet.thumbnails.medium?.url) {
                        bestThumbnailUrl = snippet.thumbnails.medium.url;
                        bestQuality = 'medium (320x180)';
                    }
                    // Fallback: default (120x90) - seulement si rien d'autre
                    else if (snippet.thumbnails.default?.url) {
                        bestThumbnailUrl = snippet.thumbnails.default.url;
                        bestQuality = 'default (120x90)';
                    }
                    
                    // Appliquer la meilleure thumbnail trouvée
                    if (bestThumbnailUrl) {
                        thumbnail.src = bestThumbnailUrl;
                        thumbnail.alt = snippet.title;
                        
                        // Debug: logger la qualité utilisée (en mode debug seulement)
                        if (bbContents.config.debug) {
                            // Thumbnail optimisée
                        }
                    } else {
                        // Aucune thumbnail disponible
                    }
                }
                
                // Remplir le titre (avec décodage HTML)
                const title = element.querySelector('[bb-youtube-title]');
                if (title) {
                    title.textContent = this.decodeHtmlEntities(snippet.title);
                }
                
                // Remplir la description (avec décodage HTML)
                const description = element.querySelector('[bb-youtube-description]');
                if (description) {
                    description.textContent = this.decodeHtmlEntities(snippet.description);
                }
                
                // Remplir la date
                const date = element.querySelector('[bb-youtube-date]');
                if (date) {
                    date.textContent = this.formatDate(snippet.publishedAt, language);
                }
                
                // Remplir le nom de la chaîne
                const channel = element.querySelector('[bb-youtube-channel]');
                if (channel) {
                    channel.textContent = snippet.channelTitle;
                }
            },
            
            formatDate: function(dateString, language = 'fr') {
                const date = new Date(dateString);
                const now = new Date();
                const diffTime = Math.abs(now - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Traductions
                const translations = {
                    fr: {
                        day: 'jour',
                        days: 'jours',
                        week: 'semaine',
                        weeks: 'semaines',
                        month: 'mois',
                        months: 'mois',
                        year: 'an',
                        years: 'ans',
                        ago: 'Il y a'
                    },
                    en: {
                        day: 'day',
                        days: 'days',
                        week: 'week',
                        weeks: 'weeks',
                        month: 'month',
                        months: 'months',
                        year: 'year',
                        years: 'years',
                        ago: 'ago'
                    }
                };
                
                const t = translations[language] || translations.fr;
                
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
            
            // Fonction pour décoder les entités HTML
            decodeHtmlEntities: function(text) {
                if (!text) return '';
                const textarea = document.createElement('textarea');
                textarea.innerHTML = text;
                return textarea.value;
            },
            
            // Nettoyer le cache expiré
            cleanCache: function() {
                try {
                    const keys = Object.keys(localStorage);
                    const now = Date.now();
                    let cleaned = 0;
                    
                    keys.forEach(key => {
                        if (key.startsWith('youtube_')) {
                            try {
                                const cached = JSON.parse(localStorage.getItem(key));
                                if (now - cached.timestamp > 24 * 60 * 60 * 1000) {
                                    localStorage.removeItem(key);
                                    cleaned++;
                                }
                            } catch (e) {
                                // Supprimer les clés corrompues
                                localStorage.removeItem(key);
                                cleaned++;
                            }
                        }
                    });
                    
                    if (cleaned > 0) {
                        // Cache YouTube nettoyé
                    }
                } catch (e) {
                    // Ignorer les erreurs de nettoyage
                }
            }
        }
    };

    // Exposer globalement
    window.bbContents = bbContents;
    
    // Méthode globale pour configurer YouTube après le chargement
    window.configureYouTube = function(endpoint) {
        if (bbContents) {
            bbContents.config.youtubeEndpoint = endpoint;
            // Réinitialiser les modules YouTube
            bbContents.reinit();
        }
    };

    // Initialisation automatique avec délai pour éviter le blocage
    function initBBContents() {
        // Attendre que la page soit prête
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                // Délai pour éviter le blocage du rendu
                const delay = document.body.hasAttribute('bb-performance-boost') ? 300 : 100;
                setTimeout(function() {
                    bbContents.init();
                }, delay);
            });
        } else {
            // Délai pour éviter le blocage du rendu
            const delay = document.body.hasAttribute('bb-performance-boost') ? 300 : 100;
            setTimeout(function() {
                bbContents.init();
            }, delay);
        }
        
        // Initialisation différée supplémentaire pour les cas difficiles - Solution cache optimisée
        window.addEventListener('load', function() {
            const loadDelay = document.body.hasAttribute('bb-performance-boost') ? 4000 : 3000; // Délais plus longs pour le cache
            setTimeout(function() {
                // Vérifier s'il y a des éléments non initialisés
                const unprocessedMarquees = document.querySelectorAll('[bb-marquee]:not([data-bb-marquee-processed])');
                if (unprocessedMarquees.length > 0) {
                    // Éléments marquee non initialisés détectés après load, réinitialisation
                    bbContents.reinit();
                }
                
                // Vérification supplémentaire des images chargées - Solution cache optimisée
                const allImages = document.querySelectorAll('img');
                const unloadedImages = Array.from(allImages).filter(img => !img.complete || img.naturalHeight === 0);
                if (unloadedImages.length > 0) {
                    // Images non chargées détectées, attente supplémentaire plus longue
                    setTimeout(() => {
                        bbContents.reinit();
                    }, 2000); // 2 secondes au lieu de 1 seconde
                }
            }, loadDelay);
        });
    }

    // Initialisation
    initBBContents();

    // Message de confirmation supprimé pour une console plus propre
})();