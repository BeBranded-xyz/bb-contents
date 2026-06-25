/**
 * Module Marquee
 * Duplique et anime en boucle un bloc de contenu, horizontalement ou verticalement.
 *
 * @attr {string} bb-marquee - Active le module sur le conteneur
 * @attr {'left'|'right'|'top'|'bottom'} [bb-marquee-direction=left] - Sens du défilement
 * @attr {number} [bb-marquee-speed=100] - Vitesse en pixels/seconde
 * @attr {'true'|'false'} [bb-marquee-pause=true] - Pause l'animation au survol
 * @attr {number} [bb-marquee-gap=50] - Espace entre les blocs (px)
 * @attr {'horizontal'|'vertical'} [bb-marquee-orientation=horizontal] - Orientation du défilement
 * @attr {number|'auto'} [bb-marquee-height=300] - Hauteur du conteneur vertical (px ou 'auto')
 * @attr {string} [bb-marquee-min-height] - Hauteur minimale du conteneur (valeur CSS)
 */
const marquee = {
    _hasDropdownInBlock(block) {
        if (!block || !block.querySelector) return false;
        return block.querySelector('.w-dropdown') !== null ||
            block.querySelector('[class*="dropdown"]') !== null;
    },

    _enableMarqueeDropdowns(block) {
        if (!block || !block.querySelectorAll) return;
        const items = block.querySelectorAll('.bb-marquee_item, [role="listitem"]');
        const itemList = items.length ? items : block.querySelectorAll(':scope > *');
        itemList.forEach(function(item) {
            const dropdowns = item.querySelectorAll('.w-dropdown, [class*="dropdown"]');
            dropdowns.forEach(function(dropdown) {
                const list = dropdown.querySelector('.w-dropdown-list, [class*="dropdown-list"], [class*="dropdown_list"]');
                const toggle = dropdown.querySelector('.w-dropdown-toggle, [class*="dropdown-toggle"]');
                if (!list || !toggle) return;
                item.style.overflow = 'visible';
                dropdown.style.overflow = 'visible';
                let portalWrapper = null;
                let leaveTimer = null;
                let scrollResizeCleanup = null;

                var marqueeEl = dropdown.closest('[data-bb-marquee-processed]');

                function updatePortalPosition() {
                    if (!portalWrapper) return;
                    var rect = toggle.getBoundingClientRect();
                    portalWrapper.style.right = (window.innerWidth - rect.right) + 'px';
                    portalWrapper.style.top = rect.top + 'px';
                }

                function closePortal() {
                    if (leaveTimer) clearTimeout(leaveTimer);
                    leaveTimer = null;
                    if (scrollResizeCleanup) { scrollResizeCleanup(); scrollResizeCleanup = null; }
                    if (portalWrapper && portalWrapper.parentNode) {
                        portalWrapper.parentNode.removeChild(portalWrapper);
                    }
                    portalWrapper = null;
                    dropdown.classList.remove('w--open');
                    if (marqueeEl) marqueeEl.removeAttribute('data-bb-marquee-dropdown-open');
                }

                function openPortal() {
                    if (leaveTimer) clearTimeout(leaveTimer);
                    leaveTimer = null;
                    if (portalWrapper && portalWrapper.parentNode) return;
                    if (marqueeEl) marqueeEl.setAttribute('data-bb-marquee-dropdown-open', '1');
                    var rect = toggle.getBoundingClientRect();
                    var listStyle = getComputedStyle(list);
                    portalWrapper = document.createElement('div');
                    portalWrapper.setAttribute('data-bb-marquee-dropdown-portal', 'true');
                    portalWrapper.className = 'w-dropdown';
                    portalWrapper.style.cssText =
                        'position:fixed;transform:translateY(-100%);margin-top:-4px;z-index:9999;background:none;border:none;';
                    var clone = list.cloneNode(true);
                    clone.style.display = 'block';
                    clone.style.background = listStyle.background || listStyle.backgroundColor || 'transparent';
                    clone.style.backgroundColor = listStyle.backgroundColor;
                    clone.style.backgroundImage = listStyle.backgroundImage;
                    portalWrapper.appendChild(clone);
                    portalWrapper.addEventListener('mouseenter', function() {
                        if (leaveTimer) clearTimeout(leaveTimer);
                        leaveTimer = null;
                    });
                    portalWrapper.addEventListener('mouseleave', function() {
                        leaveTimer = setTimeout(closePortal, 120);
                    });
                    document.body.appendChild(portalWrapper);
                    updatePortalPosition();
                    dropdown.classList.add('w--open');
                    var onScrollOrResize = function() {
                        if (portalWrapper && portalWrapper.parentNode) updatePortalPosition();
                    };
                    window.addEventListener('scroll', onScrollOrResize, true);
                    window.addEventListener('resize', onScrollOrResize);
                    scrollResizeCleanup = function() {
                        window.removeEventListener('scroll', onScrollOrResize, true);
                        window.removeEventListener('resize', onScrollOrResize);
                    };
                }

                dropdown.addEventListener('mouseenter', function() {
                    if (leaveTimer) clearTimeout(leaveTimer);
                    leaveTimer = null;
                    openPortal();
                });
                dropdown.addEventListener('mouseleave', function(e) {
                    if (portalWrapper && e.relatedTarget && portalWrapper.contains(e.relatedTarget)) return;
                    leaveTimer = setTimeout(closePortal, 120);
                });
            });
        });
    },

    init(root) {
        const scope = root || document;
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('marquee'));
        const self = this;

        elements.forEach(function(element) {
            if (element.hasAttribute('data-bb-marquee-processed')) return;
            element.setAttribute('data-bb-marquee-processed', 'true');

            const speed = bbContents._getAttr(element, 'bb-marquee-speed') || '100';
            const direction = bbContents._getAttr(element, 'bb-marquee-direction') || 'left';
            const pauseOnHover = bbContents._getAttr(element, 'bb-marquee-pause') || 'true';
            const gap = bbContents._getAttr(element, 'bb-marquee-gap') || '50';
            const orientation = bbContents._getAttr(element, 'bb-marquee-orientation') || 'horizontal';
            const height = bbContents._getAttr(element, 'bb-marquee-height') || '300';
            const minHeight = bbContents._getAttr(element, 'bb-marquee-min-height');
            const isMobileMarquee = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            const originalHTML = element.innerHTML;

            const mainContainer = document.createElement('div');
            const isVertical = orientation === 'vertical';
            const useAutoHeight = isVertical && height === 'auto';

            const parentComputedStyle = getComputedStyle(element);
            const parentOverflow = parentComputedStyle.overflow;
            const parentOverflowX = parentComputedStyle.overflowX;
            const parentOverflowY = parentComputedStyle.overflowY;

            const isParentOverflowVisible = (parentOverflow === 'visible' || parentOverflow === '') &&
                                           (parentOverflowX === 'visible' || parentOverflowX === '') &&
                                           (parentOverflowY === 'visible' || parentOverflowY === '');
            const mainContainerOverflow = isParentOverflowVisible ? 'visible' : 'hidden';

            mainContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: ${isVertical ? (height === 'auto' ? 'auto' : height + 'px') : 'auto'};
                overflow: ${mainContainerOverflow};
                min-height: auto;
                ${minHeight ? `min-height: ${minHeight};` : ''}
            `;

            const scrollContainer = document.createElement('div');
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
            const hasDropdowns = self._hasDropdownInBlock(mainBlock);
            if (hasDropdowns) {
                mainContainer.style.overflow = 'visible';
                scrollContainer.style.overflow = 'visible';
            }

            const preloadAllImagesFirst = function(block) {
                return new Promise(function(resolve) {
                    const images = block.querySelectorAll('img');
                    if (images.length === 0) { resolve(); return; }

                    let loadedCount = 0;
                    let errorCount = 0;
                    const totalImages = images.length;

                    const checkComplete = function() {
                        if (loadedCount + errorCount >= totalImages) resolve();
                    };

                    images.forEach(function(img) {
                        if (img.dataset.src && !img.src) img.src = img.dataset.src;

                        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                            loadedCount++;
                            checkComplete();
                        } else {
                            const preloadImg = new Image();
                            preloadImg.onload = function() {
                                if (img.src) img.src = img.src;
                                let domAttempts = 0;
                                const checkDomImage = function() {
                                    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                                        loadedCount++;
                                        checkComplete();
                                    } else if (++domAttempts < 200) { // ~2s hard cap
                                        setTimeout(checkDomImage, 10);
                                    } else {
                                        errorCount++;
                                        checkComplete();
                                    }
                                };
                                setTimeout(checkDomImage, 10);
                            };
                            preloadImg.onerror = function() {
                                errorCount++;
                                checkComplete();
                            };
                            if (img.src) { preloadImg.src = img.src; }
                            else if (img.dataset.src) { preloadImg.src = img.dataset.src; }
                            else { errorCount++; checkComplete(); }

                            img.onload = function() {
                                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                                    loadedCount++;
                                    checkComplete();
                                }
                            };
                            if (img.src) img.src = img.src;
                        }
                    });

                    setTimeout(function() {
                        if (loadedCount + errorCount < totalImages) {
                            errorCount = totalImages - loadedCount;
                            checkComplete();
                        }
                    }, isMobileMarquee ? 1500 : 5000);
                });
            };

            if (!isVertical) {
                setTimeout(function() {
                    let marqueeItems = mainBlock.querySelectorAll('.bb-marquee_item, [role="listitem"]');
                    if (marqueeItems.length === 0) marqueeItems = mainBlock.querySelectorAll(':scope > *');
                    marqueeItems.forEach(function(item) {
                        const computedStyle = getComputedStyle(item);
                        const itemWidth = computedStyle.width;
                        if (itemWidth && itemWidth !== 'auto' && itemWidth !== '0px') {
                            item.style.minWidth = itemWidth;
                            item.style.width = itemWidth;
                        }
                        const textContainers = item.querySelectorAll('.use-case_client, .testimonial_client-info, [class*="text"], p, span');
                        textContainers.forEach(function(container) {
                            const containerStyle = container.getAttribute('style');
                            const shouldPreserveAuto = container.classList.contains('tag-m') ||
                                                      container.classList.contains('tag') ||
                                                      container.classList.contains('badge') ||
                                                      (containerStyle && containerStyle.includes('width'));
                            if (shouldPreserveAuto) return;

                            const hasInlineWidth = container.style.width && container.style.width !== '';
                            if (hasInlineWidth) return;

                            const isTextContainer = container.classList.contains('use-case_client') ||
                                                   container.classList.contains('testimonial_client-info') ||
                                                   (container.tagName === 'P' && !container.classList.contains('tag'));

                            if (isTextContainer) {
                                const containerComputed = getComputedStyle(container);
                                if (!containerComputed.width || containerComputed.width === 'auto' || containerComputed.width === '0px') {
                                    container.style.width = '100%';
                                }
                                container.style.whiteSpace = 'normal';
                                container.style.wordWrap = 'break-word';
                                container.style.overflowWrap = 'break-word';
                            }
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

            preloadAllImagesFirst(mainBlock).then(function() {
                const repeatBlock1 = mainBlock.cloneNode(true);
                const repeatBlock2 = mainBlock.cloneNode(true);

                const forceImagesDisplay = function(block) {
                    block.querySelectorAll('img').forEach(function(img) {
                        if (img.dataset.src && !img.src) img.src = img.dataset.src;
                        if (img.src) {
                            img.src = img.src;
                            img.style.opacity = '1';
                            img.style.visibility = 'visible';
                            void img.offsetHeight;
                        }
                    });
                };

                forceImagesDisplay(repeatBlock1);
                forceImagesDisplay(repeatBlock2);

                const tempContainer = document.createElement('div');
                tempContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px; visibility: hidden;';
                tempContainer.appendChild(repeatBlock1);
                tempContainer.appendChild(repeatBlock2);
                if (!isMobileMarquee) document.body.appendChild(tempContainer);

                const waitForImagesRender = function(block) {
                    return new Promise(function(resolve) {
                        const images = block.querySelectorAll('img');
                        if (images.length === 0) { resolve(); return; }

                        let renderedCount = 0;
                        const totalImages = images.length;
                        const checkRendered = function() { if (renderedCount >= totalImages) resolve(); };

                        images.forEach(function(img) {
                            let renderAttempts = 0;
                            const checkImage = function() {
                                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0 && img.offsetWidth > 0) {
                                    renderedCount++;
                                    checkRendered();
                                } else if (++renderAttempts < 200) { // ~2s hard cap
                                    setTimeout(checkImage, 10);
                                } else {
                                    renderedCount++; // give up waiting; count as rendered
                                    checkRendered();
                                }
                            };
                            if (img.dataset.src && !img.src) img.src = img.dataset.src;

                            if (img.complete && img.naturalWidth > 0 && img.offsetWidth > 0) {
                                renderedCount++;
                                checkRendered();
                            } else {
                                img.onload = function() { setTimeout(checkImage, 10); };
                                checkImage();
                            }
                        });

                        setTimeout(function() {
                            if (renderedCount < totalImages) { renderedCount = totalImages; checkRendered(); }
                        }, isMobileMarquee ? 500 : 2000);
                    });
                };

                const forceFullRender = function() {
                    return new Promise(function(resolve) {
                        const totalWidth = Math.max(
                            repeatBlock1.offsetWidth || 0,
                            repeatBlock2.offsetWidth || 0
                        );
                        if (totalWidth > 0 && totalWidth > window.innerWidth) {
                            tempContainer.style.left = '0px';
                            tempContainer.style.width = totalWidth + 'px';
                            tempContainer.style.overflow = 'visible';
                            void tempContainer.offsetWidth;
                            const translateXEnd = Math.max(0, totalWidth - window.innerWidth);
                            tempContainer.style.transform = 'translateX(-' + translateXEnd + 'px)';
                            void tempContainer.offsetWidth;
                            requestAnimationFrame(function() {
                                tempContainer.style.transform = 'translateX(-0px)';
                                void tempContainer.offsetWidth;
                                requestAnimationFrame(function() {
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
                            requestAnimationFrame(function() { requestAnimationFrame(resolve); });
                        }
                    });
                };

                const doFinish = function() {
                    if (tempContainer && tempContainer.parentNode === document.body) {
                        document.body.removeChild(tempContainer);
                    }
                    scrollContainer.appendChild(mainBlock);
                    scrollContainer.appendChild(repeatBlock1);
                    scrollContainer.appendChild(repeatBlock2);
                    mainContainer.appendChild(scrollContainer);

                    if (!isVertical) {
                        requestAnimationFrame(function() {
                            requestAnimationFrame(function() {
                                let items = mainBlock.querySelectorAll('.bb-marquee_item, [role="listitem"]');
                                if (items.length === 0) items = mainBlock.querySelectorAll(':scope > *');
                                let maxHeight = 0;
                                items.forEach(function(item) {
                                    const itemHeight = item.offsetHeight;
                                    if (itemHeight > maxHeight) maxHeight = itemHeight;
                                });
                                if (maxHeight === 0) maxHeight = mainBlock.offsetHeight || scrollContainer.offsetHeight;
                                if (maxHeight > 0) mainContainer.style.height = maxHeight + 'px';

                                if (hasDropdowns) {
                                    self._enableMarqueeDropdowns(mainBlock);
                                    self._enableMarqueeDropdowns(repeatBlock1);
                                    self._enableMarqueeDropdowns(repeatBlock2);
                                }
                            });
                        });
                    } else {
                        if (hasDropdowns) {
                            self._enableMarqueeDropdowns(mainBlock);
                            self._enableMarqueeDropdowns(repeatBlock1);
                            self._enableMarqueeDropdowns(repeatBlock2);
                        }
                    }

                    element.innerHTML = '';
                    element.appendChild(mainContainer);
                    // attribute already set before async chain; ensure it persists
                    element.setAttribute('data-bb-marquee-processed', 'true');

                    requestAnimationFrame(function() {
                        requestAnimationFrame(function() {
                            const initDelay = isVertical ? 500 : 100;
                            setTimeout(function() {
                                self.initAnimation(element, scrollContainer, mainBlock, {
                                    speed, direction, pauseOnHover, gap, isVertical, useAutoHeight
                                });
                            }, initDelay);
                        });
                    });
                };

                if (isMobileMarquee) {
                    requestAnimationFrame(function() { requestAnimationFrame(doFinish); });
                } else {
                    Promise.all([
                        waitForImagesRender(repeatBlock1),
                        waitForImagesRender(repeatBlock2),
                        forceFullRender()
                    ]).then(doFinish);
                }
            }).catch(function() {
                const repeatBlock1 = mainBlock.cloneNode(true);
                const repeatBlock2 = mainBlock.cloneNode(true);

                scrollContainer.appendChild(mainBlock);
                scrollContainer.appendChild(repeatBlock1);
                scrollContainer.appendChild(repeatBlock2);
                mainContainer.appendChild(scrollContainer);

                element.innerHTML = '';
                element.appendChild(mainContainer);
                element.setAttribute('data-bb-marquee-processed', 'true');

                if (hasDropdowns) {
                    self._enableMarqueeDropdowns(mainBlock);
                    self._enableMarqueeDropdowns(repeatBlock1);
                    self._enableMarqueeDropdowns(repeatBlock2);
                }
                const initDelay = isVertical ? 500 : 300;
                setTimeout(function() {
                    self.initAnimation(element, scrollContainer, mainBlock, {
                        speed, direction, pauseOnHover, gap, isVertical, useAutoHeight
                    });
                }, initDelay);
            });
        });

        bbContents.utils.log('Module Marquee initialisé:', elements.length, 'éléments');
    },

    initAnimation(element, scrollContainer, mainBlock, options) {
        const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight } = options;
        const contentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;

        if (contentSize === 0) {
            // Bounded retry: a permanently-collapsed element (e.g. hidden tab)
            // must not poll forever. ~10s cap (50 * 200ms).
            element._marqueeInitRetry = (element._marqueeInitRetry || 0) + 1;
            if (element._marqueeInitRetry <= 50 && element.isConnected) {
                setTimeout(() => this.initAnimation(element, scrollContainer, mainBlock, options), 200);
            }
            return;
        }
        const minSize = isVertical ? 50 : 100;
        if (contentSize > 0 && contentSize < minSize && !element._marqueeSizeRetry) {
            element._marqueeSizeRetry = true;
            setTimeout(() => this.initAnimation(element, scrollContainer, mainBlock, options), 100);
            return;
        }

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const gapSize = parseInt(gap);
        const step = (parseFloat(speed) * (isVertical ? 1.5 : 0.8)) / 60;

        if (isSafari) {
            this.initSafariAnimation(element, scrollContainer, mainBlock, {
                speed, direction, gap, isVertical, useAutoHeight, contentSize, gapSize
            });
        } else {
            const hasCopies = scrollContainer.children.length >= 3;
            if (!hasCopies) {
                const repeatBlock1 = mainBlock.cloneNode(true);
                const repeatBlock2 = mainBlock.cloneNode(true);
                const preloadImagesInBlockSync = function(block) {
                    block.querySelectorAll('img').forEach(function(img) {
                        if (img.dataset.src && !img.src) img.src = img.dataset.src;
                        if (img.src) {
                            const preloadImg = new Image();
                            preloadImg.src = img.src;
                            if (!img.complete) img.src = img.src;
                        }
                    });
                };
                preloadImagesInBlockSync(repeatBlock1);
                preloadImagesInBlockSync(repeatBlock2);
                scrollContainer.appendChild(repeatBlock1);
                scrollContainer.appendChild(repeatBlock2);
            }
            this.initStandardAnimation(element, scrollContainer, mainBlock, {
                speed, direction, pauseOnHover, gap, isVertical, useAutoHeight, contentSize, gapSize, step
            });
        }
    },

    initSafariAnimation(element, scrollContainer, mainBlock, options) {
        const { speed, direction, gap, isVertical, useAutoHeight, contentSize, gapSize } = options;

        const images = mainBlock.querySelectorAll('img');
        let imagesLoaded = 0;
        const totalImages = images.length;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod/.test(navigator.userAgent);

        images.forEach(function(img) {
            if (img.dataset.src && !img.src) { img.src = img.dataset.src; img.loading = 'eager'; }

            const isSVG = img.src && (img.src.toLowerCase().endsWith('.svg') || img.src.includes('data:image/svg+xml'));
            const originalObjectFit = img.style.objectFit || getComputedStyle(img).objectFit;
            const originalObjectPosition = img.style.objectPosition || getComputedStyle(img).objectPosition;
            const originalWidth = img.style.width;
            const originalHeight = img.style.height;

            img.onload = function() {
                if (isSVG && isSafari) {
                    img.style.objectFit = 'contain';
                    img.style.objectPosition = 'center';
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.boxSizing = 'border-box';
                    img.style.imageRendering = 'auto';
                    img.style.webkitBackfaceVisibility = 'hidden';
                    img.style.backfaceVisibility = 'hidden';
                    img.style.webkitTransform = 'translateZ(0)';
                    img.style.transform = 'translateZ(0)';
                    const parent = img.parentElement;
                    if (parent) {
                        const parentStyles = getComputedStyle(parent);
                        const hasParentWidth = parentStyles.width && parentStyles.width !== 'auto' && parentStyles.width !== '0px';
                        const hasParentHeight = parentStyles.height && parentStyles.height !== 'auto' && parentStyles.height !== '0px';
                        parent.style.display = 'flex';
                        parent.style.alignItems = 'center';
                        parent.style.justifyContent = 'center';
                        parent.style.overflow = 'hidden';
                        parent.style.boxSizing = 'border-box';
                        if (!hasParentWidth && !parent.style.width) parent.style.width = '100%';
                        if (!hasParentHeight && !parent.style.height) parent.style.height = '100%';
                    }
                } else if (isSVG && isMobile) {
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
                    if (originalObjectFit && originalObjectFit !== 'none') img.style.objectFit = originalObjectFit;
                    if (originalObjectPosition && originalObjectPosition !== 'initial') img.style.objectPosition = originalObjectPosition;
                    if (!originalWidth || originalWidth === '') img.style.width = 'auto';
                    if (!originalHeight || originalHeight === '') img.style.height = 'auto';
                    img.style.webkitBackfaceVisibility = 'hidden';
                    img.style.backfaceVisibility = 'hidden';
                    img.style.webkitTransform = 'translateZ(0)';
                    img.style.transform = 'translateZ(0)';
                    const parent = img.parentElement;
                    if (parent) { parent.style.overflow = 'hidden'; parent.style.boxSizing = 'border-box'; }
                } else {
                    if (originalObjectFit && originalObjectFit !== 'none') img.style.objectFit = originalObjectFit;
                    if (originalObjectPosition && originalObjectPosition !== 'initial') img.style.objectPosition = originalObjectPosition;
                    if (!originalWidth || originalWidth === '') img.style.width = 'auto';
                    if (!originalHeight || originalHeight === '') img.style.height = 'auto';
                }
                imagesLoaded++;
            };
            img.onerror = function() { imagesLoaded++; };
            if (img.complete && img.naturalWidth > 0) imagesLoaded++;
        });

        let maxWaitTime = isMobile ? 1500 : 3000;
        if (isSafari) maxWaitTime = Math.min(maxWaitTime, 600);
        let waitTimeout = 0;

        const startSafariAnimation = () => {
            if (waitTimeout >= maxWaitTime && imagesLoaded < totalImages) {
                images.forEach(function(img) {
                    if (img.dataset.src && !img.src) { img.src = img.dataset.src; img.loading = 'eager'; }
                });
            }

            const newContentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;
            let finalContentSize = newContentSize > contentSize ? newContentSize : contentSize;

            if (finalContentSize < 200) {
                const parentElement = element.parentElement;
                if (parentElement) {
                    finalContentSize = isVertical ? parentElement.offsetHeight : parentElement.offsetWidth;
                }
                if (finalContentSize < 200) {
                    finalContentSize = isVertical ? (isMobile ? 600 : 400) : (isMobile ? 1000 : 800);
                }
            }

            const totalSize = finalContentSize * 3 + gapSize * 2;
            const step = (parseFloat(speed) * (isVertical ? 1.5 : 0.8)) / 60;
            let isPaused = false;

            if (isSafari && isMobile) {
                scrollContainer.style.willChange = 'transform';
                scrollContainer.style.webkitBackfaceVisibility = 'hidden';
                scrollContainer.style.backfaceVisibility = 'hidden';
            }

            if (isVertical && !useAutoHeight) {
                scrollContainer.style.height = totalSize + 'px';
            } else if (!isVertical) {
                scrollContainer.style.width = totalSize + 'px';
            }

            let currentPosition = -(finalContentSize + gapSize);
            const initialTransform = isVertical
                ? `translate3d(0, ${currentPosition}px, 0)`
                : `translate3d(${currentPosition}px, 0, 0)`;
            scrollContainer.style.transform = initialTransform;

            if (isSafari && isMobile) void scrollContainer.offsetHeight;

            let lastTime = performance.now();
            const animate = (currentTime) => {
                // Stop the rAF loop once the marquee is removed from the DOM
                // (Webflow re-renders, CMS updates) — otherwise it runs forever
                // holding references to the detached element.
                if (!element.isConnected) return;
                const dropdownOpen = element.getAttribute('data-bb-marquee-dropdown-open') === '1';
                if (!isPaused && !dropdownOpen) {
                    const deltaTime = isSafari && isMobile ? (currentTime - lastTime) / 16.67 : 1;
                    lastTime = currentTime;

                    if (direction === (isVertical ? 'bottom' : 'right')) {
                        currentPosition += step * deltaTime;
                        const resetThreshold = -(0.2 * (finalContentSize + gapSize));
                        if (currentPosition >= resetThreshold) {
                            currentPosition = currentPosition - (finalContentSize + gapSize);
                        }
                    } else {
                        currentPosition -= step * deltaTime;
                        const resetThreshold = -(1.8 * (finalContentSize + gapSize));
                        if (currentPosition <= resetThreshold) {
                            currentPosition = currentPosition + (finalContentSize + gapSize);
                        }
                    }

                    currentPosition = Math.round(currentPosition * 100) / 100;
                    const transform = isVertical
                        ? `translate3d(0, ${currentPosition}px, 0)`
                        : `translate3d(${currentPosition}px, 0, 0)`;
                    scrollContainer.style.transform = transform;
                }
                requestAnimationFrame(animate);
            };

            if (isSafari && isMobile) {
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        lastTime = performance.now();
                        animate(lastTime);
                    });
                });
            } else {
                setTimeout(function() { lastTime = performance.now(); animate(lastTime); }, 50);
            }

            if (element.getAttribute('bb-marquee-pause') === 'true') {
                element.addEventListener('mouseenter', function() { isPaused = true; });
                element.addEventListener('mouseleave', function() { isPaused = false; });
            }
        };

        const waitForImages = () => {
            waitTimeout += 100;
            if (totalImages === 0) {
                const renderDelay = isMobile ? 500 : 100;
                setTimeout(startSafariAnimation, renderDelay);
            } else if (imagesLoaded >= totalImages) {
                const renderDelay = isSafari && isMobile ? 80 : (isMobile ? 500 : 200);
                setTimeout(startSafariAnimation, renderDelay);
            } else if (waitTimeout >= maxWaitTime) {
                const renderDelay = isSafari && isMobile ? 80 : (isMobile ? 500 : 200);
                setTimeout(startSafariAnimation, renderDelay);
            } else {
                setTimeout(waitForImages, 100);
            }
        };

        if (imagesLoaded >= totalImages) {
            const renderDelay = isSafari && isMobile ? 80 : (isMobile ? 500 : 200);
            setTimeout(startSafariAnimation, renderDelay);
        } else {
            waitForImages();
        }
    },

    initStandardAnimation(element, scrollContainer, mainBlock, options) {
        const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight, contentSize, gapSize, step } = options;

        const totalSize = contentSize * 3 + gapSize * 2;
        let isPaused = false;
        let currentPosition = -(contentSize + gapSize);

        if (isVertical && !useAutoHeight) {
            scrollContainer.style.height = totalSize + 'px';
        } else if (!isVertical) {
            scrollContainer.style.width = totalSize + 'px';
        }

        let lastTime = performance.now();
        const animate = (currentTime) => {
            // Stop the rAF loop once the marquee is removed from the DOM
            // (Webflow re-renders, CMS updates) — otherwise it runs forever
            // holding references to the detached element.
            if (!element.isConnected) return;
            const dropdownOpen = element.getAttribute('data-bb-marquee-dropdown-open') === '1';
            if (!isPaused && !dropdownOpen) {
                const deltaTime = (currentTime - lastTime) / 16.67;
                lastTime = currentTime;
                const clampedDelta = Math.min(deltaTime, 2.0);

                if (direction === (isVertical ? 'bottom' : 'right')) {
                    currentPosition += step * clampedDelta;
                    const resetThreshold = -(0.2 * (contentSize + gapSize));
                    if (currentPosition >= resetThreshold) {
                        currentPosition = currentPosition - (contentSize + gapSize);
                    }
                } else {
                    currentPosition -= step * clampedDelta;
                    const resetThreshold = -(1.8 * (contentSize + gapSize));
                    if (currentPosition <= resetThreshold) {
                        currentPosition = currentPosition + (contentSize + gapSize);
                    }
                }

                currentPosition = Math.round(currentPosition * 100) / 100;
                const transform = isVertical
                    ? `translate3d(0, ${currentPosition}px, 0)`
                    : `translate3d(${currentPosition}px, 0, 0)`;
                scrollContainer.style.transform = transform;
            }
            requestAnimationFrame(animate);
        };

        lastTime = performance.now();
        requestAnimationFrame(animate);

        if (pauseOnHover === 'true') {
            element.addEventListener('mouseenter', function() { isPaused = true; });
            element.addEventListener('mouseleave', function() { isPaused = false; });
        }
    }
};

export default marquee;
