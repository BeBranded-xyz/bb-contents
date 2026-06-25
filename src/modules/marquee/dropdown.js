/**
 * Marquee — Webflow dropdown support inside a moving marquee.
 * Clones the open dropdown list into a fixed-position portal on <body> so it
 * isn't clipped by the marquee's overflow, and pauses the marquee while open.
 */

export function hasDropdownInBlock(block) {
    if (!block || !block.querySelector) return false;
    return block.querySelector('.w-dropdown') !== null ||
        block.querySelector('[class*="dropdown"]') !== null;
}

export function enableMarqueeDropdowns(block) {
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
}
