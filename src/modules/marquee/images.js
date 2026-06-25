/**
 * Marquee — image preloading / render-settling helpers.
 * Marquee width math needs images to have real dimensions before cloning and
 * measuring, so these wait (with hard caps) for images to load and lay out.
 */

export function preloadAllImagesFirst(block, isMobileMarquee) {
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
}

export function forceImagesDisplay(block) {
    block.querySelectorAll('img').forEach(function(img) {
        if (img.dataset.src && !img.src) img.src = img.dataset.src;
        if (img.src) {
            img.src = img.src;
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            void img.offsetHeight;
        }
    });
}

export function waitForImagesRender(block, isMobileMarquee) {
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
}

export function forceFullRender(repeatBlock1, repeatBlock2, tempContainer) {
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
}
