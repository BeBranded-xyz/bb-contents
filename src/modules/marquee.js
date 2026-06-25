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
import { enableMarqueeDropdowns } from './marquee/dropdown.js';
import { buildContainers, applyItemWidths } from './marquee/dom.js';
import { preloadAllImagesFirst, forceImagesDisplay, waitForImagesRender, forceFullRender } from './marquee/images.js';
import { initAnimation } from './marquee/animate.js';

const marquee = {
    init(root) {
        const scope = root || document;
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('marquee'));
        const self = this;

        elements.forEach(function(element) {
            if (element.hasAttribute('data-bb-marquee-processed')) return;
            element.setAttribute('data-bb-marquee-processed', 'true');
            self._setup(element);
        });

        bbContents.utils.log('Module Marquee initialisé:', elements.length, 'éléments');
    },

    _setup(element) {
        const self = this;
        const speed = bbContents._getAttr(element, 'bb-marquee-speed') || '100';
        const direction = bbContents._getAttr(element, 'bb-marquee-direction') || 'left';
        const pauseOnHover = bbContents._getAttr(element, 'bb-marquee-pause') || 'true';
        const gap = bbContents._getAttr(element, 'bb-marquee-gap') || '50';
        const orientation = bbContents._getAttr(element, 'bb-marquee-orientation') || 'horizontal';
        const height = bbContents._getAttr(element, 'bb-marquee-height') || '300';
        const minHeight = bbContents._getAttr(element, 'bb-marquee-min-height');
        const isMobileMarquee = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        const isVertical = orientation === 'vertical';
        const useAutoHeight = isVertical && height === 'auto';
        const originalHTML = element.innerHTML;

        const { mainContainer, scrollContainer, mainBlock, hasDropdowns } =
            buildContainers(element, { originalHTML, isVertical, useAutoHeight, height, minHeight, gap });

        const ctx = {
            element, mainContainer, scrollContainer, mainBlock, hasDropdowns,
            isVertical, useAutoHeight, isMobileMarquee,
            speed, direction, pauseOnHover, gap
        };

        if (!isVertical) {
            setTimeout(function() { applyItemWidths(mainBlock); }, 0);
        }

        preloadAllImagesFirst(mainBlock, isMobileMarquee)
            .then(function() { self._assemble(ctx); })
            .catch(function() { self._fallback(ctx); });
    },

    _assemble(ctx) {
        const self = this;
        const { mainBlock, isMobileMarquee } = ctx;
        const repeatBlock1 = mainBlock.cloneNode(true);
        const repeatBlock2 = mainBlock.cloneNode(true);

        forceImagesDisplay(repeatBlock1);
        forceImagesDisplay(repeatBlock2);

        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px; visibility: hidden;';
        tempContainer.appendChild(repeatBlock1);
        tempContainer.appendChild(repeatBlock2);
        if (!isMobileMarquee) document.body.appendChild(tempContainer);

        if (isMobileMarquee) {
            requestAnimationFrame(function() {
                requestAnimationFrame(function() { self._finish(ctx, repeatBlock1, repeatBlock2, tempContainer); });
            });
        } else {
            Promise.all([
                waitForImagesRender(repeatBlock1, isMobileMarquee),
                waitForImagesRender(repeatBlock2, isMobileMarquee),
                forceFullRender(repeatBlock1, repeatBlock2, tempContainer)
            ]).then(function() { self._finish(ctx, repeatBlock1, repeatBlock2, tempContainer); });
        }
    },

    _finish(ctx, repeatBlock1, repeatBlock2, tempContainer) {
        const self = this;
        const { element, mainContainer, scrollContainer, mainBlock, isVertical } = ctx;

        if (tempContainer && tempContainer.parentNode === document.body) {
            document.body.removeChild(tempContainer);
        }
        scrollContainer.appendChild(mainBlock);
        scrollContainer.appendChild(repeatBlock1);
        scrollContainer.appendChild(repeatBlock2);
        mainContainer.appendChild(scrollContainer);

        self._finalizeLayout(ctx, repeatBlock1, repeatBlock2);

        element.innerHTML = '';
        element.appendChild(mainContainer);
        // attribute already set before async chain; ensure it persists
        element.setAttribute('data-bb-marquee-processed', 'true');

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                const initDelay = isVertical ? 500 : 100;
                setTimeout(function() {
                    initAnimation(element, scrollContainer, mainBlock, {
                        speed: ctx.speed, direction: ctx.direction, pauseOnHover: ctx.pauseOnHover,
                        gap: ctx.gap, isVertical: ctx.isVertical, useAutoHeight: ctx.useAutoHeight
                    });
                }, initDelay);
            });
        });
    },

    _finalizeLayout(ctx, repeatBlock1, repeatBlock2) {
        const { mainContainer, scrollContainer, mainBlock, isVertical, hasDropdowns } = ctx;
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
                        enableMarqueeDropdowns(mainBlock);
                        enableMarqueeDropdowns(repeatBlock1);
                        enableMarqueeDropdowns(repeatBlock2);
                    }
                });
            });
        } else {
            if (hasDropdowns) {
                enableMarqueeDropdowns(mainBlock);
                enableMarqueeDropdowns(repeatBlock1);
                enableMarqueeDropdowns(repeatBlock2);
            }
        }
    },

    _fallback(ctx) {
        const { element, mainContainer, scrollContainer, mainBlock, isVertical, hasDropdowns } = ctx;
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
            enableMarqueeDropdowns(mainBlock);
            enableMarqueeDropdowns(repeatBlock1);
            enableMarqueeDropdowns(repeatBlock2);
        }
        const initDelay = isVertical ? 500 : 300;
        setTimeout(function() {
            initAnimation(element, scrollContainer, mainBlock, {
                speed: ctx.speed, direction: ctx.direction, pauseOnHover: ctx.pauseOnHover,
                gap: ctx.gap, isVertical: ctx.isVertical, useAutoHeight: ctx.useAutoHeight
            });
        }, initDelay);
    }
};

export default marquee;
