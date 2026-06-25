/**
 * Marquee — animation loops. initAnimation picks the Safari-specific path or the
 * standard rAF path. Both loops self-terminate when the element leaves the DOM.
 */
import { initSafariAnimation } from './safari-animate.js';

function preloadImagesInBlockSync(block) {
    block.querySelectorAll('img').forEach(function(img) {
        if (img.dataset.src && !img.src) img.src = img.dataset.src;
        if (img.src) {
            const preloadImg = new Image();
            preloadImg.src = img.src;
            if (!img.complete) img.src = img.src;
        }
    });
}

export function initAnimation(element, scrollContainer, mainBlock, options) {
    const { speed, direction, pauseOnHover, gap, isVertical, useAutoHeight } = options;
    const contentSize = isVertical ? mainBlock.offsetHeight : mainBlock.offsetWidth;

    if (contentSize === 0) {
        // Bounded retry: a permanently-collapsed element (e.g. hidden tab)
        // must not poll forever. ~10s cap (50 * 200ms).
        element._marqueeInitRetry = (element._marqueeInitRetry || 0) + 1;
        if (element._marqueeInitRetry <= 50 && element.isConnected) {
            setTimeout(() => initAnimation(element, scrollContainer, mainBlock, options), 200);
        }
        return;
    }
    const minSize = isVertical ? 50 : 100;
    if (contentSize > 0 && contentSize < minSize && !element._marqueeSizeRetry) {
        element._marqueeSizeRetry = true;
        setTimeout(() => initAnimation(element, scrollContainer, mainBlock, options), 100);
        return;
    }

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const gapSize = parseInt(gap);
    const step = (parseFloat(speed) * (isVertical ? 1.5 : 0.8)) / 60;

    if (isSafari) {
        initSafariAnimation(element, scrollContainer, mainBlock, {
            speed, direction, gap, isVertical, useAutoHeight, contentSize, gapSize
        });
    } else {
        const hasCopies = scrollContainer.children.length >= 3;
        if (!hasCopies) {
            const repeatBlock1 = mainBlock.cloneNode(true);
            const repeatBlock2 = mainBlock.cloneNode(true);
            preloadImagesInBlockSync(repeatBlock1);
            preloadImagesInBlockSync(repeatBlock2);
            scrollContainer.appendChild(repeatBlock1);
            scrollContainer.appendChild(repeatBlock2);
        }
        initStandardAnimation(element, scrollContainer, mainBlock, {
            speed, direction, pauseOnHover, gap, isVertical, useAutoHeight, contentSize, gapSize, step
        });
    }
}

export function initStandardAnimation(element, scrollContainer, mainBlock, options) {
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
