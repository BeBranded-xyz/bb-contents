/**
 * Marquee — DOM scaffolding: build the container/scroll/block elements with
 * their inline styles, and (horizontal only) freeze item widths so wrapping
 * text doesn't reflow once the blocks are duplicated.
 */
import { hasDropdownInBlock } from './dropdown.js';

export function buildContainers(element, opts) {
    const { originalHTML, isVertical, useAutoHeight, height, minHeight, gap } = opts;

    const mainContainer = document.createElement('div');

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
    const hasDropdowns = hasDropdownInBlock(mainBlock);
    if (hasDropdowns) {
        mainContainer.style.overflow = 'visible';
        scrollContainer.style.overflow = 'visible';
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

    return { mainContainer, scrollContainer, mainBlock, hasDropdowns };
}

export function applyItemWidths(mainBlock) {
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
}
