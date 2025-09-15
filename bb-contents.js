/**
 * BeBranded Contents
 * Contenus additionnels français pour Webflow
 * @version 1.0.80-beta
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
        console.log('🔄 [BB Contents] Version déjà affichée, réinitialisation...');
        return;
    }
    window._bbContentsVersionDisplayed = true;
    
    // Protection supplémentaire contre la double initialisation
    if (window._bbContentsInitialized) {
        console.log('🔄 [BB Contents] Déjà initialisé, réinitialisation...');
        return;
    }
    window._bbContentsInitialized = true;

    // Log de démarrage simple
    console.log('bb-contents | v1.0.82');

    // Configuration
    const config = {
        version: '1.0.82',
        debug: false, // Debug désactivé pour rendu propre
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
        // Module Marquee - Version simplifiée et robuste
        marquee: {
        detect: function(scope) {
            const s = scope || document;
                return s.querySelector(bbContents._attrSelector('marquee')) !== null;
        },
        
        init: function(root) {
            const scope = root || document;
            if (scope.closest && scope.closest('[data-bb-disable]')) return;
                const elements = scope.querySelectorAll(bbContents._attrSelector('marquee'));

                console.log('🔍 [MARQUEE] Éléments trouvés:', elements.length);

                // Traitement simple et parallèle de tous les marquees
                elements.forEach((element, index) => {
                    // Éviter le double traitement
                    if (element.bbProcessed || element.hasAttribute('data-bb-marquee-processed')) {
                        return;
                    }
                element.bbProcessed = true;
                

                    // Récupérer les options
                    const speed = bbContents._getAttr(element, 'bb-marquee-speed') || '100';
                    const direction = bbContents._getAttr(element, 'bb-marquee-direction') || 'left';
                    const pauseOnHover = bbContents._getAttr(element, 'bb-marquee-pause') || 'true';
                    const gap = bbContents._getAttr(element, 'bb-marquee-gap') || '50';
                    const orientation = bbContents._getAttr(element, 'bb-marquee-orientation') || 'horizontal';
                    const height = bbContents._getAttr(element, 'bb-marquee-height') || '300';
                    const minHeight = bbContents._getAttr(element, 'bb-marquee-min-height');

                    // Sauvegarder le contenu original
                    const originalHTML = element.innerHTML;
                    
                    // Créer la structure simple
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

                    // Créer 3 copies pour le défilement infini
                    const repeatBlock1 = mainBlock.cloneNode(true);
                    const repeatBlock2 = mainBlock.cloneNode(true);
                    
                    scrollContainer.appendChild(mainBlock);
                    scrollContainer.appendChild(repeatBlock1);
                    scrollContainer.appendChild(repeatBlock2);
                    mainContainer.appendChild(scrollContainer);
                    
                    element.innerHTML = '';
                    element.appendChild(mainContainer);
                    element.setAttribute('data-bb-marquee-processed', 'true');

                    // Initialisation simple avec délai fixe
                    const initDelay = isVertical ? 500 : 300;
                    setTimeout(() => {
                        this.initAnimation(element, scrollContainer, mainBlock, {
                            speed, direction, pauseOnHover, gap, isVertical, useAutoHeight
                        });
                    }, initDelay);
                });
            },

            initAnimation: function(element, scrollContainer, mainBlock, options) {
                const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight } = options;
                
                // Calculer les dimensions
                const contentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;
                
                
                if (contentSize === 0) {
                    console.log('⚠️ [MARQUEE] Contenu vide, retry dans 200ms');
                    setTimeout(() => this.initAnimation(element, scrollContainer, mainBlock, options), 200);
                    return;
                }

                // Détection Safari
                const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

                const gapSize = parseInt(gap);
                const step = (parseFloat(speed) * (isVertical ? 1.5 : 0.8)) / 60;
                let isPaused = false;

                if (isSafari) {
                    // Solution Safari : Animation CSS avec keyframes
                    this.initSafariAnimation(element, scrollContainer, mainBlock, {
                        speed, direction, gap, isVertical, useAutoHeight, contentSize, gapSize
                    });
                } else {
                    // Solution standard pour autres navigateurs
                    this.initStandardAnimation(element, scrollContainer, mainBlock, {
                        speed, direction, pauseOnHover, gap, isVertical, useAutoHeight, contentSize, gapSize, step
                    });
                }
            },

            initSafariAnimation: function(element, scrollContainer, mainBlock, options) {
                const { speed, direction, gap, isVertical, useAutoHeight, contentSize, gapSize } = options;
                
                
                // SOLUTION SAFARI : Forcer le chargement des images avant animation
                const images = mainBlock.querySelectorAll('img');
                let imagesLoaded = 0;
                const totalImages = images.length;
                
                
                // Forcer le chargement de toutes les images
                images.forEach(img => {
                    if (img.dataset.src && !img.src) {
                        img.src = img.dataset.src;
                        img.loading = 'eager';
                    }
                    img.onload = () => {
                        imagesLoaded++;
                    };
                    img.onerror = () => {
                        imagesLoaded++;
                    };
                });
                
                // SOLUTION SAFARI MOBILE SIMPLE : Attendre plus longtemps
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                
                // Timeout plus long sur mobile pour laisser le temps aux images de se charger
                const maxWaitTime = isMobile ? 5000 : 3000; // 5 secondes sur mobile
                let waitTimeout = 0;
                
                const waitForImages = () => {
                    waitTimeout += 100;
                    
                    if (imagesLoaded >= totalImages || imagesLoaded === 0 || waitTimeout >= maxWaitTime) {
                        console.log(`✅ [MARQUEE] Safari - Images chargées: ${imagesLoaded}/${totalImages} (timeout: ${waitTimeout}ms)`);
                        
                        // Attendre plus longtemps sur mobile pour le rendu visuel
                        const renderDelay = isMobile ? 1000 : 200;
                        setTimeout(() => {
                            console.log(`🖼️ [MARQUEE] Safari - Attente rendu visuel des images...`);
                            startSafariAnimation();
                        }, renderDelay);
                    } else {
                        setTimeout(waitForImages, 100);
                    }
                };
                
                waitForImages();
                
                const startSafariAnimation = () => {
                    // Forcer le chargement des images restantes si timeout
                    if (waitTimeout >= maxWaitTime && imagesLoaded < totalImages) {
                        console.log(`⚠️ [MARQUEE] Safari - Timeout atteint, forcer chargement images restantes`);
                        images.forEach(img => {
                            if (img.dataset.src && !img.src) {
                                img.src = img.dataset.src;
                                img.loading = 'eager';
                            }
                        });
                    }
                    
                    // Vérifier que les images ont une taille visible
                    let imagesWithSize = 0;
                    images.forEach(img => {
                        if (img.offsetWidth > 0 && img.offsetHeight > 0) {
                            imagesWithSize++;
                        }
                    });
                    console.log(`🖼️ [MARQUEE] Safari - Images avec taille visible: ${imagesWithSize}/${totalImages}`);
                    
                    // Recalculer la taille après chargement des images
                    const newContentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;
                    console.log(`🔍 [MARQUEE] Safari - Nouvelle taille après images: ${newContentSize}px`);
                    
                    let finalContentSize = newContentSize > contentSize ? newContentSize : contentSize;
                    
                    // Fallback si toujours trop petit (surtout sur mobile)
                    if (finalContentSize < 200) {
                        const parentElement = element.parentElement;
                        if (parentElement) {
                            finalContentSize = isVertical ? parentElement.offsetHeight : parentElement.offsetWidth;
                        }
                        if (finalContentSize < 200) {
                            // Valeurs par défaut plus généreuses sur mobile
                            finalContentSize = isVertical ? (isMobile ? 600 : 400) : (isMobile ? 1000 : 800);
                            console.log(`🔍 [MARQUEE] Safari - Utilisation valeur par défaut mobile: ${finalContentSize}px`);
                        }
                    }
                    
                    // Solution Safari simplifiée
                    const totalSize = finalContentSize * 3 + gapSize * 2;
                    const step = (parseFloat(speed) * (isVertical ? 1.5 : 0.8)) / 60;
                    let isPaused = false;
                    
                    // Ajuster la taille du conteneur
                    if (isVertical && !useAutoHeight) {
                        scrollContainer.style.height = totalSize + 'px';
                    } else if (!isVertical) {
                        scrollContainer.style.width = totalSize + 'px';
                    }

                    // Position initiale optimisée pour Safari
                    let currentPosition;
                    if (direction === (isVertical ? 'bottom' : 'right')) {
                        currentPosition = -(finalContentSize + gapSize);
            } else {
                        currentPosition = 0;
                    }

                    // Forcer la position initiale pour éviter l'invisibilité
                    const initialTransform = isVertical 
                        ? `translate3d(0, ${currentPosition}px, 0)`
                        : `translate3d(${currentPosition}px, 0, 0)`;
                    scrollContainer.style.transform = initialTransform;
                    
                    console.log(`🔍 [MARQUEE] Safari - Position initiale: ${currentPosition}px, transform: ${initialTransform}`);

                    // Fonction d'animation Safari avec debug des resets
                    let frameCount = 0;
                    const animate = () => {
                        if (!isPaused) {
                            frameCount++;
                            
                            if (direction === (isVertical ? 'bottom' : 'right')) {
                                currentPosition += step;
                                if (currentPosition >= 0) {
                                    console.log(`🔄 [MARQUEE] Safari RESET bottom/right: ${currentPosition} → ${-(finalContentSize + gapSize)}`);
                                    currentPosition = -(finalContentSize + gapSize);
                                }
            } else {
                                currentPosition -= step;
                                if (currentPosition <= -(2 * (finalContentSize + gapSize))) {
                                    console.log(`🔄 [MARQUEE] Safari RESET top/left: ${currentPosition} → ${-(finalContentSize + gapSize)}`);
                                    currentPosition = -(finalContentSize + gapSize);
                                }
                            }
                            
                            // Log toutes les 60 frames (1 seconde)
                            if (frameCount % 60 === 0) {
                                console.log(`📍 [MARQUEE] Safari position: ${currentPosition}px (frame ${frameCount})`);
                            }
                            
                            // ARRONDI pour éviter les erreurs de précision JavaScript
                            currentPosition = Math.round(currentPosition * 100) / 100;
                            
                            // Transform optimisé pour Safari
                            const transform = isVertical 
                                ? `translate3d(0, ${currentPosition}px, 0)`
                                : `translate3d(${currentPosition}px, 0, 0)`;
                            scrollContainer.style.transform = transform;
                        }
                        requestAnimationFrame(animate);
                    };

                    // Démarrer l'animation avec un petit délai pour Safari
                    setTimeout(() => {
                        animate();
                        console.log('✅ [MARQUEE] Animation Safari démarrée avec JavaScript optimisé');
                    }, 50);

                    // Pause au survol pour Safari
                    if (element.getAttribute('bb-marquee-pause') === 'true') {
                        element.addEventListener('mouseenter', () => isPaused = true);
                        element.addEventListener('mouseleave', () => isPaused = false);
                    }
                };
                
                // Démarrer le processus de chargement des images
                waitForImages();
            },

            initStandardAnimation: function(element, scrollContainer, mainBlock, options) {
                const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight, contentSize, gapSize, step } = options;
                
                const totalSize = contentSize * 3 + gapSize * 2;
                let isPaused = false;
                
                // Position initiale
                let currentPosition;
                if (direction === (isVertical ? 'bottom' : 'right')) {
                    currentPosition = -(contentSize + gapSize);
                } else {
                    currentPosition = 0;
                }

                // Ajuster la taille du conteneur
                if (isVertical && !useAutoHeight) {
                    scrollContainer.style.height = totalSize + 'px';
                } else if (!isVertical) {
                    scrollContainer.style.width = totalSize + 'px';
                }

                // Fonction d'animation standard
                const animate = () => {
                    if (!isPaused) {
                        if (direction === (isVertical ? 'bottom' : 'right')) {
                            currentPosition += step;
                            if (currentPosition >= 0) {
                                currentPosition = -(contentSize + gapSize);
                            }
                        } else {
                            currentPosition -= step;
                            if (currentPosition <= -(2 * (contentSize + gapSize))) {
                                currentPosition = -(contentSize + gapSize);
                            }
                        }
                        
                        const transform = isVertical 
                            ? `translate3d(0, ${currentPosition}px, 0)`
                            : `translate3d(${currentPosition}px, 0, 0)`;
                        scrollContainer.style.transform = transform;
                    }
                    requestAnimationFrame(animate);
                };

                // Démarrer l'animation
                animate();
                console.log('✅ [MARQUEE] Animation standard démarrée');

                // Pause au survol
                if (pauseOnHover === 'true') {
                    element.addEventListener('mouseenter', () => isPaused = true);
                    element.addEventListener('mouseleave', () => isPaused = false);
                }
            }
        },

        // Module Share (Partage Social)
        share: {
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
        },

        // Module Current Year (Année courante)
        currentYear: {
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
        },

        // Module Reading Time (Temps de lecture)
        readingTime: {
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
        },

        // Module Favicon (Favicon Dynamique)
        favicon: {
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