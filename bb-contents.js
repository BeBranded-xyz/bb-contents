/**
 * BeBranded Contents
 * Contenus additionnels français pour Webflow
 * @version 1.0.148
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

    // Log de démarrage simple (une seule fois)
    console.log('bb-contents | v1.0.151');

    // Configuration
    const config = {
        version: '1.0.148',
        debug: false, // Debug désactivé pour rendu propre
        prefix: 'bb-', // utilisé pour générer les sélecteurs (data-bb-*)
        youtubeEndpoint: null, // URL du worker YouTube (à définir par l'utilisateur)
        i18n: {
            copied: 'Lien copié !',
            selectCountry: { fr: 'Sélectionner un pays', en: 'Select country' },
            searchCountry: { fr: 'Rechercher un pays...', en: 'Search country...' },
            noCountryFound: { fr: 'Aucun pays trouvé', en: 'No country found' }
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
            
            // Valider un code pays ISO 3166-1 alpha-2 (2 lettres)
            isValidCountryCode: function(code) {
                if (!code || typeof code !== 'string') return false;
                return /^[a-z]{2}$/i.test(code.trim());
            },
            
            // Échapper les valeurs CSS pour éviter l'injection CSS
            escapeCss: function(value) {
                if (!value || typeof value !== 'string') return '';
                // Échapper les guillemets et caractères spéciaux
                return value.replace(/[<>"']/g, function(match) {
                    const escapeMap = {
                        '<': '\\3C ',
                        '>': '\\3E ',
                        '"': '\\22 ',
                        "'": '\\27 '
                    };
                    return escapeMap[match] || match;
                });
            },
            
            // Nettoyer le HTML en supprimant les scripts et événements
            cleanHtml: function(html) {
                if (!html || typeof html !== 'string') return '';
                // Supprimer les scripts
                let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                // Supprimer les attributs d'événements (onclick, onerror, etc.)
                cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
                cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
                return cleaned;
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
            // Initialisation silencieuse
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

                // Éléments marquee détectés

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
                        min-height: auto;
                        ${minHeight ? `min-height: ${minHeight};` : ''}
                    `;

                    const scrollContainer = document.createElement('div');
                    // Pour horizontal, utiliser position relative au lieu de absolute pour éviter les problèmes de calcul
                    const useRelativeForHorizontal = !isVertical;
                    scrollContainer.style.cssText = `
                        ${useAutoHeight || useRelativeForHorizontal ? 'position: relative;' : 'position: absolute;'}
                        will-change: transform;
                        ${useAutoHeight || useRelativeForHorizontal ? '' : 'height: 100%; top: 0px; left: 0px;'}
                        display: flex;
                        ${isVertical ? 'flex-direction: column;' : ''}
                        align-items: center;
                        gap: ${gap}px;
                        ${isVertical ? '' : 'white-space: nowrap;'}
                        flex-shrink: 0;
                    `;

                    const mainBlock = document.createElement('div');
                    mainBlock.innerHTML = originalHTML;
                    
                    // IMPORTANT: Forcer le chargement de TOUTES les images dans mainBlock AVANT de cloner
                    // Cela garantit que les images sont dans le cache du navigateur avant le clonage
                    const preloadAllImagesFirst = function(block) {
                        return new Promise(function(resolve) {
                            const images = block.querySelectorAll('img');
                            if (images.length === 0) {
                                resolve();
                                return;
                            }
                            
                            let loadedCount = 0;
                            let errorCount = 0;
                            const totalImages = images.length;
                            
                            const checkComplete = function() {
                                if (loadedCount + errorCount >= totalImages) {
                                    resolve();
                                }
                            };
                            
                            images.forEach(function(img) {
                                // Charger l'image si nécessaire
                                if (img.dataset.src && !img.src) {
                                    img.src = img.dataset.src;
                                }
                                
                                // Si l'image est déjà complètement chargée
                                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                                    loadedCount++;
                                    checkComplete();
                                } else {
                                    // Précharger avec new Image() pour forcer le cache
                                    const preloadImg = new Image();
                                    preloadImg.onload = function() {
                                        // Forcer aussi le chargement dans l'image du DOM
                                        if (img.src) {
                                            img.src = img.src;
                                        }
                                        // Attendre que l'image du DOM soit aussi chargée
                                        const checkDomImage = function() {
                                            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                                                loadedCount++;
                                                checkComplete();
                                            } else {
                                                setTimeout(checkDomImage, 10);
                                            }
                                        };
                                        setTimeout(checkDomImage, 10);
                                    };
                                    preloadImg.onerror = function() {
                                        errorCount++;
                                        checkComplete();
                                    };
                                    
                                    if (img.src) {
                                        preloadImg.src = img.src;
                                    } else if (img.dataset.src) {
                                        preloadImg.src = img.dataset.src;
                                    } else {
                                        errorCount++;
                                        checkComplete();
                                    }
                                    
                                    // Écouter aussi le chargement de l'image dans le DOM
                                    img.onload = function() {
                                        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                                            loadedCount++;
                                            checkComplete();
                                        }
                                    };
                                    
                                    // Forcer le chargement si l'image a déjà un src
                                    if (img.src) {
                                        img.src = img.src;
                                    }
                                }
                            });
                            
                            // Timeout de sécurité (max 5 secondes)
                            setTimeout(function() {
                                if (loadedCount + errorCount < totalImages) {
                                    errorCount = totalImages - loadedCount;
                                    checkComplete();
                                }
                            }, 5000);
                        });
                    };
                    
                    // Permettre le retour à la ligne pour le texte dans les items du marquee
                    // Le white-space: nowrap sur le conteneur flex empêche les items de se retourner,
                    // mais ne doit pas empêcher le texte à l'intérieur des items de faire plusieurs lignes
                    if (!isVertical) {
                        setTimeout(() => {
                            const marqueeItems = mainBlock.querySelectorAll('.bb-marquee_item, [role="listitem"]');
                            marqueeItems.forEach(item => {
                                // Préserver la largeur de l'item définie dans Webflow
                                const computedStyle = getComputedStyle(item);
                                const itemWidth = computedStyle.width;
                                if (itemWidth && itemWidth !== 'auto' && itemWidth !== '0px') {
                                    item.style.minWidth = itemWidth;
                                    item.style.width = itemWidth;
                                }
                                
                                // Permettre le retour à la ligne pour les conteneurs de texte
                                const textContainers = item.querySelectorAll('.use-case_client, .testimonial_client-info, [class*="text"], p, span');
                                textContainers.forEach(container => {
                                    const containerComputed = getComputedStyle(container);
                                    // Si l'élément a une largeur définie, la préserver
                                    if (containerComputed.width && containerComputed.width !== 'auto' && containerComputed.width !== '0px') {
                                        container.style.width = containerComputed.width;
                                    } else {
                                        // Sinon, prendre 100% de la largeur du parent
                                        container.style.width = '100%';
                                    }
                                    // Forcer le retour à la ligne
                                    container.style.whiteSpace = 'normal';
                                    container.style.wordWrap = 'break-word';
                                    container.style.overflowWrap = 'break-word';
                                });
                            });
                        }, 0);
                    }
                    
                    mainBlock.style.cssText = `
                        display: flex;
                        ${isVertical ? 'flex-direction: column;' : ''}
                        align-items: center;
                        gap: ${gap}px;
                        ${isVertical ? '' : 'white-space: nowrap;'}
                        flex-shrink: 0;
                        ${isVertical ? 'min-height: 100px;' : ''}
                    `;

                    // NOUVELLE APPROCHE: Attendre que TOUTES les images du mainBlock soient chargées AVANT de cloner
                    // Cela garantit que les copies héritent d'images déjà dans le cache du navigateur
                    preloadAllImagesFirst(mainBlock).then(function() {
                        // Maintenant créer les copies - les images sont déjà en cache
                        const repeatBlock1 = mainBlock.cloneNode(true);
                        const repeatBlock2 = mainBlock.cloneNode(true);
                        
                        // Forcer l'affichage immédiat des images dans les copies (elles sont en cache)
                        const forceImagesDisplay = function(block) {
                            const images = block.querySelectorAll('img');
                            images.forEach(function(img) {
                                if (img.dataset.src && !img.src) {
                                    img.src = img.dataset.src;
                                }
                                // Forcer le chargement et l'affichage
                                if (img.src) {
                                    img.src = img.src;
                                    img.style.opacity = '1';
                                    img.style.visibility = 'visible';
                                    // Forcer un reflow pour s'assurer que l'image est rendue
                                    void img.offsetHeight;
                                }
                            });
                        };
                        
                        forceImagesDisplay(repeatBlock1);
                        forceImagesDisplay(repeatBlock2);
                        
                        // NOUVELLE APPROCHE: Ajouter temporairement les copies au DOM (hors écran) 
                        // pour forcer le navigateur à les rendre complètement avant l'animation
                        const tempContainer = document.createElement('div');
                        tempContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px; visibility: hidden;';
                        tempContainer.appendChild(repeatBlock1);
                        tempContainer.appendChild(repeatBlock2);
                        document.body.appendChild(tempContainer);
                        
                        // Forcer le rendu en vérifiant que toutes les images sont vraiment chargées et rendues
                        const waitForImagesRender = function(block) {
                            return new Promise(function(resolve) {
                                const images = block.querySelectorAll('img');
                                if (images.length === 0) {
                                    resolve();
                                    return;
                                }
                                
                                let renderedCount = 0;
                                const totalImages = images.length;
                                
                                const checkRendered = function() {
                                    if (renderedCount >= totalImages) {
                                        resolve();
                                    }
                                };
                                
                                images.forEach(function(img) {
                                    // Vérifier que l'image est vraiment rendue (naturalWidth > 0 ET dans le DOM)
                                    const checkImage = function() {
                                        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0 && img.offsetWidth > 0) {
                                            renderedCount++;
                                            checkRendered();
                                        } else {
                                            // Réessayer après un court délai
                                            setTimeout(checkImage, 10);
                                        }
                                    };
                                    
                                    // Forcer le chargement si nécessaire
                                    if (img.dataset.src && !img.src) {
                                        img.src = img.dataset.src;
                                    }
                                    
                                    if (img.complete && img.naturalWidth > 0 && img.offsetWidth > 0) {
                                        renderedCount++;
                                        checkRendered();
                                    } else {
                                        img.onload = function() {
                                            setTimeout(checkImage, 10);
                                        };
                                        checkImage();
                                    }
                                });
                                
                                // Timeout de sécurité
                                setTimeout(function() {
                                    if (renderedCount < totalImages) {
                                        renderedCount = totalImages;
                                        checkRendered();
                                    }
                                }, 2000);
                            });
                        };
                        
                        // NOUVEAU: Forcer le rendu complet en déplaçant temporairement le conteneur
                        // pour que toutes les parties soient visibles (même brièvement)
                        // Cela force le navigateur à rendre même les parties très larges sur grands écrans
                        // Pour "left", on force le rendu de la partie DROITE (où les copies apparaîtront)
                        // Pour "right", on force le rendu de la partie GAUCHE
                        const forceFullRender = function() {
                            return new Promise(function(resolve) {
                                // Calculer la largeur totale des copies
                                const totalWidth = Math.max(
                                    repeatBlock1.offsetWidth || 0,
                                    repeatBlock2.offsetWidth || 0
                                );
                                
                                if (totalWidth > 0 && totalWidth > window.innerWidth) {
                                    // Déplacer temporairement le conteneur pour forcer le rendu
                                    tempContainer.style.left = '0px';
                                    tempContainer.style.width = totalWidth + 'px';
                                    tempContainer.style.overflow = 'visible';
                                    
                                    // Forcer un reflow pour que le navigateur calcule les dimensions
                                    void tempContainer.offsetWidth;
                                    
                                    // NOUVEAU: Pour "left", déplacer pour que la FIN soit visible (partie droite)
                                    // Pour "right", déplacer pour que le DÉBUT soit visible (partie gauche)
                                    // On va faire les deux pour être sûr que tout est rendu
                                    const translateXEnd = Math.max(0, totalWidth - window.innerWidth);
                                    const translateXStart = 0;
                                    
                                    // D'abord rendre la fin (pour "left" - où les copies apparaîtront)
                                    tempContainer.style.transform = 'translateX(-' + translateXEnd + 'px)';
                                    void tempContainer.offsetWidth;
                                    requestAnimationFrame(function() {
                                        // Ensuite rendre le début (pour "right" - où les copies apparaîtront)
                                        tempContainer.style.transform = 'translateX(-' + translateXStart + 'px)';
                                        void tempContainer.offsetWidth;
                                        requestAnimationFrame(function() {
                                            // Revenir à la position initiale
                                            tempContainer.style.transform = '';
                                            tempContainer.style.left = '-9999px';
                                            tempContainer.style.width = 'auto';
                                            void tempContainer.offsetWidth;
                                            requestAnimationFrame(function() {
                                                requestAnimationFrame(resolve);
                                            });
                                        });
                                    });
                                } else {
                                    // Si pas besoin de déplacement, juste attendre un frame
                                    requestAnimationFrame(function() {
                                        requestAnimationFrame(resolve);
                                    });
                                }
                            });
                        };
                        
                        // Attendre que toutes les images soient rendues dans les copies
                        Promise.all([
                            waitForImagesRender(repeatBlock1),
                            waitForImagesRender(repeatBlock2),
                            forceFullRender() // NOUVEAU: Forcer le rendu complet
                        ]).then(function() {
                            // Retirer les copies du conteneur temporaire
                            document.body.removeChild(tempContainer);
                            
                            // Maintenant ajouter les copies au scrollContainer
                            // Les images sont maintenant complètement rendues
                            if (!isVertical) {
                                scrollContainer.appendChild(mainBlock);
                                scrollContainer.appendChild(repeatBlock1);
                                scrollContainer.appendChild(repeatBlock2);
                                mainContainer.appendChild(scrollContainer);
                                
                                // Calculer la hauteur maximale des items après ajout au DOM
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        const items = mainBlock.querySelectorAll('.bb-marquee_item, [role="listitem"], > *');
                                        let maxHeight = 0;
                                        items.forEach(function(item) {
                                            const itemHeight = item.offsetHeight;
                                            if (itemHeight > maxHeight) {
                                                maxHeight = itemHeight;
                                            }
                                        });
                                        
                                        // Si aucun item trouvé, essayer de prendre la hauteur du scrollContainer
                                        if (maxHeight === 0) {
                                            maxHeight = scrollContainer.offsetHeight;
                                        }
                                        
                                        // Appliquer la hauteur calculée au mainContainer si elle est valide
                                        if (maxHeight > 0) {
                                            mainContainer.style.height = maxHeight + 'px';
                                        }
                                    });
                                });
                            } else {
                                // Pour vertical, garder le comportement actuel
                                scrollContainer.appendChild(mainBlock);
                                scrollContainer.appendChild(repeatBlock1);
                                scrollContainer.appendChild(repeatBlock2);
                                mainContainer.appendChild(scrollContainer);
                            }
                            
                            element.innerHTML = '';
                            element.appendChild(mainContainer);
                            element.setAttribute('data-bb-marquee-processed', 'true');

                            // Attendre un peu pour s'assurer que le rendu est complet
                            // Les images sont maintenant complètement rendues
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    // Maintenant démarrer l'animation
                                    const initDelay = isVertical ? 500 : 100;
                                    setTimeout(() => {
                                        this.initAnimation(element, scrollContainer, mainBlock, {
                                            speed, direction, pauseOnHover, gap, isVertical, useAutoHeight
                                        });
                                    }, initDelay);
                                });
                            });
                        }.bind(this));
                    }.bind(this)).catch(function() {
                        // En cas d'erreur, créer les copies quand même et démarrer
                        const repeatBlock1 = mainBlock.cloneNode(true);
                        const repeatBlock2 = mainBlock.cloneNode(true);
                        
                        if (!isVertical) {
                            scrollContainer.appendChild(mainBlock);
                            scrollContainer.appendChild(repeatBlock1);
                            scrollContainer.appendChild(repeatBlock2);
                            mainContainer.appendChild(scrollContainer);
                        } else {
                            scrollContainer.appendChild(mainBlock);
                            scrollContainer.appendChild(repeatBlock1);
                            scrollContainer.appendChild(repeatBlock2);
                            mainContainer.appendChild(scrollContainer);
                        }
                        
                        element.innerHTML = '';
                        element.appendChild(mainContainer);
                        element.setAttribute('data-bb-marquee-processed', 'true');
                        
                        const initDelay = isVertical ? 500 : 300;
                        setTimeout(() => {
                            this.initAnimation(element, scrollContainer, mainBlock, {
                                speed, direction, pauseOnHover, gap, isVertical, useAutoHeight
                            });
                        }, initDelay);
                    }.bind(this));
                });
            },

            initAnimation: function(element, scrollContainer, mainBlock, options) {
                const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight } = options;
                
                // Calculer les dimensions
                // Maintenant que scrollContainer est en position relative pour horizontal, offsetWidth devrait fonctionner
                const contentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;
                
                if (contentSize === 0) {
                    // Si toujours 0, réessayer après un délai
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
                    // Solution standard : créer les copies seulement si elles n'existent pas déjà
                    // (elles ont peut-être été créées pour le calcul de hauteur en horizontal)
                    // Utiliser children.length au lieu de querySelectorAll pour compter uniquement les enfants directs
                    const hasCopies = scrollContainer.children.length >= 3; // mainBlock + 2 copies
                    
                    if (!hasCopies) {
                        // Créer les copies maintenant (les navigateurs non-Safari gèrent mieux)
                        const repeatBlock1 = mainBlock.cloneNode(true);
                        const repeatBlock2 = mainBlock.cloneNode(true);
                        
                        // Forcer le chargement COMPLET des images dans les copies
                        const preloadImagesInBlockSync = function(block) {
                            const images = block.querySelectorAll('img');
                            images.forEach(function(img) {
                                if (img.dataset.src && !img.src) {
                                    img.src = img.dataset.src;
                                }
                                // Précharger avec new Image() pour forcer le cache
                                if (img.src) {
                                    const preloadImg = new Image();
                                    preloadImg.src = img.src;
                                    // Forcer aussi le chargement dans l'image du DOM
                                    if (!img.complete) {
                                        img.src = img.src;
                                    }
                                }
                            });
                        };
                        
                        preloadImagesInBlockSync(repeatBlock1);
                        preloadImagesInBlockSync(repeatBlock2);
                        
                        scrollContainer.appendChild(repeatBlock1);
                        scrollContainer.appendChild(repeatBlock2);
                    }
                    
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
                
                // DÉCLARER isMobile et isSafari AVANT leur utilisation dans img.onload
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                // Détecter spécifiquement Safari (pas Chrome mobile)
                const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod/.test(navigator.userAgent);
                
                // OPTIMISATION: Charger les images et appliquer les styles SVG AVANT le clonage
                // pour éviter les reflows qui causent la saccade de l'animation
                images.forEach(img => {
                    if (img.dataset.src && !img.src) {
                        img.src = img.dataset.src;
                        img.loading = 'eager';
                    }
                    
                    // Détecter si c'est un SVG (par l'extension du src ou le type)
                    const isSVG = img.src && (img.src.toLowerCase().endsWith('.svg') || img.src.includes('data:image/svg+xml'));
                    
                    // OPTIMISATION: Préserver les styles CSS existants (object-fit, etc.)
                    const originalObjectFit = img.style.objectFit || getComputedStyle(img).objectFit;
                    const originalObjectPosition = img.style.objectPosition || getComputedStyle(img).objectPosition;
                    const originalWidth = img.style.width;
                    const originalHeight = img.style.height;
                    
                    img.onload = () => {
                        // SOLUTION SAFARI : Pour les SVG sur Safari (desktop et mobile), utiliser contain avec optimisations
                        if (isSVG && isSafari) {
                            // SUR SAFARI : Utiliser contain MAIS avec des optimisations pour éviter le flou
                            img.style.objectFit = 'contain';
                            img.style.objectPosition = 'center';
                            
                            // Contraindre les dimensions sans forcer (max-width/max-height au lieu de width/height 100%)
                            img.style.maxWidth = '100%';
                            img.style.maxHeight = '100%';
                            img.style.boxSizing = 'border-box';
                            
                            // Optimisations pour améliorer le rendu des SVG avec contain
                            // Utiliser auto au lieu de crisp-edges pour contain
                            img.style.imageRendering = 'auto';
                            img.style.webkitBackfaceVisibility = 'hidden';
                            img.style.backfaceVisibility = 'hidden';
                            
                            // Forcer le GPU rendering AVANT d'appliquer contain
                            img.style.webkitTransform = 'translateZ(0)';
                            img.style.transform = 'translateZ(0)';
                            
                            // Conteneur parent pour contraindre et centrer (sans forcer les dimensions)
                            const parent = img.parentElement;
                            if (parent) {
                                // Vérifier si le parent a déjà des dimensions définies
                                const parentStyles = getComputedStyle(parent);
                                const hasParentWidth = parentStyles.width && parentStyles.width !== 'auto' && parentStyles.width !== '0px';
                                const hasParentHeight = parentStyles.height && parentStyles.height !== 'auto' && parentStyles.height !== '0px';
                                
                                parent.style.display = 'flex';
                                parent.style.alignItems = 'center';
                                parent.style.justifyContent = 'center';
                                parent.style.overflow = 'hidden';
                                parent.style.boxSizing = 'border-box';
                                
                                // Ne forcer les dimensions que si le parent n'en a pas déjà
                                if (!hasParentWidth && !parent.style.width) parent.style.width = '100%';
                                if (!hasParentHeight && !parent.style.height) parent.style.height = '100%';
                            }
                        } else if (isSVG && isMobile) {
                            // Pour Chrome mobile, utiliser contain normalement
                            img.style.objectFit = 'contain';
                            img.style.objectPosition = 'center';
                            img.style.maxWidth = '100%';
                            img.style.maxHeight = '100%';
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.boxSizing = 'border-box';
                            
                            const parent = img.parentElement;
                            if (parent) {
                                parent.style.display = 'flex';
                                parent.style.alignItems = 'center';
                                parent.style.justifyContent = 'center';
                                parent.style.overflow = 'hidden';
                                parent.style.boxSizing = 'border-box';
                            }
                        } else if (isSafari) {
                            // SUR SAFARI : Optimisations GPU et dimensions pour toutes les images
                            // Restaurer les styles CSS après chargement pour les non-SVG
                            if (originalObjectFit && originalObjectFit !== 'none') {
                                img.style.objectFit = originalObjectFit;
                            }
                            if (originalObjectPosition && originalObjectPosition !== 'initial') {
                                img.style.objectPosition = originalObjectPosition;
                            }
                            
                            // Préserver les dimensions naturelles des images
                            if (!originalWidth || originalWidth === '') {
                                img.style.width = 'auto';
                            }
                            if (!originalHeight || originalHeight === '') {
                                img.style.height = 'auto';
                            }
                            
                            // Optimisations GPU pour Safari (desktop et mobile)
                            img.style.webkitBackfaceVisibility = 'hidden';
                            img.style.backfaceVisibility = 'hidden';
                            img.style.webkitTransform = 'translateZ(0)';
                            img.style.transform = 'translateZ(0)';
                            
                            // Conteneur parent pour contraindre
                            const parent = img.parentElement;
                            if (parent) {
                                parent.style.overflow = 'hidden';
                                parent.style.boxSizing = 'border-box';
                            }
                        } else {
                            // OPTIMISATION: Restaurer les styles CSS après chargement pour les non-SVG (autres navigateurs)
                            if (originalObjectFit && originalObjectFit !== 'none') {
                                img.style.objectFit = originalObjectFit;
                            }
                            if (originalObjectPosition && originalObjectPosition !== 'initial') {
                                img.style.objectPosition = originalObjectPosition;
                            }
                            
                            // OPTIMISATION: Préserver les dimensions naturelles des images
                            if (!originalWidth || originalWidth === '') {
                                img.style.width = 'auto';
                            }
                            if (!originalHeight || originalHeight === '') {
                                img.style.height = 'auto';
                            }
                        }
                        
                        imagesLoaded++;
                    };
                    img.onerror = () => {
                        imagesLoaded++;
                    };
                });
                
                // Timeout plus long sur mobile pour laisser le temps aux images de se charger
                const maxWaitTime = isMobile ? 5000 : 3000; // 5 secondes sur mobile
                let waitTimeout = 0;
                
                const waitForImages = () => {
                    waitTimeout += 100;
                    
                    // SAFARI MOBILE : Attendre ABSOLUMENT que TOUTES les images soient chargées
                    if (totalImages === 0) {
                        // Pas d'images, démarrer après un court délai
                        const renderDelay = isMobile ? 500 : 100;
                        setTimeout(() => {
                            startSafariAnimation();
                        }, renderDelay);
                    } else if (imagesLoaded >= totalImages) {
                        // SAFARI MOBILE : Vérifier que les images ont vraiment leurs dimensions
                        let imagesReady = true;
                        if (isSafari && isMobile) {
                            images.forEach(img => {
                                if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
                                    imagesReady = false;
                                }
                            });
                        }
                        
                        if (imagesReady) {
                            // Toutes les images sont chargées ET ont leurs dimensions
                            // Attendre plus longtemps sur mobile Safari pour le rendu visuel
                            const renderDelay = isSafari && isMobile ? 1500 : (isMobile ? 1000 : 200);
                        setTimeout(() => {
                            startSafariAnimation();
                        }, renderDelay);
                    } else {
                            // Continuer à attendre que les dimensions soient disponibles
                            setTimeout(waitForImages, 100);
                        }
                    } else if (waitTimeout >= maxWaitTime) {
                        // Timeout atteint : forcer le démarrage mais c'est un fallback
                        if (bbContents.config.debug) {
                        }
                        const renderDelay = isSafari && isMobile ? 1500 : (isMobile ? 1000 : 200);
                        setTimeout(() => {
                            startSafariAnimation();
                        }, renderDelay);
                    } else {
                        // Continuer à attendre
                        setTimeout(waitForImages, 100);
                    }
                };
                
                waitForImages();
                
                const startSafariAnimation = () => {
                    // Forcer le chargement des images restantes si timeout
                    if (waitTimeout >= maxWaitTime && imagesLoaded < totalImages) {
                        images.forEach(img => {
                            if (img.dataset.src && !img.src) {
                                img.src = img.dataset.src;
                                img.loading = 'eager';
                            }
                        });
                    }
                    
                    // Les styles sont maintenant appliqués AVANT le clonage (dans img.onload)
                    // Cela évite les reflows qui causaient la saccade de l'animation
                    // Les copies héritent automatiquement des styles des images originales
                    
                    // Recalculer la taille après chargement des images
                    const newContentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;
                    
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
                        }
                    }
                    
                    // Solution Safari simplifiée
                    const totalSize = finalContentSize * 3 + gapSize * 2;
                    const step = (parseFloat(speed) * (isVertical ? 1.5 : 0.8)) / 60;
                    let isPaused = false;
                    
                    // OPTIMISATION SAFARI MOBILE : Ajouter will-change pour améliorer la fluidité
                    if (isSafari && isMobile) {
                        scrollContainer.style.willChange = 'transform';
                        scrollContainer.style.webkitBackfaceVisibility = 'hidden';
                        scrollContainer.style.backfaceVisibility = 'hidden';
                    }
                    
                    // Ajuster la taille du conteneur
                    if (isVertical && !useAutoHeight) {
                        scrollContainer.style.height = totalSize + 'px';
                    } else if (!isVertical) {
                        scrollContainer.style.width = totalSize + 'px';
                    }

                    // Position initiale optimisée pour Safari
                    // Pour direction left, commencer à -(finalContentSize + gapSize) pour que repeatBlock1 soit déjà visible
                    let currentPosition;
                    if (direction === (isVertical ? 'bottom' : 'right')) {
                        currentPosition = -(finalContentSize + gapSize);
            } else {
                        // Commencer avec repeatBlock1 déjà visible pour éviter la saccade
                        currentPosition = -(finalContentSize + gapSize);
                    }

                    // Forcer la position initiale pour éviter l'invisibilité
                    const initialTransform = isVertical 
                        ? `translate3d(0, ${currentPosition}px, 0)`
                        : `translate3d(${currentPosition}px, 0, 0)`;
                    scrollContainer.style.transform = initialTransform;

                    // OPTIMISATION SAFARI MOBILE : Forcer un reflow avant de démarrer l'animation
                    if (isSafari && isMobile) {
                        void scrollContainer.offsetHeight;
                    }

                    // Fonction d'animation Safari optimisée
                    let lastTime = performance.now();
                    const animate = (currentTime) => {
                        if (!isPaused) {
                            // OPTIMISATION SAFARI MOBILE : Utiliser le temps réel pour une animation plus fluide
                            const deltaTime = isSafari && isMobile ? (currentTime - lastTime) / 16.67 : 1;
                            lastTime = currentTime;
                            
                            if (direction === (isVertical ? 'bottom' : 'right')) {
                                currentPosition += step * deltaTime;
                                // Reset BEAUCOUP PLUS TÔT pour "right" aussi (comme pour "left") - Safari
                                // Reset à 80% du chemin au lieu d'attendre 100% pour avoir une marge de sécurité
                                const resetThreshold = -(0.2 * (finalContentSize + gapSize)); // 80% du chemin (on est à -20%)
                                if (currentPosition >= resetThreshold) {
                                    // Reset en gardant la position relative pour éviter le saut visible
                                    currentPosition = currentPosition - (finalContentSize + gapSize);
                                }
                            } else {
                                currentPosition -= step * deltaTime;
                                // Reset BEAUCOUP PLUS TÔT pour éviter toute saccade visible (Safari)
                                // Reset à 80% du chemin au lieu d'attendre 100% pour avoir une marge de sécurité
                                const resetThreshold = -(1.8 * (finalContentSize + gapSize));
                                if (currentPosition <= resetThreshold) {
                                    // Reset en gardant la position relative pour éviter le saut visible
                                    currentPosition = currentPosition + (finalContentSize + gapSize);
                                }
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

                    // Démarrer l'animation avec un délai adapté pour Safari
                    if (isSafari && isMobile) {
                        // Safari mobile : attendre un peu plus pour que tout soit prêt
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                lastTime = performance.now();
                                animate(lastTime);
                            });
                        });
                    } else {
                    setTimeout(() => {
                            lastTime = performance.now();
                            animate(lastTime);
                    }, 50);
                    }

                    // Pause au survol pour Safari
                    if (element.getAttribute('bb-marquee-pause') === 'true') {
                        element.addEventListener('mouseenter', () => isPaused = true);
                        element.addEventListener('mouseleave', () => isPaused = false);
                    }
                };
            },

            initStandardAnimation: function(element, scrollContainer, mainBlock, options) {
                const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight, contentSize, gapSize, step } = options;
                
                const totalSize = contentSize * 3 + gapSize * 2;
                let isPaused = false;
                
                // Position initiale
                // Pour direction left, commencer à -(contentSize + gapSize) pour que repeatBlock1 soit déjà visible
                // Cela évite la saccade au premier cycle
                let currentPosition;
                if (direction === (isVertical ? 'bottom' : 'right')) {
                    currentPosition = -(contentSize + gapSize);
                } else {
                    // Commencer avec repeatBlock1 déjà visible pour éviter la saccade
                    currentPosition = -(contentSize + gapSize);
                }

                // Ajuster la taille du conteneur
                if (isVertical && !useAutoHeight) {
                    scrollContainer.style.height = totalSize + 'px';
                } else if (!isVertical) {
                    scrollContainer.style.width = totalSize + 'px';
                }

                // Fonction d'animation standard avec gestion du temps pour fluidité constante
                let lastTime = performance.now();
                const animate = (currentTime) => {
                    if (!isPaused) {
                        // Calculer le delta de temps pour une vitesse constante même si le navigateur ralentit
                        const deltaTime = (currentTime - lastTime) / 16.67; // Normaliser à 60fps
                        lastTime = currentTime;
                        
                        // Limiter le deltaTime pour éviter les sauts trop importants
                        const clampedDelta = Math.min(deltaTime, 2.0);
                        
                        if (direction === (isVertical ? 'bottom' : 'right')) {
                            currentPosition += step * clampedDelta;
                            // Reset BEAUCOUP PLUS TÔT pour "right" aussi (comme pour "left")
                            // Reset à 80% du chemin au lieu d'attendre 100% pour avoir une marge de sécurité
                            // Cela garantit que la copie suivante est toujours visible avant le reset
                            const resetThreshold = -(0.2 * (contentSize + gapSize)); // 80% du chemin (on est à -20%)
                            if (currentPosition >= resetThreshold) {
                                // Reset en gardant la position relative pour éviter le saut visible
                                currentPosition = currentPosition - (contentSize + gapSize);
                            }
                        } else {
                            currentPosition -= step * clampedDelta;
                            // Reset BEAUCOUP PLUS TÔT pour éviter toute saccade visible
                            // Reset à 80% du chemin au lieu d'attendre 100% pour avoir une marge de sécurité
                            // Cela garantit que la copie suivante est toujours visible avant le reset
                            const resetThreshold = -(1.8 * (contentSize + gapSize));
                            if (currentPosition <= resetThreshold) {
                                // Reset en gardant la position relative pour éviter le saut visible
                                currentPosition = currentPosition + (contentSize + gapSize);
                            }
                        }
                        
                        // Arrondir pour éviter les erreurs de précision
                        currentPosition = Math.round(currentPosition * 100) / 100;
                        
                        const transform = isVertical 
                            ? `translate3d(0, ${currentPosition}px, 0)`
                            : `translate3d(${currentPosition}px, 0, 0)`;
                        scrollContainer.style.transform = transform;
                    }
                    requestAnimationFrame(animate);
                };

                // Démarrer l'animation avec le temps initial
                lastTime = performance.now();
                requestAnimationFrame(animate);

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
        
        // Fonction pour extraire le texte et les images depuis une URL
        fetchContentFromUrl: function(url, targetSelector) {
            return fetch(url)
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.text();
                })
                .then(function(html) {
                    // Nettoyer le HTML avant parsing (supprimer scripts et événements)
                    const cleanedHtml = bbContents.utils.cleanHtml(html);
                    // Parser le HTML pour extraire le contenu principal
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(cleanedHtml, 'text/html');
                    
                    let contentNode = null;
                    
                    // Priorité 1 : Utiliser le targetSelector si fourni
                    if (targetSelector) {
                        contentNode = doc.querySelector(targetSelector);
                    }
                    
                    // Priorité 2 : Si aucun targetSelector ou rien trouvé, utiliser les sélecteurs génériques
                    if (!contentNode) {
                        const contentSelectors = [
                            'article',
                            '[role="article"]',
                            '.blog-post-content',
                            '.post-content',
                            '.article-content',
                            '.content',
                            'main article',
                            'main .w-dyn-bind-empty', // Webflow CMS content
                            'main .w-richtext' // Webflow rich text
                        ];
                        
                        for (let i = 0; i < contentSelectors.length; i++) {
                            contentNode = doc.querySelector(contentSelectors[i]);
                            if (contentNode) break;
                        }
                    }
                    
                    // Fallback final : utiliser le body
                    if (!contentNode) {
                        contentNode = doc.body;
                    }
                    
                    if (!contentNode) {
                        return { text: '', images: [] };
                    }
                    
                    // Extraire le texte et les images
                    const text = contentNode.textContent.trim();
                    const images = contentNode.querySelectorAll('img');
                    
                    return { text: text, images: images };
                });
        },
        
        // Fonction pour calculer le temps de lecture
        calculateReadingTime: function(text, images, wordsPerMinute, secondsPerImage) {
            // Utiliser split(/\s+/) pour un comptage plus fiable (comme le code de référence)
            const wordCount = text ? text.trim().split(/\s+/).filter(function(word) { return word.length > 0; }).length : 0;
            const imageCount = images ? images.length : 0;
            const imageTimeInMinutes = (imageCount * secondsPerImage) / 60;
            
            let minutesFloat = (wordCount / wordsPerMinute) + imageTimeInMinutes;
            let minutes = Math.ceil(minutesFloat);
            
            if ((wordCount > 0 || imageCount > 0) && minutes < 1) minutes = 1;
            if (wordCount === 0 && imageCount === 0) minutes = 0;
            
            return minutes;
        },
        
        init: function(root) {
            const scope = root || document;
            if (scope.closest && scope.closest('[data-bb-disable]')) return;
            const elements = scope.querySelectorAll(bbContents._attrSelector('reading-time'));
            const self = this;

            elements.forEach(function(element) {
                if (element.bbProcessed) return;
                element.bbProcessed = true;

                    const targetSelector = bbContents._getAttr(element, 'bb-reading-time-target');
                const speedAttr = bbContents._getAttr(element, 'bb-reading-time-speed');
                const imageSpeedAttr = bbContents._getAttr(element, 'bb-reading-time-image-speed');
                const format = bbContents._getAttr(element, 'bb-reading-time-format') || '{minutes} min';
                const urlAttr = bbContents._getAttr(element, 'bb-reading-time-url');

                // Validation et correction des valeurs
                let wordsPerMinute = Number(speedAttr);
                    if (isNaN(wordsPerMinute) || wordsPerMinute <= 0) {
                    wordsPerMinute = 230;
                    }
                
                let secondsPerImage = Number(imageSpeedAttr);
                    if (isNaN(secondsPerImage) || secondsPerImage < 0) {
                    secondsPerImage = 12;
                }

                // Détecter l'URL : priorité 1 = lien parent, priorité 2 = attribut
                let articleUrl = null;
                
                // Priorité 1 : Chercher un lien parent
                let linkElement = element.closest('a');
                if (linkElement && linkElement.href) {
                    articleUrl = linkElement.href;
                }
                
                // Priorité 2 : Utiliser l'attribut si pas de lien trouvé
                if (!articleUrl && urlAttr) {
                    articleUrl = urlAttr;
                    // Si l'URL est relative, la transformer en absolue
                    if (articleUrl && !bbContents.utils.isValidUrl(articleUrl)) {
                        try {
                            const url = new URL(articleUrl, window.location.origin);
                            // Vérifier que c'est bien le même domaine (sécurité)
                            if (url.origin !== window.location.origin) {
                                // URL externe non autorisée, ignorer
                                articleUrl = null;
                            } else {
                                articleUrl = url.href;
                            }
                        } catch (e) {
                            // URL invalide, ignorer
                            articleUrl = null;
                        }
                    } else if (articleUrl && bbContents.utils.isValidUrl(articleUrl)) {
                        // Vérifier que l'URL absolue est du même domaine
                        try {
                            const url = new URL(articleUrl);
                            if (url.origin !== window.location.origin) {
                                // URL externe non autorisée, ignorer
                                articleUrl = null;
                            }
                        } catch (e) {
                            articleUrl = null;
                        }
                    }
                }
                
                // Si une URL est trouvée, faire un fetch
                if (articleUrl && bbContents.utils.isValidUrl(articleUrl)) {
                    // Afficher un état de chargement (optionnel, on peut laisser vide ou mettre "...")
                    const originalText = element.textContent;
                    
                    self.fetchContentFromUrl(articleUrl, targetSelector)
                        .then(function(data) {
                            const minutes = self.calculateReadingTime(data.text, data.images, wordsPerMinute, secondsPerImage);
                            const output = format.replace('{minutes}', String(minutes));
                            element.textContent = output;
                        })
                        .catch(function(error) {
                            bbContents.utils.log('Erreur lors de la récupération du contenu pour reading-time:', error);
                            // En cas d'erreur, on affiche un message ou on laisse le contenu original
                            element.textContent = originalText || '';
                        });
                    
                    return; // Sortir de la fonction pour cet élément (traitement async)
                }
                
                // Comportement par défaut : analyser le contenu de la page actuelle
                let sourceNodes = [];

                if (targetSelector) {
                    // Utiliser querySelectorAll pour récupérer TOUS les éléments correspondants
                    const foundNodes = document.querySelectorAll(targetSelector);
                    if (foundNodes.length === 0) {
                        sourceNodes = [element];
                    } else {
                        sourceNodes = Array.from(foundNodes);
                }
                } else {
                    sourceNodes = [element];
                }

                // Additionner le texte et les images de tous les éléments trouvés
                let totalText = '';
                let totalImages = [];

                sourceNodes.forEach(function(node) {
                    const nodeText = (node.textContent || '').trim();
                    if (nodeText) {
                        totalText += (totalText ? ' ' : '') + nodeText;
                    }
                    const nodeImages = node.querySelectorAll('img');
                    totalImages = totalImages.concat(Array.from(nodeImages));
                });

                const text = totalText.trim();
                const images = totalImages;

                const minutes = self.calculateReadingTime(text, images, wordsPerMinute, secondsPerImage);

                const output = format.replace('{minutes}', String(minutes));
                element.textContent = output;
            });

            bbContents.utils.log('Module ReadingTime initialisé:', elements.length, 'éléments');
        }
        },

        // Module Country Select
        countrySelect: {
            // Liste complète des pays ISO 3166
            countries: [
                {alpha2:'AD',alpha3:'AND',name:{fr:'Andorre',en:'Andorra'}},{alpha2:'AE',alpha3:'ARE',name:{fr:'Émirats arabes unis',en:'United Arab Emirates'}},{alpha2:'AF',alpha3:'AFG',name:{fr:'Afghanistan',en:'Afghanistan'}},{alpha2:'AG',alpha3:'ATG',name:{fr:'Antigua-et-Barbuda',en:'Antigua and Barbuda'}},{alpha2:'AI',alpha3:'AIA',name:{fr:'Anguilla',en:'Anguilla'}},{alpha2:'AL',alpha3:'ALB',name:{fr:'Albanie',en:'Albania'}},{alpha2:'AM',alpha3:'ARM',name:{fr:'Arménie',en:'Armenia'}},{alpha2:'AO',alpha3:'AGO',name:{fr:'Angola',en:'Angola'}},{alpha2:'AQ',alpha3:'ATA',name:{fr:'Antarctique',en:'Antarctica'}},{alpha2:'AR',alpha3:'ARG',name:{fr:'Argentine',en:'Argentina'}},{alpha2:'AS',alpha3:'ASM',name:{fr:'Samoa américaines',en:'American Samoa'}},{alpha2:'AT',alpha3:'AUT',name:{fr:'Autriche',en:'Austria'}},{alpha2:'AU',alpha3:'AUS',name:{fr:'Australie',en:'Australia'}},{alpha2:'AW',alpha3:'ABW',name:{fr:'Aruba',en:'Aruba'}},{alpha2:'AX',alpha3:'ALA',name:{fr:'Åland',en:'Åland Islands'}},{alpha2:'AZ',alpha3:'AZE',name:{fr:'Azerbaïdjan',en:'Azerbaijan'}},{alpha2:'BA',alpha3:'BIH',name:{fr:'Bosnie-Herzégovine',en:'Bosnia and Herzegovina'}},{alpha2:'BB',alpha3:'BRB',name:{fr:'Barbade',en:'Barbados'}},{alpha2:'BD',alpha3:'BGD',name:{fr:'Bangladesh',en:'Bangladesh'}},{alpha2:'BE',alpha3:'BEL',name:{fr:'Belgique',en:'Belgium'}},{alpha2:'BF',alpha3:'BFA',name:{fr:'Burkina Faso',en:'Burkina Faso'}},{alpha2:'BG',alpha3:'BGR',name:{fr:'Bulgarie',en:'Bulgaria'}},{alpha2:'BH',alpha3:'BHR',name:{fr:'Bahreïn',en:'Bahrain'}},{alpha2:'BI',alpha3:'BDI',name:{fr:'Burundi',en:'Burundi'}},{alpha2:'BJ',alpha3:'BEN',name:{fr:'Bénin',en:'Benin'}},{alpha2:'BL',alpha3:'BLM',name:{fr:'Saint-Barthélemy',en:'Saint Barthélemy'}},{alpha2:'BM',alpha3:'BMU',name:{fr:'Bermudes',en:'Bermuda'}},{alpha2:'BN',alpha3:'BRN',name:{fr:'Brunei',en:'Brunei'}},{alpha2:'BO',alpha3:'BOL',name:{fr:'Bolivie',en:'Bolivia'}},{alpha2:'BQ',alpha3:'BES',name:{fr:'Pays-Bas caribéens',en:'Caribbean Netherlands'}},{alpha2:'BR',alpha3:'BRA',name:{fr:'Brésil',en:'Brazil'}},{alpha2:'BS',alpha3:'BHS',name:{fr:'Bahamas',en:'Bahamas'}},{alpha2:'BT',alpha3:'BTN',name:{fr:'Bhoutan',en:'Bhutan'}},{alpha2:'BV',alpha3:'BVT',name:{fr:'Île Bouvet',en:'Bouvet Island'}},{alpha2:'BW',alpha3:'BWA',name:{fr:'Botswana',en:'Botswana'}},{alpha2:'BY',alpha3:'BLR',name:{fr:'Biélorussie',en:'Belarus'}},{alpha2:'BZ',alpha3:'BLZ',name:{fr:'Belize',en:'Belize'}},{alpha2:'CA',alpha3:'CAN',name:{fr:'Canada',en:'Canada'}},{alpha2:'CC',alpha3:'CCK',name:{fr:'Îles Cocos',en:'Cocos Islands'}},{alpha2:'CD',alpha3:'COD',name:{fr:'République démocratique du Congo',en:'Democratic Republic of the Congo'}},{alpha2:'CF',alpha3:'CAF',name:{fr:'République centrafricaine',en:'Central African Republic'}},{alpha2:'CG',alpha3:'COG',name:{fr:'Congo',en:'Republic of the Congo'}},{alpha2:'CH',alpha3:'CHE',name:{fr:'Suisse',en:'Switzerland'}},{alpha2:'CI',alpha3:'CIV',name:{fr:"Côte d'Ivoire",en:'Ivory Coast'}},{alpha2:'CK',alpha3:'COK',name:{fr:'Îles Cook',en:'Cook Islands'}},{alpha2:'CL',alpha3:'CHL',name:{fr:'Chili',en:'Chile'}},{alpha2:'CM',alpha3:'CMR',name:{fr:'Cameroun',en:'Cameroon'}},{alpha2:'CN',alpha3:'CHN',name:{fr:'Chine',en:'China'}},{alpha2:'CO',alpha3:'COL',name:{fr:'Colombie',en:'Colombia'}},{alpha2:'CR',alpha3:'CRI',name:{fr:'Costa Rica',en:'Costa Rica'}},{alpha2:'CU',alpha3:'CUB',name:{fr:'Cuba',en:'Cuba'}},{alpha2:'CV',alpha3:'CPV',name:{fr:'Cap-Vert',en:'Cape Verde'}},{alpha2:'CW',alpha3:'CUW',name:{fr:'Curaçao',en:'Curaçao'}},{alpha2:'CX',alpha3:'CXR',name:{fr:'Île Christmas',en:'Christmas Island'}},{alpha2:'CY',alpha3:'CYP',name:{fr:'Chypre',en:'Cyprus'}},{alpha2:'CZ',alpha3:'CZE',name:{fr:'Tchéquie',en:'Czechia'}},{alpha2:'DE',alpha3:'DEU',name:{fr:'Allemagne',en:'Germany'}},{alpha2:'DJ',alpha3:'DJI',name:{fr:'Djibouti',en:'Djibouti'}},{alpha2:'DK',alpha3:'DNK',name:{fr:'Danemark',en:'Denmark'}},{alpha2:'DM',alpha3:'DMA',name:{fr:'Dominique',en:'Dominica'}},{alpha2:'DO',alpha3:'DOM',name:{fr:'République dominicaine',en:'Dominican Republic'}},{alpha2:'DZ',alpha3:'DZA',name:{fr:'Algérie',en:'Algeria'}},{alpha2:'EC',alpha3:'ECU',name:{fr:'Équateur',en:'Ecuador'}},{alpha2:'EE',alpha3:'EST',name:{fr:'Estonie',en:'Estonia'}},{alpha2:'EG',alpha3:'EGY',name:{fr:'Égypte',en:'Egypt'}},{alpha2:'EH',alpha3:'ESH',name:{fr:'Sahara occidental',en:'Western Sahara'}},{alpha2:'ER',alpha3:'ERI',name:{fr:'Érythrée',en:'Eritrea'}},{alpha2:'ES',alpha3:'ESP',name:{fr:'Espagne',en:'Spain'}},{alpha2:'ET',alpha3:'ETH',name:{fr:'Éthiopie',en:'Ethiopia'}},{alpha2:'FI',alpha3:'FIN',name:{fr:'Finlande',en:'Finland'}},{alpha2:'FJ',alpha3:'FJI',name:{fr:'Fidji',en:'Fiji'}},{alpha2:'FK',alpha3:'FLK',name:{fr:'Îles Malouines',en:'Falkland Islands'}},{alpha2:'FM',alpha3:'FSM',name:{fr:'Micronésie',en:'Micronesia'}},{alpha2:'FO',alpha3:'FRO',name:{fr:'Îles Féroé',en:'Faroe Islands'}},{alpha2:'FR',alpha3:'FRA',name:{fr:'France',en:'France'}},{alpha2:'GA',alpha3:'GAB',name:{fr:'Gabon',en:'Gabon'}},{alpha2:'GB',alpha3:'GBR',name:{fr:'Royaume-Uni',en:'United Kingdom'}},{alpha2:'GD',alpha3:'GRD',name:{fr:'Grenade',en:'Grenada'}},{alpha2:'GE',alpha3:'GEO',name:{fr:'Géorgie',en:'Georgia'}},{alpha2:'GF',alpha3:'GUF',name:{fr:'Guyane française',en:'French Guiana'}},{alpha2:'GG',alpha3:'GGY',name:{fr:'Guernesey',en:'Guernsey'}},{alpha2:'GH',alpha3:'GHA',name:{fr:'Ghana',en:'Ghana'}},{alpha2:'GI',alpha3:'GIB',name:{fr:'Gibraltar',en:'Gibraltar'}},{alpha2:'GL',alpha3:'GRL',name:{fr:'Groenland',en:'Greenland'}},{alpha2:'GM',alpha3:'GMB',name:{fr:'Gambie',en:'Gambia'}},{alpha2:'GN',alpha3:'GIN',name:{fr:'Guinée',en:'Guinea'}},{alpha2:'GP',alpha3:'GLP',name:{fr:'Guadeloupe',en:'Guadeloupe'}},{alpha2:'GQ',alpha3:'GNQ',name:{fr:'Guinée équatoriale',en:'Equatorial Guinea'}},{alpha2:'GR',alpha3:'GRC',name:{fr:'Grèce',en:'Greece'}},{alpha2:'GS',alpha3:'SGS',name:{fr:'Géorgie du Sud-et-les Îles Sandwich du Sud',en:'South Georgia and the South Sandwich Islands'}},{alpha2:'GT',alpha3:'GTM',name:{fr:'Guatemala',en:'Guatemala'}},{alpha2:'GU',alpha3:'GUM',name:{fr:'Guam',en:'Guam'}},{alpha2:'GW',alpha3:'GNB',name:{fr:'Guinée-Bissau',en:'Guinea-Bissau'}},{alpha2:'GY',alpha3:'GUY',name:{fr:'Guyane',en:'Guyana'}},{alpha2:'HK',alpha3:'HKG',name:{fr:'Hong Kong',en:'Hong Kong'}},{alpha2:'HM',alpha3:'HMD',name:{fr:'Îles Heard-et-MacDonald',en:'Heard Island and McDonald Islands'}},{alpha2:'HN',alpha3:'HND',name:{fr:'Honduras',en:'Honduras'}},{alpha2:'HR',alpha3:'HRV',name:{fr:'Croatie',en:'Croatia'}},{alpha2:'HT',alpha3:'HTI',name:{fr:'Haïti',en:'Haiti'}},{alpha2:'HU',alpha3:'HUN',name:{fr:'Hongrie',en:'Hungary'}},{alpha2:'ID',alpha3:'IDN',name:{fr:'Indonésie',en:'Indonesia'}},{alpha2:'IE',alpha3:'IRL',name:{fr:'Irlande',en:'Ireland'}},{alpha2:'IL',alpha3:'ISR',name:{fr:'Israël',en:'Israel'}},{alpha2:'IM',alpha3:'IMN',name:{fr:'Île de Man',en:'Isle of Man'}},{alpha2:'IN',alpha3:'IND',name:{fr:'Inde',en:'India'}},{alpha2:'IO',alpha3:'IOT',name:{fr:'Territoire britannique de l\'océan Indien',en:'British Indian Ocean Territory'}},{alpha2:'IQ',alpha3:'IRQ',name:{fr:'Irak',en:'Iraq'}},{alpha2:'IR',alpha3:'IRN',name:{fr:'Iran',en:'Iran'}},{alpha2:'IS',alpha3:'ISL',name:{fr:'Islande',en:'Iceland'}},{alpha2:'IT',alpha3:'ITA',name:{fr:'Italie',en:'Italy'}},{alpha2:'JE',alpha3:'JEY',name:{fr:'Jersey',en:'Jersey'}},{alpha2:'JM',alpha3:'JAM',name:{fr:'Jamaïque',en:'Jamaica'}},{alpha2:'JO',alpha3:'JOR',name:{fr:'Jordanie',en:'Jordan'}},{alpha2:'JP',alpha3:'JPN',name:{fr:'Japon',en:'Japan'}},{alpha2:'KE',alpha3:'KEN',name:{fr:'Kenya',en:'Kenya'}},{alpha2:'KG',alpha3:'KGZ',name:{fr:'Kirghizistan',en:'Kyrgyzstan'}},{alpha2:'KH',alpha3:'KHM',name:{fr:'Cambodge',en:'Cambodia'}},{alpha2:'KI',alpha3:'KIR',name:{fr:'Kiribati',en:'Kiribati'}},{alpha2:'KM',alpha3:'COM',name:{fr:'Comores',en:'Comoros'}},{alpha2:'KN',alpha3:'KNA',name:{fr:'Saint-Kitts-et-Nevis',en:'Saint Kitts and Nevis'}},{alpha2:'KP',alpha3:'PRK',name:{fr:'Corée du Nord',en:'North Korea'}},{alpha2:'KR',alpha3:'KOR',name:{fr:'Corée du Sud',en:'South Korea'}},{alpha2:'KW',alpha3:'KWT',name:{fr:'Koweït',en:'Kuwait'}},{alpha2:'KY',alpha3:'CYM',name:{fr:'Îles Caïmans',en:'Cayman Islands'}},{alpha2:'KZ',alpha3:'KAZ',name:{fr:'Kazakhstan',en:'Kazakhstan'}},{alpha2:'LA',alpha3:'LAO',name:{fr:'Laos',en:'Laos'}},{alpha2:'LB',alpha3:'LBN',name:{fr:'Liban',en:'Lebanon'}},{alpha2:'LC',alpha3:'LCA',name:{fr:'Sainte-Lucie',en:'Saint Lucia'}},{alpha2:'LI',alpha3:'LIE',name:{fr:'Liechtenstein',en:'Liechtenstein'}},{alpha2:'LK',alpha3:'LKA',name:{fr:'Sri Lanka',en:'Sri Lanka'}},{alpha2:'LR',alpha3:'LBR',name:{fr:'Liberia',en:'Liberia'}},{alpha2:'LS',alpha3:'LSO',name:{fr:'Lesotho',en:'Lesotho'}},{alpha2:'LT',alpha3:'LTU',name:{fr:'Lituanie',en:'Lithuania'}},{alpha2:'LU',alpha3:'LUX',name:{fr:'Luxembourg',en:'Luxembourg'}},{alpha2:'LV',alpha3:'LVA',name:{fr:'Lettonie',en:'Latvia'}},{alpha2:'LY',alpha3:'LBY',name:{fr:'Libye',en:'Libya'}},{alpha2:'MA',alpha3:'MAR',name:{fr:'Maroc',en:'Morocco'}},{alpha2:'MC',alpha3:'MCO',name:{fr:'Monaco',en:'Monaco'}},{alpha2:'MD',alpha3:'MDA',name:{fr:'Moldavie',en:'Moldova'}},{alpha2:'ME',alpha3:'MNE',name:{fr:'Monténégro',en:'Montenegro'}},{alpha2:'MF',alpha3:'MAF',name:{fr:'Saint-Martin',en:'Saint Martin'}},{alpha2:'MG',alpha3:'MDG',name:{fr:'Madagascar',en:'Madagascar'}},{alpha2:'MH',alpha3:'MHL',name:{fr:'Îles Marshall',en:'Marshall Islands'}},{alpha2:'MK',alpha3:'MKD',name:{fr:'Macédoine du Nord',en:'North Macedonia'}},{alpha2:'ML',alpha3:'MLI',name:{fr:'Mali',en:'Mali'}},{alpha2:'MM',alpha3:'MMR',name:{fr:'Myanmar',en:'Myanmar'}},{alpha2:'MN',alpha3:'MNG',name:{fr:'Mongolie',en:'Mongolia'}},{alpha2:'MO',alpha3:'MAC',name:{fr:'Macao',en:'Macao'}},{alpha2:'MP',alpha3:'MNP',name:{fr:'Îles Mariannes du Nord',en:'Northern Mariana Islands'}},{alpha2:'MQ',alpha3:'MTQ',name:{fr:'Martinique',en:'Martinique'}},{alpha2:'MR',alpha3:'MRT',name:{fr:'Mauritanie',en:'Mauritania'}},{alpha2:'MS',alpha3:'MSR',name:{fr:'Montserrat',en:'Montserrat'}},{alpha2:'MT',alpha3:'MLT',name:{fr:'Malte',en:'Malta'}},{alpha2:'MU',alpha3:'MUS',name:{fr:'Maurice',en:'Mauritius'}},{alpha2:'MV',alpha3:'MDV',name:{fr:'Maldives',en:'Maldives'}},{alpha2:'MW',alpha3:'MWI',name:{fr:'Malawi',en:'Malawi'}},{alpha2:'MX',alpha3:'MEX',name:{fr:'Mexique',en:'Mexico'}},{alpha2:'MY',alpha3:'MYS',name:{fr:'Malaisie',en:'Malaysia'}},{alpha2:'MZ',alpha3:'MOZ',name:{fr:'Mozambique',en:'Mozambique'}},{alpha2:'NA',alpha3:'NAM',name:{fr:'Namibie',en:'Namibia'}},{alpha2:'NC',alpha3:'NCL',name:{fr:'Nouvelle-Calédonie',en:'New Caledonia'}},{alpha2:'NE',alpha3:'NER',name:{fr:'Niger',en:'Niger'}},{alpha2:'NF',alpha3:'NFK',name:{fr:'Île Norfolk',en:'Norfolk Island'}},{alpha2:'NG',alpha3:'NGA',name:{fr:'Nigeria',en:'Nigeria'}},{alpha2:'NI',alpha3:'NIC',name:{fr:'Nicaragua',en:'Nicaragua'}},{alpha2:'NL',alpha3:'NLD',name:{fr:'Pays-Bas',en:'Netherlands'}},{alpha2:'NO',alpha3:'NOR',name:{fr:'Norvège',en:'Norway'}},{alpha2:'NP',alpha3:'NPL',name:{fr:'Népal',en:'Nepal'}},{alpha2:'NR',alpha3:'NRU',name:{fr:'Nauru',en:'Nauru'}},{alpha2:'NU',alpha3:'NIU',name:{fr:'Niue',en:'Niue'}},{alpha2:'NZ',alpha3:'NZL',name:{fr:'Nouvelle-Zélande',en:'New Zealand'}},{alpha2:'OM',alpha3:'OMN',name:{fr:'Oman',en:'Oman'}},{alpha2:'PA',alpha3:'PAN',name:{fr:'Panama',en:'Panama'}},{alpha2:'PE',alpha3:'PER',name:{fr:'Pérou',en:'Peru'}},{alpha2:'PF',alpha3:'PYF',name:{fr:'Polynésie française',en:'French Polynesia'}},{alpha2:'PG',alpha3:'PNG',name:{fr:'Papouasie-Nouvelle-Guinée',en:'Papua New Guinea'}},{alpha2:'PH',alpha3:'PHL',name:{fr:'Philippines',en:'Philippines'}},{alpha2:'PK',alpha3:'PAK',name:{fr:'Pakistan',en:'Pakistan'}},{alpha2:'PL',alpha3:'POL',name:{fr:'Pologne',en:'Poland'}},{alpha2:'PM',alpha3:'SPM',name:{fr:'Saint-Pierre-et-Miquelon',en:'Saint Pierre and Miquelon'}},{alpha2:'PN',alpha3:'PCN',name:{fr:'Pitcairn',en:'Pitcairn'}},{alpha2:'PR',alpha3:'PRI',name:{fr:'Porto Rico',en:'Puerto Rico'}},{alpha2:'PS',alpha3:'PSE',name:{fr:'Palestine',en:'Palestine'}},{alpha2:'PT',alpha3:'PRT',name:{fr:'Portugal',en:'Portugal'}},{alpha2:'PW',alpha3:'PLW',name:{fr:'Palaos',en:'Palau'}},{alpha2:'PY',alpha3:'PRY',name:{fr:'Paraguay',en:'Paraguay'}},{alpha2:'QA',alpha3:'QAT',name:{fr:'Qatar',en:'Qatar'}},{alpha2:'RE',alpha3:'REU',name:{fr:'La Réunion',en:'Réunion'}},{alpha2:'RO',alpha3:'ROU',name:{fr:'Roumanie',en:'Romania'}},{alpha2:'RS',alpha3:'SRB',name:{fr:'Serbie',en:'Serbia'}},{alpha2:'RU',alpha3:'RUS',name:{fr:'Russie',en:'Russia'}},{alpha2:'RW',alpha3:'RWA',name:{fr:'Rwanda',en:'Rwanda'}},{alpha2:'SA',alpha3:'SAU',name:{fr:'Arabie saoudite',en:'Saudi Arabia'}},{alpha2:'SB',alpha3:'SLB',name:{fr:'Îles Salomon',en:'Solomon Islands'}},{alpha2:'SC',alpha3:'SYC',name:{fr:'Seychelles',en:'Seychelles'}},{alpha2:'SD',alpha3:'SDN',name:{fr:'Soudan',en:'Sudan'}},{alpha2:'SE',alpha3:'SWE',name:{fr:'Suède',en:'Sweden'}},{alpha2:'SG',alpha3:'SGP',name:{fr:'Singapour',en:'Singapore'}},{alpha2:'SH',alpha3:'SHN',name:{fr:'Sainte-Hélène',en:'Saint Helena'}},{alpha2:'SI',alpha3:'SVN',name:{fr:'Slovénie',en:'Slovenia'}},{alpha2:'SJ',alpha3:'SJM',name:{fr:'Svalbard et Jan Mayen',en:'Svalbard and Jan Mayen'}},{alpha2:'SK',alpha3:'SVK',name:{fr:'Slovaquie',en:'Slovakia'}},{alpha2:'SL',alpha3:'SLE',name:{fr:'Sierra Leone',en:'Sierra Leone'}},{alpha2:'SM',alpha3:'SMR',name:{fr:'Saint-Marin',en:'San Marino'}},{alpha2:'SN',alpha3:'SEN',name:{fr:'Sénégal',en:'Senegal'}},{alpha2:'SO',alpha3:'SOM',name:{fr:'Somalie',en:'Somalia'}},{alpha2:'SR',alpha3:'SUR',name:{fr:'Suriname',en:'Suriname'}},{alpha2:'SS',alpha3:'SSD',name:{fr:'Soudan du Sud',en:'South Sudan'}},{alpha2:'ST',alpha3:'STP',name:{fr:'São Tomé-et-Príncipe',en:'São Tomé and Príncipe'}},{alpha2:'SV',alpha3:'SLV',name:{fr:'Salvador',en:'El Salvador'}},{alpha2:'SX',alpha3:'SXM',name:{fr:'Saint-Martin',en:'Sint Maarten'}},{alpha2:'SY',alpha3:'SYR',name:{fr:'Syrie',en:'Syria'}},{alpha2:'SZ',alpha3:'SWZ',name:{fr:'Eswatini',en:'Eswatini'}},{alpha2:'TC',alpha3:'TCA',name:{fr:'Îles Turques-et-Caïques',en:'Turks and Caicos Islands'}},{alpha2:'TD',alpha3:'TCD',name:{fr:'Tchad',en:'Chad'}},{alpha2:'TF',alpha3:'ATF',name:{fr:'Terres australes françaises',en:'French Southern Territories'}},{alpha2:'TG',alpha3:'TGO',name:{fr:'Togo',en:'Togo'}},{alpha2:'TH',alpha3:'THA',name:{fr:'Thaïlande',en:'Thailand'}},{alpha2:'TJ',alpha3:'TJK',name:{fr:'Tadjikistan',en:'Tajikistan'}},{alpha2:'TK',alpha3:'TKL',name:{fr:'Tokelau',en:'Tokelau'}},{alpha2:'TL',alpha3:'TLS',name:{fr:'Timor oriental',en:'Timor-Leste'}},{alpha2:'TM',alpha3:'TKM',name:{fr:'Turkménistan',en:'Turkmenistan'}},{alpha2:'TN',alpha3:'TUN',name:{fr:'Tunisie',en:'Tunisia'}},{alpha2:'TO',alpha3:'TON',name:{fr:'Tonga',en:'Tonga'}},{alpha2:'TR',alpha3:'TUR',name:{fr:'Turquie',en:'Turkey'}},{alpha2:'TT',alpha3:'TTO',name:{fr:'Trinité-et-Tobago',en:'Trinidad and Tobago'}},{alpha2:'TV',alpha3:'TUV',name:{fr:'Tuvalu',en:'Tuvalu'}},{alpha2:'TW',alpha3:'TWN',name:{fr:'Taïwan',en:'Taiwan'}},{alpha2:'TZ',alpha3:'TZA',name:{fr:'Tanzanie',en:'Tanzania'}},{alpha2:'UA',alpha3:'UKR',name:{fr:'Ukraine',en:'Ukraine'}},{alpha2:'UG',alpha3:'UGA',name:{fr:'Ouganda',en:'Uganda'}},{alpha2:'UM',alpha3:'UMI',name:{fr:'Îles mineures éloignées des États-Unis',en:'United States Minor Outlying Islands'}},{alpha2:'US',alpha3:'USA',name:{fr:'États-Unis',en:'United States'}},{alpha2:'UY',alpha3:'URY',name:{fr:'Uruguay',en:'Uruguay'}},{alpha2:'UZ',alpha3:'UZB',name:{fr:'Ouzbékistan',en:'Uzbekistan'}},{alpha2:'VA',alpha3:'VAT',name:{fr:'Vatican',en:'Vatican City'}},{alpha2:'VC',alpha3:'VCT',name:{fr:'Saint-Vincent-et-les-Grenadines',en:'Saint Vincent and the Grenadines'}},{alpha2:'VE',alpha3:'VEN',name:{fr:'Venezuela',en:'Venezuela'}},{alpha2:'VG',alpha3:'VGB',name:{fr:'Îles Vierges britanniques',en:'British Virgin Islands'}},{alpha2:'VI',alpha3:'VIR',name:{fr:'Îles Vierges américaines',en:'United States Virgin Islands'}},{alpha2:'VN',alpha3:'VNM',name:{fr:'Vietnam',en:'Vietnam'}},{alpha2:'VU',alpha3:'VUT',name:{fr:'Vanuatu',en:'Vanuatu'}},{alpha2:'WF',alpha3:'WLF',name:{fr:'Wallis-et-Futuna',en:'Wallis and Futuna'}},{alpha2:'WS',alpha3:'WSM',name:{fr:'Samoa',en:'Samoa'}},{alpha2:'YE',alpha3:'YEM',name:{fr:'Yémen',en:'Yemen'}},{alpha2:'YT',alpha3:'MYT',name:{fr:'Mayotte',en:'Mayotte'}},{alpha2:'ZA',alpha3:'ZAF',name:{fr:'Afrique du Sud',en:'South Africa'}},{alpha2:'ZM',alpha3:'ZMB',name:{fr:'Zambie',en:'Zambia'}},{alpha2:'ZW',alpha3:'ZWE',name:{fr:'Zimbabwe',en:'Zimbabwe'}}
            ],
            
            // Détecter la langue
            getLanguage: function(element) {
                let lang = element.getAttribute('lang');
                if (!lang && element.closest) {
                    const langElement = element.closest('[lang]');
                    if (langElement) {
                        lang = langElement.getAttribute('lang');
                    }
                }
                if (!lang) {
                    lang = document.documentElement.getAttribute('lang');
                }
                if (!lang) {
                    lang = 'fr';
                }
                return lang && lang.startsWith('en') ? 'en' : 'fr';
            },
            
            // Trouver un pays par code ou nom
            findCountry: function(query) {
                if (!query) return null;
                const upperQuery = query.toUpperCase().trim();
                const lowerQuery = query.toLowerCase().trim();
                return this.countries.find(function(c) {
                    return c.alpha2 === upperQuery || 
                           c.alpha3 === upperQuery ||
                           c.name.fr.toLowerCase() === lowerQuery ||
                           c.name.en.toLowerCase() === lowerQuery;
                });
            },
            
            detect: function(scope) {
                const s = scope || document;
                return s.querySelector(bbContents._attrSelector('country-select')) !== null;
            },
            
            init: function(root) {
                const scope = root || document;
                if (scope.closest && scope.closest('[data-bb-disable]')) return;
                const elements = scope.querySelectorAll(bbContents._attrSelector('country-select'));
                const self = this;
                
                elements.forEach(function(element) {
                    if (element.bbProcessed || element.hasAttribute('data-bb-country-select-processed')) return;
                    if (element.tagName !== 'SELECT') {
                        return;
                    }
                    element.bbProcessed = true;
                    
                    const language = self.getLanguage(element);
                    const preferredAttr = bbContents._getAttr(element, 'bb-country-select-preferred');
                    const defaultAttr = bbContents._getAttr(element, 'bb-country-select-default');
                    const placeholder = bbContents.config.i18n.selectCountry[language] || 
                                      (language === 'en' ? 'Select country' : 'Sélectionner un pays');
                    const searchPlaceholder = bbContents.config.i18n.searchCountry[language] || 
                                            (language === 'en' ? 'Search country...' : 'Rechercher un pays...');
                    
                    // Parser les pays préférés
                    let preferredCountries = [];
                    if (preferredAttr) {
                        preferredAttr.split(',').forEach(function(code) {
                            const country = self.findCountry(code.trim());
                            if (country) preferredCountries.push(country.alpha2);
                        });
                    }
                    
                    // Pays par défaut
                    let defaultCountry = null;
                    if (defaultAttr) {
                        defaultCountry = self.findCountry(defaultAttr.trim());
                    } else if (element.value) {
                        defaultCountry = self.findCountry(element.value);
                    }
                    
                    // Si un pays par défaut est défini, mettre à jour le select natif immédiatement
                    if (defaultCountry) {
                        const countryName = defaultCountry.name[language];
                        // Créer l'option si elle n'existe pas
                        const existingOption = Array.from(element.options).find(function(opt) {
                            return opt.value === countryName;
                        });
                        if (!existingOption) {
                            const newOption = document.createElement('option');
                            newOption.value = countryName;
                            newOption.textContent = countryName;
                            element.appendChild(newOption);
                        }
                        // Définir la valeur du select
                        element.value = countryName;
                    }
                    
                    // Trier les pays : préférés en haut dans l'ordre exact spécifié, puis les autres par ordre alphabétique
                    let sortedCountries = self.countries.slice();
                    if (preferredCountries.length > 0) {
                        // Pays préférés dans l'ordre exact spécifié
                        const preferred = preferredCountries.map(function(code) {
                            return self.countries.find(function(c) {
                                return c.alpha2 === code;
                            });
                        }).filter(function(c) {
                            return c !== undefined;
                        });
                        
                        // Pays non-préférés triés par ordre alphabétique (avec gestion des accents)
                        const others = sortedCountries.filter(function(c) {
                            return preferredCountries.indexOf(c.alpha2) === -1;
                        }).sort(function(a, b) {
                            return a.name[language].localeCompare(b.name[language], language === 'fr' ? 'fr' : 'en', { 
                                sensitivity: 'base',
                                ignorePunctuation: true,
                                numeric: true
                            });
                        });
                        
                        sortedCountries = preferred.concat(others);
                    } else {
                        // Tous les pays par ordre alphabétique si pas de préférés (avec gestion des accents)
                        sortedCountries = sortedCountries.sort(function(a, b) {
                            return a.name[language].localeCompare(b.name[language], language === 'fr' ? 'fr' : 'en', { 
                                sensitivity: 'base',
                                ignorePunctuation: true,
                                numeric: true
                            });
                        });
                    }
                    
                    // Récupérer les styles du select natif avant de le masquer
                    const selectComputedStyle = window.getComputedStyle(element);
                    const selectWidth = element.offsetWidth || parseFloat(selectComputedStyle.width) || 'auto';
                    const selectHeight = element.offsetHeight || parseFloat(selectComputedStyle.height) || 'auto';
                    const selectMinWidth = selectComputedStyle.minWidth !== 'none' ? selectComputedStyle.minWidth : null;
                    const selectMaxWidth = selectComputedStyle.maxWidth !== 'none' ? selectComputedStyle.maxWidth : null;
                    const selectMinHeight = selectComputedStyle.minHeight !== 'none' ? selectComputedStyle.minHeight : null;
                    const selectMaxHeight = selectComputedStyle.maxHeight !== 'none' ? selectComputedStyle.maxHeight : null;
                    
                    // Récupérer les styles visuels du select pour les appliquer au dropdown custom
                    const selectBgColor = selectComputedStyle.backgroundColor;
                    // Construire selectBorder de manière sécurisée
                    let selectBorder = selectComputedStyle.border;
                    if (!selectBorder || selectBorder === 'none' || selectBorder === '0px none rgb(0, 0, 0)') {
                        if (selectComputedStyle.borderWidth && selectComputedStyle.borderStyle && selectComputedStyle.borderColor) {
                            selectBorder = selectComputedStyle.borderWidth + ' ' + selectComputedStyle.borderStyle + ' ' + selectComputedStyle.borderColor;
                        } else {
                            selectBorder = null;
                        }
                    }
                    const selectBorderColor = selectComputedStyle.borderColor;
                    const selectBorderRadius = selectComputedStyle.borderRadius;
                    const selectColor = selectComputedStyle.color;
                    const selectFontSize = selectComputedStyle.fontSize;
                    const selectFontFamily = selectComputedStyle.fontFamily;
                    // Construire selectPadding de manière sécurisée
                    let selectPadding = selectComputedStyle.padding;
                    if (!selectPadding || selectPadding === '0px') {
                        if (selectComputedStyle.paddingTop && selectComputedStyle.paddingRight && selectComputedStyle.paddingBottom && selectComputedStyle.paddingLeft) {
                            selectPadding = selectComputedStyle.paddingTop + ' ' + selectComputedStyle.paddingRight + ' ' + selectComputedStyle.paddingBottom + ' ' + selectComputedStyle.paddingLeft;
                        } else {
                            selectPadding = null;
                        }
                    }
                    
                    // Créer le wrapper avec les dimensions du select
                    const wrapper = document.createElement('div');
                    wrapper.className = 'bb-country-select-wrapper';
                    let wrapperStyle = 'position: relative;';
                    if (selectWidth !== 'auto' && selectWidth > 0) {
                        wrapperStyle += ' width: ' + selectWidth + 'px;';
                    }
                    if (selectHeight !== 'auto' && selectHeight > 0) {
                        wrapperStyle += ' min-height: ' + selectHeight + 'px;';
                    }
                    if (selectMinWidth) wrapperStyle += ' min-width: ' + selectMinWidth + ';';
                    if (selectMaxWidth) wrapperStyle += ' max-width: ' + selectMaxWidth + ';';
                    if (selectMinHeight) wrapperStyle += ' min-height: ' + selectMinHeight + ';';
                    if (selectMaxHeight) wrapperStyle += ' max-height: ' + selectMaxHeight + ';';
                    wrapper.style.cssText = wrapperStyle;
                    
                    // Masquer le select natif mais le garder fonctionnel
                    const selectStyle = element.style.cssText || '';
                    element.style.cssText = selectStyle + '; position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; overflow: hidden;';
                    element.setAttribute('aria-hidden', 'true');
                    
                    // Créer le bouton custom
                    const trigger = document.createElement('button');
                    trigger.type = 'button';
                    trigger.className = 'bb-country-select-trigger';
                    trigger.setAttribute('aria-haspopup', 'listbox');
                    trigger.setAttribute('aria-expanded', 'false');
                    
                    const selectedCountry = defaultCountry;
                    const selectedName = selectedCountry ? selectedCountry.name[language] : placeholder;
                    // Valider le code pays avant utilisation
                    const selectedFlag = selectedCountry && bbContents.utils.isValidCountryCode(selectedCountry.alpha2) ? 
                        '<img src="https://hatscripts.github.io/circle-flags/flags/' + selectedCountry.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(selectedCountry.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">' : 
                        '';
                    
                    trigger.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;"><span class="bb-country-flag" style="flex-shrink: 0;">' + selectedFlag + '</span><span class="bb-country-name" style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + bbContents.utils.sanitize(selectedName) + '</span></div><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink: 0; transition: transform 0.2s;"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    let triggerStyle = 'display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-sizing: border-box; transition: border-color 0.2s;';
                    // Appliquer les styles du select natif (récupérés depuis CET élément spécifique)
                    if (selectBgColor && selectBgColor !== 'rgba(0, 0, 0, 0)' && selectBgColor !== 'transparent') {
                        triggerStyle += ' background-color: ' + selectBgColor + ';';
                    }
                    if (selectBorder && selectBorder !== 'none' && selectBorder !== '0px none rgb(0, 0, 0)') {
                        triggerStyle += ' border: ' + selectBorder + ';';
                    } else if (selectBorderColor && selectBorderColor !== 'rgba(0, 0, 0, 0)') {
                        triggerStyle += ' border-color: ' + selectBorderColor + ';';
                    }
                    if (selectBorderRadius && selectBorderRadius !== '0px') {
                        triggerStyle += ' border-radius: ' + selectBorderRadius + ';';
                    }
                    // Toujours appliquer la couleur du texte (même si héritée)
                    if (selectColor && selectColor !== 'rgba(0, 0, 0, 0)') {
                        triggerStyle += ' color: ' + selectColor + ';';
                    }
                    if (selectFontSize) {
                        triggerStyle += ' font-size: ' + selectFontSize + ';';
                    }
                    if (selectFontFamily) {
                        triggerStyle += ' font-family: ' + selectFontFamily + ';';
                    }
                    if (selectPadding && selectPadding !== '0px') {
                        triggerStyle += ' padding: ' + selectPadding + ';';
                    }
                    // Utiliser les dimensions du select natif
                    if (selectWidth !== 'auto' && selectWidth > 0) {
                        triggerStyle += ' width: ' + selectWidth + 'px;';
                    } else {
                        triggerStyle += ' width: 100%;';
                    }
                    if (selectHeight !== 'auto' && selectHeight > 0) {
                        triggerStyle += ' height: ' + selectHeight + 'px;';
                    }
                    if (selectMinWidth) triggerStyle += ' min-width: ' + selectMinWidth + ';';
                    if (selectMaxWidth) triggerStyle += ' max-width: ' + selectMaxWidth + ';';
                    if (selectMinHeight) triggerStyle += ' min-height: ' + selectMinHeight + ';';
                    if (selectMaxHeight) triggerStyle += ' max-height: ' + selectMaxHeight + ';';
                    trigger.style.cssText = triggerStyle;
                    
                    // Variable pour stocker le pays sélectionné (pour chaque instance)
                    let currentSelectedCountry = defaultCountry;
                    
                    // Créer le popover
                    const popover = document.createElement('div');
                    popover.className = 'bb-country-select-popover';
                    popover.setAttribute('role', 'listbox');
                    let popoverStyle = 'position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; max-height: 300px; overflow: hidden; display: none; z-index: 50;';
                    // Garder les couleurs par défaut pour le dropdown
                    popoverStyle += ' background-color: white;';
                    popoverStyle += ' border: 1px solid #e5e7eb;';
                    // Appliquer uniquement le border-radius du select natif
                    if (selectBorderRadius && selectBorderRadius !== '0px') {
                        popoverStyle += ' border-radius: ' + selectBorderRadius + ';';
                    } else {
                        popoverStyle += ' border-radius: 6px;';
                    }
                    popoverStyle += ' box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);';
                    popover.style.cssText = popoverStyle;
                    
                    // Barre de recherche
                    const searchWrapper = document.createElement('div');
                    searchWrapper.className = 'bb-country-search';
                    searchWrapper.style.cssText = 'position: sticky; top: 0; padding: 8px; background-color: white; border-bottom: 1px solid #e5e7eb; z-index: 1;';
                    
                    const searchInput = document.createElement('input');
                    searchInput.type = 'text';
                    searchInput.className = 'bb-country-search-input';
                    searchInput.placeholder = searchPlaceholder;
                    searchInput.setAttribute('aria-label', searchPlaceholder);
                    let searchInputStyle = 'width: 100%; padding: 8px 12px; box-sizing: border-box;';
                    if (selectFontSize) {
                        searchInputStyle += ' font-size: ' + selectFontSize + ';';
                    }
                    if (selectFontFamily) {
                        searchInputStyle += ' font-family: ' + selectFontFamily + ';';
                    }
                    searchInputStyle += ' border: 1px solid #e5e7eb;';
                    if (selectBorderRadius && selectBorderRadius !== '0px') {
                        const borderRadiusValue = parseFloat(selectBorderRadius);
                        if (!isNaN(borderRadiusValue)) {
                            searchInputStyle += ' border-radius: ' + (borderRadiusValue * 0.75) + 'px;';
                        }
                    } else {
                        searchInputStyle += ' border-radius: 4px;';
                    }
                    searchInput.style.cssText = searchInputStyle;
                    
                    searchWrapper.appendChild(searchInput);
                    popover.appendChild(searchWrapper);
                    
                    // Liste des pays
                    const list = document.createElement('div');
                    list.className = 'bb-country-list';
                    list.style.cssText = 'overflow-y: auto; max-height: 250px; padding-bottom: 8px;';
                    popover.appendChild(list);
                    
                    // Fonction pour rendre la liste
                    function renderCountries(countries) {
                        if (countries.length === 0) {
                            const noResult = bbContents.config.i18n.noCountryFound[language] || 
                                           (language === 'en' ? 'No country found' : 'Aucun pays trouvé');
                            list.innerHTML = '<div style="padding: 16px; text-align: center; color: #9ca3af; font-size: inherit; font-family: inherit;">' + bbContents.utils.sanitize(noResult) + '</div>';
                            return;
                        }
                        
                        list.innerHTML = countries.map(function(country) {
                            // Valider le code pays avant utilisation
                            if (!bbContents.utils.isValidCountryCode(country.alpha2)) {
                                return ''; // Ignorer les pays avec codes invalides
                            }
                            const isSelected = currentSelectedCountry && currentSelectedCountry.alpha2 === country.alpha2;
                            let itemStyle = 'display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; transition: background-color 0.15s; min-height: 36px; box-sizing: border-box;';
                            // Appliquer uniquement font-size et font-family du select natif (pas la couleur)
                            // Échapper les valeurs CSS pour éviter l'injection
                            if (selectFontSize) {
                                itemStyle += ' font-size: ' + bbContents.utils.escapeCss(selectFontSize) + ';';
                            }
                            if (selectFontFamily) {
                                itemStyle += ' font-family: ' + bbContents.utils.escapeCss(selectFontFamily) + ';';
                            }
                            if (isSelected) {
                                itemStyle += ' background-color: #f3f4f6;';
                            }
                            return '<div class="bb-country-item" data-country="' + country.alpha2.toLowerCase() + '" role="option" aria-selected="' + (isSelected ? 'true' : 'false') + '" style="' + itemStyle + '"><img src="https://hatscripts.github.io/circle-flags/flags/' + country.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(country.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"><span style="line-height: 1.2;">' + bbContents.utils.sanitize(country.name[language]) + '</span></div>';
                        }).join('');
                        
                        // Ajouter hover effect
                        list.querySelectorAll('.bb-country-item').forEach(function(item) {
                            item.addEventListener('mouseenter', function() {
                                if (this.getAttribute('aria-selected') !== 'true') {
                                    this.style.backgroundColor = '#f3f4f6';
                                }
                            });
                            item.addEventListener('mouseleave', function() {
                                if (this.getAttribute('aria-selected') !== 'true') {
                                    this.style.backgroundColor = '';
                                }
                            });
                        });
                    }
                    
                    // Initialiser la liste
                    renderCountries(sortedCountries);
                    
                    // Assembler le wrapper
                    const parent = element.parentNode;
                    parent.insertBefore(wrapper, element);
                    wrapper.appendChild(element);
                    wrapper.appendChild(trigger);
                    wrapper.appendChild(popover);
                    
                    // Références
                    const flagSpan = trigger.querySelector('.bb-country-flag');
                    const nameSpan = trigger.querySelector('.bb-country-name');
                    const chevron = trigger.querySelector('svg');
                    
                    // Toggle dropdown
                    trigger.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const isOpen = popover.style.display === 'block';
                        
                        // Fermer tous les autres dropdowns avant d'ouvrir celui-ci
                        if (!isOpen) {
                            document.querySelectorAll('.bb-country-select-popover').forEach(function(otherPopover) {
                                if (otherPopover !== popover && otherPopover.style.display === 'block') {
                                    otherPopover.style.display = 'none';
                                    if (otherPopover.parentElement) {
                                        const otherTrigger = otherPopover.parentElement.querySelector('.bb-country-select-trigger');
                                        if (otherTrigger) {
                                            otherTrigger.setAttribute('aria-expanded', 'false');
                                            const otherChevron = otherTrigger.querySelector('svg');
                                            if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
                                        }
                                    }
                                }
                            });
                        }
                        
                        popover.style.display = isOpen ? 'none' : 'block';
                        trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
                        if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                        if (!isOpen) {
                            searchInput.focus();
                            searchInput.value = '';
                            renderCountries(sortedCountries);
                        }
                    });
                    
                    // Fermer en cliquant à l'extérieur
                    document.addEventListener('click', function(e) {
                        if (!wrapper.contains(e.target)) {
                            popover.style.display = 'none';
                            trigger.setAttribute('aria-expanded', 'false');
                            if (chevron) chevron.style.transform = 'rotate(0deg)';
                        }
                    });
                    
                    // Recherche
                    searchInput.addEventListener('input', function(e) {
                        const query = e.target.value.toLowerCase();
                        const filtered = sortedCountries.filter(function(c) {
                            return c.name[language].toLowerCase().indexOf(query) !== -1 ||
                                   c.alpha2.toLowerCase().indexOf(query) !== -1 ||
                                   c.alpha3.toLowerCase().indexOf(query) !== -1;
                        });
                        renderCountries(filtered);
                    });
                    
                    // Navigation clavier
                    searchInput.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') {
                            popover.style.display = 'none';
                            trigger.setAttribute('aria-expanded', 'false');
                            if (chevron) chevron.style.transform = 'rotate(0deg)';
                            trigger.focus();
                        }
                    });
                    
                    // Sélectionner un pays
                    list.addEventListener('click', function(e) {
                        const item = e.target.closest('.bb-country-item');
                        if (!item) return;
                        
                        const countryCode = item.dataset.country;
                        // Valider le code pays avant utilisation
                        if (!bbContents.utils.isValidCountryCode(countryCode)) {
                            return; // Code invalide, ignorer
                        }
                        const country = self.countries.find(function(c) {
                            return c.alpha2.toLowerCase() === countryCode.toLowerCase();
                        });
                        if (!country) return;
                        
                        // Mettre à jour le pays sélectionné
                        currentSelectedCountry = country;
                        
                        // Mettre à jour l'affichage (country.alpha2 déjà validé par la recherche)
                        if (bbContents.utils.isValidCountryCode(country.alpha2)) {
                            flagSpan.innerHTML = '<img src="https://hatscripts.github.io/circle-flags/flags/' + country.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(country.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">';
                            nameSpan.textContent = country.name[language];
                        }
                        
                        // Mettre à jour le select natif avec le nom du pays (pas le code ISO)
                        const countryName = country.name[language];
                        element.value = countryName;
                        // Mettre aussi le texte de l'option
                        const existingOption = Array.from(element.options).find(function(opt) {
                            return opt.value === countryName;
                        });
                        if (!existingOption) {
                            // Créer l'option si elle n'existe pas
                            const newOption = document.createElement('option');
                            newOption.value = countryName;
                            newOption.textContent = countryName;
                            // Vérifier s'il y a d'autres options avant de tout supprimer
                            if (element.options.length > 0) {
                                // Supprimer seulement les options vides ou placeholder
                                Array.from(element.options).forEach(function(opt) {
                                    if (!opt.value || opt.value === '') {
                                        opt.remove();
                                    }
                                });
                            }
                            element.appendChild(newOption);
                        }
                        const changeEvent = new Event('change', { bubbles: true });
                        element.dispatchEvent(changeEvent);
                        
                        // Fermer le dropdown
                        popover.style.display = 'none';
                        trigger.setAttribute('aria-expanded', 'false');
                        if (chevron) chevron.style.transform = 'rotate(0deg)';
                        searchInput.value = '';
                        renderCountries(sortedCountries);
                        
                        // Re-render pour mettre à jour l'état sélectionné
                        setTimeout(function() {
                            renderCountries(sortedCountries);
                        }, 0);
                    });
                    
                    wrapper.setAttribute('data-bb-country-select-processed', 'true');
                });
                
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
            // OPTIMISATION: Détection améliorée des bots pour éviter les appels API inutiles
            isBot: function() {
                const userAgent = navigator.userAgent.toLowerCase();
                const botPatterns = [
                    'bot', 'crawler', 'spider', 'scraper', 'googlebot', 'bingbot', 'slurp',
                    'duckduckbot', 'baiduspider', 'yandexbot', 'facebookexternalhit', 'twitterbot',
                    'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot', 'slackbot', 'headless',
                    'phantom', 'selenium', 'puppeteer', 'playwright', 'lighthouse', 'gtmetrix',
                    'pagespeed', 'pingdom', 'uptime', 'monitor', 'check', 'test'
                ];
                
                // Vérifications supplémentaires pour détecter plus de bots
                const isBot = botPatterns.some(pattern => userAgent.includes(pattern)) || 
                       navigator.webdriver || 
                       !navigator.userAgent ||
                       !window.chrome || // Détecte les navigateurs headless
                       navigator.userAgent.includes('HeadlessChrome') ||
                       window.navigator.plugins.length === 0; // Bots n'ont souvent pas de plugins
                
                if (isBot) {
                    // Log pour debug (en mode debug seulement)
                    if (bbContents.config.debug) {
                        bbContents.utils.log('Bot détecté, pas d\'appel API YouTube');
                    }
                }
                
                return isBot;
            },
            
            // OPTIMISATION: Cache amélioré avec protection contre les appels multiples
            cache: {
                get: function(key) {
                    try {
                        const cached = localStorage.getItem(key);
                        if (!cached) return null;
                        
                        const data = JSON.parse(cached);
                        const now = Date.now();
                        
                        // OPTIMISATION: Cache plus long (24h maintenu)
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
            
            // OPTIMISATION: Protection globale contre les appels multiples
            _activeRequests: new Set(),
            
            isRequestActive: function(cacheKey) {
                return this._activeRequests.has(cacheKey);
            },
            
            markRequestActive: function(cacheKey) {
                this._activeRequests.add(cacheKey);
            },
            
            markRequestComplete: function(cacheKey) {
                this._activeRequests.delete(cacheKey);
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
                    // OPTIMISATION: Réduire drastiquement les retries (de 50 à 10)
                    const retryCount = element.getAttribute('data-youtube-retry-count') || '0';
                    const retries = parseInt(retryCount);
                    
                    if (retries < 10) { // 10 * 500ms = 5 secondes max (plus espacé)
                        element.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Configuration YouTube en cours...</div>';
                        element.setAttribute('data-youtube-retry-count', (retries + 1).toString());
                        
                        // OPTIMISATION: Espacer les retries (500ms au lieu de 100ms)
                        setTimeout(() => {
                            this.initElement(element);
                        }, 500);
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
                
                // OPTIMISATION: Protection globale contre les appels multiples
                if (this.isRequestActive(cacheKey)) {
                    // Un appel est déjà en cours pour cette clé, attendre
                    const checkActive = () => {
                        if (!this.isRequestActive(cacheKey)) {
                            // L'autre appel est terminé, vérifier le cache
                            const newCachedData = this.cache.get(cacheKey);
                            if (newCachedData && newCachedData.value) {
                                this.generateYouTubeFeed(container, template, newCachedData.value, allowShorts, language);
                                    } else {
                                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Erreur de chargement</div>';
                            }
                        } else {
                            setTimeout(checkActive, 200); // Vérifier moins souvent
                        }
                    };
                    checkActive();
                    return;
                }
                
                // Marquer qu'un appel API est en cours
                this.markRequestActive(cacheKey);
                
                // Afficher un loader
                container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Chargement des vidéos YouTube...</div>';
                
                // Appeler l'API via le Worker
                // Valider l'endpoint et le channelId avant fetch
                if (!endpoint || typeof endpoint !== 'string') {
                    throw new Error('Endpoint YouTube invalide');
                }
                // Vérifier que l'endpoint correspond à la configuration
                if (bbContents.config.youtubeEndpoint && !endpoint.startsWith(bbContents.config.youtubeEndpoint)) {
                    throw new Error('Endpoint YouTube non autorisé');
                }
                // Valider le format de channelId (alphanumérique, tirets, underscores)
                if (!channelId || !/^[a-zA-Z0-9_-]+$/.test(channelId)) {
                    throw new Error('Channel ID invalide');
                }
                // Valider videoCount et allowShorts
                const safeVideoCount = parseInt(videoCount, 10);
                const safeAllowShorts = allowShorts === true || allowShorts === 'true';
                
                fetch(`${endpoint}?channelId=${encodeURIComponent(channelId)}&maxResults=${safeVideoCount}&allowShorts=${safeAllowShorts}`)
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
                        
                        // OPTIMISATION: Sauvegarder en cache pour 24h
                        this.cache.set(cacheKey, data);
                        // Données YouTube mises en cache pour 24h (économie API)
                        
                        this.generateYouTubeFeed(container, template, data, allowShorts, language);
                        
                        // OPTIMISATION: Libérer le verrou avec la nouvelle méthode
                        this.markRequestComplete(cacheKey);
                    })
                    .catch(error => {
                        // Erreur dans le module youtube
                        
                        // OPTIMISATION: Libérer le verrou en cas d'erreur
                        this.markRequestComplete(cacheKey);
                        
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
                        
                        container.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>${bbContents.utils.sanitize(error.message || 'Erreur inconnue')}</div>`;
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
            
            // OPTIMISATION: Nettoyer le cache expiré (48h)
            cleanCache: function() {
                try {
                    const keys = Object.keys(localStorage);
                    const now = Date.now();
                    let cleaned = 0;
                    
                    keys.forEach(key => {
                        if (key.startsWith('youtube_')) {
                            try {
                                const cached = JSON.parse(localStorage.getItem(key));
                                // OPTIMISATION: Cache 24h maintenu
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