/**
 * Marquee — Safari/iOS animation path. Safari needs extra per-image layout
 * fixes (especially for SVGs) and a delta-time loop, so it has its own path.
 * The rAF loop self-terminates when the element leaves the DOM.
 */

// Per-image layout normalization applied on load (extracted from the loop).
function applyImageLayout(img, isSVG, isSafari, isMobile, originals) {
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
        if (originals.objectFit && originals.objectFit !== 'none') img.style.objectFit = originals.objectFit;
        if (originals.objectPosition && originals.objectPosition !== 'initial') img.style.objectPosition = originals.objectPosition;
        if (!originals.width || originals.width === '') img.style.width = 'auto';
        if (!originals.height || originals.height === '') img.style.height = 'auto';
        img.style.webkitBackfaceVisibility = 'hidden';
        img.style.backfaceVisibility = 'hidden';
        img.style.webkitTransform = 'translateZ(0)';
        img.style.transform = 'translateZ(0)';
        const parent = img.parentElement;
        if (parent) { parent.style.overflow = 'hidden'; parent.style.boxSizing = 'border-box'; }
    } else {
        if (originals.objectFit && originals.objectFit !== 'none') img.style.objectFit = originals.objectFit;
        if (originals.objectPosition && originals.objectPosition !== 'initial') img.style.objectPosition = originals.objectPosition;
        if (!originals.width || originals.width === '') img.style.width = 'auto';
        if (!originals.height || originals.height === '') img.style.height = 'auto';
    }
}

export function initSafariAnimation(element, scrollContainer, mainBlock, options) {
    const { speed, direction, gap, isVertical, useAutoHeight, contentSize, gapSize } = options;

    const images = mainBlock.querySelectorAll('img');
    let imagesLoaded = 0;
    const totalImages = images.length;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /iPhone|iPad|iPod/.test(navigator.userAgent);

    images.forEach(function(img) {
        if (img.dataset.src && !img.src) { img.src = img.dataset.src; img.loading = 'eager'; }

        const isSVG = img.src && (img.src.toLowerCase().endsWith('.svg') || img.src.includes('data:image/svg+xml'));
        const originals = {
            objectFit: img.style.objectFit || getComputedStyle(img).objectFit,
            objectPosition: img.style.objectPosition || getComputedStyle(img).objectPosition,
            width: img.style.width,
            height: img.style.height
        };

        img.onload = function() {
            applyImageLayout(img, isSVG, isSafari, isMobile, originals);
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
            // Stop the rAF loop once the marquee is removed from the DOM.
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
}
