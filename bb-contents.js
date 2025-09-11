/**
 * BeBranded Contents
 * Contenus additionnels français pour Webflow
 * @version 1.0.45-beta
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
        version: '1.0.45-beta',
        debug: true, // Activé temporairement pour debug
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
                console.log('[DEBUG] YouTube endpoint found:', this.config.youtubeEndpoint);
                return true;
            }
            
            // Vérifier dans window.bbContents (au cas où)
            if (window.bbContents && window.bbContents.config && window.bbContents.config.youtubeEndpoint) {
                this.config.youtubeEndpoint = window.bbContents.config.youtubeEndpoint;
                console.log('[DEBUG] YouTube endpoint found in window:', this.config.youtubeEndpoint);
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
        // Module Marquee - Version live 1.0.41-beta avec modules parasites supprimés
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

            elements.forEach(function(element) {
                    // Vérifier si l'élément a déjà été traité par un autre module
                    if (element.bbProcessed || element.hasAttribute('data-bb-youtube-processed')) {
                        // Élément marquee déjà traité par un autre module, ignoré
                        return;
                    }
                element.bbProcessed = true;

                // Récupérer les options
                    const speed = bbContents._getAttr(element, 'bb-marquee-speed') || '100';
                    const direction = bbContents._getAttr(element, 'bb-marquee-direction') || 'left';
                    const pauseOnHover = bbContents._getAttr(element, 'bb-marquee-pause');
                    const gap = bbContents._getAttr(element, 'bb-marquee-gap') || '50';
                    const orientation = bbContents._getAttr(element, 'bb-marquee-orientation') || 'horizontal';
                    const height = bbContents._getAttr(element, 'bb-marquee-height') || '300';
                    const minHeight = bbContents._getAttr(element, 'bb-marquee-min-height');

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
                        transition: transform 0.1s ease-out;
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

                    // Fonction pour initialiser l'animation avec vérification robuste des dimensions
                    const initAnimation = (retryCount = 0) => {
                        // Vérifier que les images sont chargées
                        const images = mainBlock.querySelectorAll('img');
                        const imagesLoaded = Array.from(images).every(img => img.complete && img.naturalHeight > 0);
                        
                        // Attendre que le contenu soit dans le DOM et que les images soient chargées
                    requestAnimationFrame(() => {
                            // Calcul plus robuste des dimensions
                            const rect = mainBlock.getBoundingClientRect();
                            const contentWidth = rect.width || mainBlock.offsetWidth;
                            const contentHeight = rect.height || mainBlock.offsetHeight;
                            
                            // Pour les marquees verticaux, utiliser la largeur du parent si nécessaire
                            let finalWidth = contentWidth;
                            let finalHeight = contentHeight;
                            
                            if (isVertical && contentWidth < 10) {
                                // Si largeur trop petite, utiliser la largeur du parent
                                const parentRect = mainBlock.parentElement.getBoundingClientRect();
                                finalWidth = parentRect.width || mainBlock.parentElement.offsetWidth;
                                // Largeur corrigée pour marquee vertical
                            }
                            
                            // Debug supprimé pour console propre
                            
                            // Vérifications robustes avant initialisation
                            const hasValidDimensions = (isVertical && finalHeight > 50) || (!isVertical && finalWidth > 50);
                            const maxRetries = 8; // Plus de tentatives pour attendre les images
                            
                            // Si pas de contenu valide ou images pas chargées, réessayer
                            if (!hasValidDimensions || !imagesLoaded) {
                                if (retryCount < maxRetries) {
                                    const delay = 300 + retryCount * 200; // Délais plus longs pour attendre les images
                                    // Contenu/images non prêts, nouvelle tentative
                                    setTimeout(() => initAnimation(retryCount + 1), delay);
                                    return;
                                } else {
                                    // Échec d'initialisation après plusieurs tentatives
                            return;
                                }
                        }
                        
                        if (isVertical) {
                            // Animation JavaScript pour le vertical
                                const contentSize = finalHeight;
                            const totalSize = contentSize * 4 + parseInt(gap) * 3; // 4 copies au lieu de 3
                                
                                // Ajuster la hauteur du scrollContainer seulement si pas en mode auto
                                if (!useAutoHeight) {
                            scrollContainer.style.height = totalSize + 'px';
                                }
                            
                            let currentPosition = direction === 'bottom' ? -contentSize - parseInt(gap) : 0;
                                const baseStep = (parseFloat(speed) * 2) / 60; // Vitesse de base
                                let currentStep = baseStep;
                            let isPaused = false;
                                let animationId = null;
                                let lastTime = 0;
                                
                                // Fonction d'animation JavaScript optimisée
                                const animate = (currentTime) => {
                                    if (!lastTime) lastTime = currentTime;
                                    const deltaTime = currentTime - lastTime;
                                    lastTime = currentTime;
                                    
                                    if (direction === 'bottom') {
                                        currentPosition += currentStep * (deltaTime / 16.67); // Normaliser à 60fps
                                        if (currentPosition >= 0) {
                                            currentPosition = -contentSize - parseInt(gap);
                                        }
                                    } else {
                                        currentPosition -= currentStep * (deltaTime / 16.67);
                                        if (currentPosition <= -contentSize - parseInt(gap)) {
                                            currentPosition = 0;
                                        }
                                    }
                                    
                                    scrollContainer.style.transform = `translate3d(0px, ${currentPosition}px, 0px)`;
                                    animationId = requestAnimationFrame(animate);
                            };
                            
                            // Démarrer l'animation
                                animationId = requestAnimationFrame(animate);
                            
                                // Marquee vertical créé avec animation JS
                            
                                // Pause au survol avec transition fluide CSS + JS
                            if (pauseOnHover === 'true') {
                                    // Transition fluide avec easing naturel
                                    const transitionSpeed = (targetSpeed, duration = 300) => {
                                        const startSpeed = currentStep;
                                        const speedDiff = targetSpeed - startSpeed;
                                        const startTime = performance.now();
                                        
                                        // Easing naturel
                                        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
                                        const easeInCubic = (t) => t * t * t;
                                        
                                        const animateTransition = (currentTime) => {
                                            const elapsed = currentTime - startTime;
                                            const progress = Math.min(elapsed / duration, 1);
                                            
                                            // Easing différent selon la direction
                                            const easedProgress = targetSpeed === 0 ? 
                                                easeOutCubic(progress) : easeInCubic(progress);
                                            
                                            currentStep = startSpeed + speedDiff * easedProgress;
                                            
                                            if (progress < 1) {
                                                requestAnimationFrame(animateTransition);
                                            } else {
                                                currentStep = targetSpeed;
                                            }
                                        };
                                        
                                        requestAnimationFrame(animateTransition);
                                    };
                                    
                                element.addEventListener('mouseenter', function() {
                                        transitionSpeed(0); // Ralentir jusqu'à 0
                                });
                                element.addEventListener('mouseleave', function() {
                                        transitionSpeed(baseStep); // Revenir à la vitesse normale
                                });
                            }
                        } else {
                                // Animation JavaScript pour l'horizontal (comme le vertical pour éviter les saccades)
                                const contentSize = finalWidth;
                                const totalSize = contentSize * 4 + parseInt(gap) * 3;
                            scrollContainer.style.width = totalSize + 'px';
                            
                                let currentPosition = direction === 'right' ? -contentSize - parseInt(gap) : 0;
                                const baseStep = (parseFloat(speed) * 0.5) / 60; // Vitesse de base
                                let currentStep = baseStep;
                                let isPaused = false;
                                let animationId = null;
                                let lastTime = 0;
                                
                                // Fonction d'animation JavaScript optimisée
                                const animate = (currentTime) => {
                                    if (!lastTime) lastTime = currentTime;
                                    const deltaTime = currentTime - lastTime;
                                    lastTime = currentTime;
                                    
                            if (direction === 'right') {
                                        currentPosition += currentStep * (deltaTime / 16.67); // Normaliser à 60fps
                                        if (currentPosition >= 0) {
                                            currentPosition = -contentSize - parseInt(gap);
                                        }
                            } else {
                                        currentPosition -= currentStep * (deltaTime / 16.67);
                                        if (currentPosition <= -contentSize - parseInt(gap)) {
                                            currentPosition = 0;
                                        }
                                    }
                                    
                                    scrollContainer.style.transform = `translate3d(${currentPosition}px, 0px, 0px)`;
                                    animationId = requestAnimationFrame(animate);
                                };
                                
                                // Démarrer l'animation
                                animationId = requestAnimationFrame(animate);
                                
                                // Marquee horizontal créé avec animation JS
                                
                                // Pause au survol avec transition fluide CSS + JS
                            if (pauseOnHover === 'true') {
                                    // Transition fluide avec easing naturel
                                    const transitionSpeed = (targetSpeed, duration = 300) => {
                                        const startSpeed = currentStep;
                                        const speedDiff = targetSpeed - startSpeed;
                                        const startTime = performance.now();
                                        
                                        // Easing naturel
                                        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
                                        const easeInCubic = (t) => t * t * t;
                                        
                                        const animateTransition = (currentTime) => {
                                            const elapsed = currentTime - startTime;
                                            const progress = Math.min(elapsed / duration, 1);
                                            
                                            // Easing différent selon la direction
                                            const easedProgress = targetSpeed === 0 ? 
                                                easeOutCubic(progress) : easeInCubic(progress);
                                            
                                            currentStep = startSpeed + speedDiff * easedProgress;
                                            
                                            if (progress < 1) {
                                                requestAnimationFrame(animateTransition);
                                            } else {
                                                currentStep = targetSpeed;
                                            }
                                        };
                                        
                                        requestAnimationFrame(animateTransition);
                                    };
                                    
                                element.addEventListener('mouseenter', function() {
                                        transitionSpeed(0); // Ralentir jusqu'à 0
                                });
                                element.addEventListener('mouseleave', function() {
                                        transitionSpeed(baseStep); // Revenir à la vitesse normale
                                });
                            }
                        }
                    });
                };
                
                    // Démarrer l'initialisation avec délai adaptatif - Option 1: Attendre que tout soit prêt
                    let initDelay = isVertical ? 500 : 200; // Délais plus longs par défaut
                    if (bbContents._performanceBoostDetected) {
                        initDelay = isVertical ? 800 : 500; // Délais encore plus longs avec bb-performance-boost
                    }
                    
                    // Attendre window.load si pas encore déclenché
                    if (document.readyState !== 'complete') {
                        // Attente de window.load pour initialiser le marquee
                        window.addEventListener('load', () => {
                            setTimeout(() => initAnimation(0), initDelay);
                        });
                    } else {
                        // window.load déjà déclenché, initialiser directement
                        setTimeout(() => initAnimation(0), initDelay);
                    }
                });

                // Module Marquee initialisé
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
                console.log('[DEBUG] YouTube elements found:', elements.length);
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
                
                console.log('[DEBUG] YouTube element config:', {channelId, videoCount, allowShorts, language, endpoint});
                
                if (!channelId) {
                    return;
                }
                
                if (!endpoint) {
                    // Attendre que la configuration soit définie (max 5 secondes)
                    const retryCount = element.getAttribute('data-youtube-retry-count') || '0';
                    const retries = parseInt(retryCount);
                    
                    if (retries < 50) { // 50 * 100ms = 5 secondes max
                        console.log('[DEBUG] YouTube endpoint not configured yet, waiting... (attempt', retries + 1, ')');
                        element.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Configuration YouTube en cours...</div>';
                        element.setAttribute('data-youtube-retry-count', (retries + 1).toString());
                        
                        // Réessayer dans 100ms
                        setTimeout(() => {
                            this.initElement(element);
                        }, 100);
                        return;
                    } else {
                        // Timeout après 5 secondes
                        console.log('[DEBUG] YouTube endpoint configuration timeout');
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
                
                if (cachedData) {
                    // Données YouTube récupérées du cache (économie API)
                    this.generateYouTubeFeed(container, template, cachedData.value, allowShorts, language);
                    return;
                }
                
                // Afficher un loader
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Chargement des vidéos YouTube...</div>';
                
                // Appeler l'API via le Worker
                console.log('[DEBUG] Fetching YouTube data from:', `${endpoint}?channelId=${channelId}&maxResults=${videoCount}&allowShorts=${allowShorts}`);
                fetch(`${endpoint}?channelId=${channelId}&maxResults=${videoCount}&allowShorts=${allowShorts}`)
                    .then(response => {
                        console.log('[DEBUG] YouTube API response status:', response.status);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('[DEBUG] YouTube API data received:', data);
                        if (data.error) {
                            throw new Error(data.error.message || 'Erreur API YouTube');
                        }
                        
                        // Sauvegarder en cache pour 24h
                        this.cache.set(cacheKey, data);
                        // Données YouTube mises en cache pour 24h (économie API)
                        
                        this.generateYouTubeFeed(container, template, data, allowShorts, language);
                    })
                    .catch(error => {
                        console.error('[DEBUG] YouTube API error:', error);
                        // Erreur dans le module youtube
                        
                        // En cas d'erreur, essayer de récupérer du cache même expiré
                        const expiredCache = localStorage.getItem(cacheKey);
                        if (expiredCache) {
                            try {
                                const cachedData = JSON.parse(expiredCache);
                                console.log('[DEBUG] Using expired cache:', cachedData);
                                // Utilisation du cache expiré en cas d'erreur API
                                this.generateYouTubeFeed(container, template, cachedData.value, allowShorts, language);
                                return;
                            } catch (e) {
                                console.error('[DEBUG] Cache parsing error:', e);
                                // Ignorer les erreurs de parsing
                            }
                        }
                        
                        container.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>${error.message}</div>`;
                    });
            },
            
            generateYouTubeFeed: function(container, template, data, allowShorts, language = 'fr') {
                console.log('[DEBUG] generateYouTubeFeed called with data:', data);
                if (!data.items || data.items.length === 0) {
                    console.log('[DEBUG] No videos found in data');
                    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Aucune vidéo trouvée</div>';
                    return;
                }
                
                // Les vidéos sont déjà filtrées par l'API YouTube selon allowShorts
                let videos = data.items;
                console.log('[DEBUG] Processing', videos.length, 'videos');
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
            console.log('[DEBUG] YouTube endpoint configured globally:', endpoint);
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
        
        // Initialisation différée supplémentaire pour les cas difficiles - Option 1: Attendre que tout soit vraiment prêt
        window.addEventListener('load', function() {
            const loadDelay = document.body.hasAttribute('bb-performance-boost') ? 3000 : 1500; // Délais plus longs
            setTimeout(function() {
                // Vérifier s'il y a des éléments non initialisés
                const unprocessedMarquees = document.querySelectorAll('[bb-marquee]:not([data-bb-marquee-processed])');
                if (unprocessedMarquees.length > 0) {
                    // Éléments marquee non initialisés détectés après load, réinitialisation
                    bbContents.reinit();
                }
                
                // Vérification supplémentaire des images chargées
                const allImages = document.querySelectorAll('img');
                const unloadedImages = Array.from(allImages).filter(img => !img.complete || img.naturalHeight === 0);
                if (unloadedImages.length > 0) {
                    // Images non chargées détectées, attente supplémentaire
                    setTimeout(() => {
                        bbContents.reinit();
                    }, 1000);
                }
            }, loadDelay);
        });
    }

    // Initialisation
    initBBContents();

    // Message de confirmation supprimé pour une console plus propre
})();