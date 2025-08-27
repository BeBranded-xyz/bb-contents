/**
 * BeBranded Contents
 * Contenus additionnels français pour Webflow
 * @version 1.0.24-beta
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
        version: '1.0.24-beta',
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
                    setTimeout(() => {
                        this.init();
                        this._reinitScheduled = false;
                    }, 100);
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
        // Module SEO
        seo: {
            detect: function(scope) {
                return scope.querySelector('[bb-seo]') !== null;
            },
            
            init: function(scope) {
                const elements = scope.querySelectorAll('[bb-seo]');
                if (elements.length === 0) return;
                
                bbContents.utils.log('Module détecté: seo');
                
                elements.forEach(element => {
                    if (element.bbProcessed) return;
                    element.bbProcessed = true;
                    
                    const title = bbContents._getAttr(element, 'bb-seo-title');
                    const description = bbContents._getAttr(element, 'bb-seo-description');
                    const keywords = bbContents._getAttr(element, 'bb-seo-keywords');
                    
                    if (title) {
                        document.title = title;
                    }
                    
                    if (description) {
                        let meta = document.querySelector('meta[name="description"]');
                        if (!meta) {
                            meta = document.createElement('meta');
                            meta.name = 'description';
                            document.head.appendChild(meta);
                        }
                        meta.content = description;
                    }
                    
                    if (keywords) {
                        let meta = document.querySelector('meta[name="keywords"]');
                        if (!meta) {
                            meta = document.createElement('meta');
                            meta.name = 'keywords';
                            document.head.appendChild(meta);
                        }
                        meta.content = keywords;
                    }
                });
                
                bbContents.utils.log('Module SEO initialisé:', elements.length, 'éléments');
            }
        },

        // Module Images
        images: {
            detect: function(scope) {
                return scope.querySelector('[bb-images]') !== null;
            },
            
            init: function(scope) {
                const elements = scope.querySelectorAll('[bb-images]');
                if (elements.length === 0) return;
                
                bbContents.utils.log('Module détecté: images');
                
                elements.forEach(element => {
                    if (element.bbProcessed) return;
                    element.bbProcessed = true;
                    
                    const lazy = bbContents._getAttr(element, 'bb-images-lazy');
                    const webp = bbContents._getAttr(element, 'bb-images-webp');
                    
                    if (lazy === 'true') {
                        // Implémentation lazy loading basique
                        const images = element.querySelectorAll('img');
                        images.forEach(img => {
                            if (!img.loading) {
                                img.loading = 'lazy';
                            }
                        });
                    }
                    
                    if (webp === 'true') {
                        // Support WebP basique
                        const images = element.querySelectorAll('img');
                        images.forEach(img => {
                            const src = img.src;
                            if (src && !src.includes('.webp')) {
                                // Logique de conversion WebP (à implémenter selon les besoins)
                                bbContents.utils.log('Support WebP activé pour:', src);
                            }
                        });
                    }
                });
                
                bbContents.utils.log('Module Images initialisé:', elements.length, 'éléments');
            }
        },

        // Module Infinite Scroll
        infinite: {
            detect: function(scope) {
                return scope.querySelector('[bb-infinite]') !== null;
            },
            
            init: function(scope) {
                const elements = scope.querySelectorAll('[bb-infinite]');
                if (elements.length === 0) return;
                
                bbContents.utils.log('Module détecté: infinite');
                
                elements.forEach(element => {
                    if (element.bbProcessed) return;
                    element.bbProcessed = true;
                    
                    const threshold = bbContents._getAttr(element, 'bb-infinite-threshold') || '0.1';
                    const url = bbContents._getAttr(element, 'bb-infinite-url');
                    
                    if (!url) {
                        bbContents.utils.log('Erreur: bb-infinite-url manquant');
                        return;
                    }
                    
                    // Implémentation basique d'infinite scroll
                    let loading = false;
                    let page = 1;
                    
                    const loadMore = () => {
                        if (loading) return;
                        loading = true;
                        
                        fetch(`${url}?page=${page}`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.items && data.items.length > 0) {
                                    // Ajouter le contenu
                                    element.innerHTML += data.html || '';
                                    page++;
                                    loading = false;
                                }
                            })
                            .catch(error => {
                                bbContents.utils.log('Erreur infinite scroll:', error);
                                loading = false;
                            });
                    };
                    
                    // Observer d'intersection pour déclencher le chargement
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                loadMore();
                            }
                        });
                    }, { threshold: parseFloat(threshold) });
                    
                    observer.observe(element);
                });
                
                bbContents.utils.log('Module Infinite Scroll initialisé:', elements.length, 'éléments');
            }
        },

        // Module Marquee - Version live 1.0.0 avec protections
        marquee: {
            detect: function(scope) {
                const s = scope || document;
                return s.querySelector(bbContents._attrSelector('marquee')) !== null;
            },
            
            init: function(root) {
                const scope = root || document;
                if (scope.closest && scope.closest('[data-bb-disable]')) return;
                const elements = scope.querySelectorAll(bbContents._attrSelector('marquee'));

                elements.forEach(function(element) {
                    // Vérifier si l'élément a déjà été traité par un autre module
                    if (element.bbProcessed || element.hasAttribute('data-bb-youtube-processed')) {
                        bbContents.utils.log('Élément marquee déjà traité par un autre module, ignoré:', element);
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
                    
                    // Créer le conteneur principal
                    const mainContainer = document.createElement('div');
                    const isVertical = orientation === 'vertical';
                    mainContainer.style.cssText = `
                        position: relative;
                        width: 100%;
                        height: ${isVertical ? height + 'px' : 'auto'};
                        overflow: hidden;
                        min-height: ${isVertical ? '100px' : '50px'};
                        ${minHeight ? `min-height: ${minHeight};` : ''}
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
                    
                    // Marquer l'élément comme traité par le module marquee
                    element.setAttribute('data-bb-marquee-processed', 'true');

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
        },

        // Module YouTube Feed
        youtube: {
            detect: function(scope) {
                return scope.querySelector('[bb-youtube-channel]') !== null;
            },
            
            init: function(scope) {
                const elements = scope.querySelectorAll('[bb-youtube-channel]');
                if (elements.length === 0) return;
                
                bbContents.utils.log('Module détecté: youtube');
                
                elements.forEach(element => {
                    // Vérifier si l'élément a déjà été traité par un autre module
                    if (element.bbProcessed || element.hasAttribute('data-bb-marquee-processed')) {
                        bbContents.utils.log('Élément youtube déjà traité par un autre module, ignoré:', element);
                        return;
                    }
                    element.bbProcessed = true;
                    
                    const channelId = bbContents._getAttr(element, 'bb-youtube-channel');
                    const videoCount = bbContents._getAttr(element, 'bb-youtube-video-count') || '10';
                    const allowShorts = bbContents._getAttr(element, 'bb-youtube-allow-shorts') === 'true';
                    const endpoint = bbContents.config.youtubeEndpoint;
                    
                    if (!channelId) {
                        bbContents.utils.log('Erreur: bb-youtube-channel manquant');
                        return;
                    }
                    
                    if (!endpoint) {
                        bbContents.utils.log('Erreur: youtubeEndpoint non configuré. Utilisez bbContents.config.youtubeEndpoint = "votre-worker-url"');
                        element.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Configuration YouTube manquante</strong><br>Ajoutez : bbContents.config.youtubeEndpoint = "votre-worker-url"</div>';
                        return;
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
                        bbContents.utils.log('Erreur: élément [bb-youtube-item] manquant');
                        element.innerHTML = '<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Template manquant</strong><br>Ajoutez un élément avec l\'attribut bb-youtube-item</div>';
                        return;
                    }
                    
                    // Cacher le template original
                    template.style.display = 'none';
                    
                    // Marquer l'élément comme traité par le module YouTube
                    element.setAttribute('data-bb-youtube-processed', 'true');
                    
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
                            this.generateYouTubeFeed(container, template, data, allowShorts);
                        })
                        .catch(error => {
                            bbContents.utils.log('Erreur dans le module youtube:', error);
                            container.innerHTML = `<div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;"><strong>Erreur de chargement</strong><br>${error.message}</div>`;
                        });
                });
            },
            
            generateYouTubeFeed: function(container, template, data, allowShorts) {
                if (!data.items || data.items.length === 0) {
                    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Aucune vidéo trouvée</div>';
                    return;
                }
                
                // Les vidéos sont déjà filtrées par l'API YouTube selon allowShorts
                let videos = data.items;
                bbContents.utils.log(`Vidéos reçues de l'API: ${videos.length} (allowShorts: ${allowShorts})`);
                
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
                    this.fillVideoData(clone, videoId, snippet);
                    
                    // Ajouter au conteneur
                    container.appendChild(clone);
                });
                
                bbContents.utils.log(`YouTube Feed généré: ${videos.length} vidéos`);
            },
            
            fillVideoData: function(element, videoId, snippet) {
                // Remplir le lien directement sur l'élément (link block)
                if (element.tagName === 'A' || element.hasAttribute('bb-youtube-item')) {
                    element.href = `https://www.youtube.com/watch?v=${videoId}`;
                    element.target = '_blank';
                    element.rel = 'noopener noreferrer';
                }
                
                // Remplir la thumbnail (haute qualité)
                const thumbnail = element.querySelector('[bb-youtube-thumbnail]');
                if (thumbnail) {
                    // Utiliser la meilleure qualité disponible
                    const highQualityUrl = snippet.thumbnails.maxres?.url || 
                                         snippet.thumbnails.high?.url || 
                                         snippet.thumbnails.medium?.url || 
                                         snippet.thumbnails.default?.url;
                    thumbnail.src = highQualityUrl;
                    thumbnail.alt = snippet.title;
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
                    date.textContent = this.formatDate(snippet.publishedAt);
                }
                
                // Remplir le nom de la chaîne
                const channel = element.querySelector('[bb-youtube-channel]');
                if (channel) {
                    channel.textContent = snippet.channelTitle;
                }
            },
            
            formatDate: function(dateString) {
                const date = new Date(dateString);
                const now = new Date();
                const diffTime = Math.abs(now - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) return 'Il y a 1 jour';
                if (diffDays < 7) return `Il y a ${diffDays} jours`;
                if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
                if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
                return `Il y a ${Math.floor(diffDays / 365)} ans`;
            },
            
            // Fonction pour décoder les entités HTML
            decodeHtmlEntities: function(text) {
                if (!text) return '';
                const textarea = document.createElement('textarea');
                textarea.innerHTML = text;
                return textarea.value;
            }
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