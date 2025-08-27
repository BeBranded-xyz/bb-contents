/**
 * BeBranded Contents
 * Contenus additionnels français pour Webflow
 * @version 1.0.20-beta
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
        version: '1.0.20-beta',
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

        // Module Marquee - Version simplifiée et corrigée
        marquee: {
            detect: function(scope) {
                return scope.querySelector('[bb-marquee]') !== null;
            },
            
            init: function(scope) {
                const elements = scope.querySelectorAll('[bb-marquee]');
                if (elements.length === 0) return;
                
                bbContents.utils.log('Module détecté: marquee');
                
                elements.forEach(element => {
                    // Vérifier si l'élément a déjà été traité par un autre module
                    if (element.bbProcessed || element.hasAttribute('data-bb-youtube-processed')) {
                        bbContents.utils.log('Élément marquee déjà traité par un autre module, ignoré:', element);
                        return;
                    }
                    element.bbProcessed = true;
                    
                    // Récupérer les options
                    const speed = bbContents._getAttr(element, 'bb-marquee-speed') || '100';
                    const direction = bbContents._getAttr(element, 'bb-marquee-direction') || 'left';
                    const pause = bbContents._getAttr(element, 'bb-marquee-pause') || 'true';
                    const gap = bbContents._getAttr(element, 'bb-marquee-gap') || '50';
                    const orientation = bbContents._getAttr(element, 'bb-marquee-orientation') || 'horizontal';
                    const height = bbContents._getAttr(element, 'bb-marquee-height');
                    const minHeight = bbContents._getAttr(element, 'bb-marquee-min-height');
                    
                    // Sauvegarder le contenu original
                    const originalContent = element.innerHTML;
                    
                    // Créer le conteneur principal
                    const mainContainer = document.createElement('div');
                    mainContainer.style.cssText = `
                        overflow: hidden;
                        position: relative;
                        width: 100%;
                        ${height ? `height: ${height};` : ''}
                        ${minHeight ? `min-height: ${minHeight};` : ''}
                    `;
                    
                    // Créer le conteneur de défilement
                    const scrollContainer = document.createElement('div');
                    scrollContainer.style.cssText = `
                        display: flex;
                        align-items: center;
                        ${orientation === 'vertical' ? 'flex-direction: column;' : ''}
                        gap: ${gap}px;
                        will-change: transform;
                    `;
                    
                    // Dupliquer le contenu
                    scrollContainer.innerHTML = originalContent + originalContent;
                    
                    // Assembler
                    mainContainer.appendChild(scrollContainer);
                    // Sauvegarder le contenu original avant de vider
                    const originalMarqueeContent = element.innerHTML;
                    element.innerHTML = '';
                    element.appendChild(mainContainer);
                    
                    // Marquer l'élément comme traité par le module marquee
                    element.setAttribute('data-bb-marquee-processed', 'true');
                    
                    // Animation JavaScript simple et efficace
                    const isVertical = orientation === 'vertical';
                    let animationId;
                    let startTime;
                    let currentPosition = 0;
                    
                    const animate = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const elapsed = timestamp - startTime;
                        
                        // Vitesse en millisecondes
                        const speedMs = parseInt(speed);
                        const progress = (elapsed % speedMs) / speedMs;
                        
                        // Calculer la taille du contenu
                        const contentSize = isVertical ? scrollContainer.scrollHeight / 2 : scrollContainer.scrollWidth / 2;
                        currentPosition = -progress * contentSize;
                        
                        // Appliquer la transformation
                        scrollContainer.style.transform = isVertical 
                            ? `translateY(${currentPosition}px)`
                            : `translateX(${currentPosition}px)`;
                        
                        animationId = requestAnimationFrame(animate);
                    };
                    
                    // Démarrer l'animation
                    setTimeout(() => {
                        animationId = requestAnimationFrame(animate);
                    }, 100);
                    
                    // Pause au survol
                    if (pause === 'true') {
                        mainContainer.addEventListener('mouseenter', () => {
                            if (animationId) {
                                cancelAnimationFrame(animationId);
                                animationId = null;
                            }
                        });
                        mainContainer.addEventListener('mouseleave', () => {
                            if (!animationId) {
                                animationId = requestAnimationFrame(animate);
                            }
                        });
                    }
                    
                    // Auto-height pour les logos horizontaux
                    if (orientation === 'horizontal' && !height && !minHeight) {
                        const logos = element.querySelectorAll('.bb-marquee_logo, img, svg');
                        let maxHeight = 0;
                        logos.forEach(logo => {
                            const rect = logo.getBoundingClientRect();
                            if (rect.height > maxHeight) maxHeight = rect.height;
                        });
                        if (maxHeight > 0) {
                            mainContainer.style.height = maxHeight + 'px';
                        }
                    }
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