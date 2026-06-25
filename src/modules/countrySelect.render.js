/**
 * Country Select — list rendering and event wiring.
 * All functions take a `ctx` object holding the shared per-instance state
 * (element, language, styles, sortedCountries, DOM refs, currentSelectedCountry).
 */

export function renderCountries(ctx, countries) {
    const { list, language, styles } = ctx;
    const { selectFontSize, selectFontFamily } = styles;
    const currentSelectedCountry = ctx.currentSelectedCountry;

    if (countries.length === 0) {
        const noResult = bbContents.config.i18n.noCountryFound[language] ||
                       (language === 'en' ? 'No country found' : 'Aucun pays trouvé');
        list.innerHTML = '<div style="padding: 16px; text-align: center; color: #9ca3af; font-size: inherit; font-family: inherit;">' + bbContents.utils.sanitize(noResult) + '</div>';
        return;
    }

    list.innerHTML = countries.map(function(country) {
        if (!bbContents.utils.isValidCountryCode(country.alpha2)) return '';
        const isSelected = currentSelectedCountry && currentSelectedCountry.alpha2 === country.alpha2;
        let itemStyle = 'display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; transition: background-color 0.15s; min-height: 36px; box-sizing: border-box;';
        if (selectFontSize) itemStyle += ' font-size: ' + bbContents.utils.escapeCss(selectFontSize) + ';';
        if (selectFontFamily) itemStyle += ' font-family: ' + bbContents.utils.escapeCss(selectFontFamily) + ';';
        if (isSelected) itemStyle += ' background-color: #f3f4f6;';
        return '<div class="bb-country-item" data-country="' + country.alpha2.toLowerCase() + '" role="option" aria-selected="' + (isSelected ? 'true' : 'false') + '" style="' + itemStyle + '"><img src="https://hatscripts.github.io/circle-flags/flags/' + country.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(country.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"><span style="line-height: 1.2;">' + bbContents.utils.sanitize(country.name[language]) + '</span></div>';
    }).join('');

    list.querySelectorAll('.bb-country-item').forEach(function(item) {
        item.addEventListener('mouseenter', function() {
            if (this.getAttribute('aria-selected') !== 'true') this.style.backgroundColor = '#f3f4f6';
        });
        item.addEventListener('mouseleave', function() {
            if (this.getAttribute('aria-selected') !== 'true') this.style.backgroundColor = '';
        });
    });
}

function bindTrigger(ctx) {
    const { trigger, popover, chevron, searchInput, sortedCountries } = ctx;
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = popover.style.display === 'block';
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
            renderCountries(ctx, sortedCountries);
        }
    });
}

function bindOutsideClick(ctx) {
    const { wrapper, popover, trigger, chevron } = ctx;
    document.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target)) {
            popover.style.display = 'none';
            trigger.setAttribute('aria-expanded', 'false');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    });
}

function bindSearch(ctx) {
    const { searchInput, popover, trigger, chevron, sortedCountries, language } = ctx;
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        const filtered = sortedCountries.filter(function(c) {
            return c.name[language].toLowerCase().indexOf(query) !== -1 ||
                   c.alpha2.toLowerCase().indexOf(query) !== -1 ||
                   c.alpha3.toLowerCase().indexOf(query) !== -1;
        });
        renderCountries(ctx, filtered);
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            popover.style.display = 'none';
            trigger.setAttribute('aria-expanded', 'false');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            trigger.focus();
        }
    });
}

function bindList(ctx) {
    const { self, element, language, sortedCountries, popover, trigger, chevron, searchInput, list, flagSpan, nameSpan } = ctx;
    list.addEventListener('click', function(e) {
        const item = e.target.closest('.bb-country-item');
        if (!item) return;
        const countryCode = item.dataset.country;
        if (!bbContents.utils.isValidCountryCode(countryCode)) return;
        const country = self.countries.find(function(c) {
            return c.alpha2.toLowerCase() === countryCode.toLowerCase();
        });
        if (!country) return;

        ctx.currentSelectedCountry = country;

        if (bbContents.utils.isValidCountryCode(country.alpha2)) {
            flagSpan.innerHTML = '<img src="https://hatscripts.github.io/circle-flags/flags/' + country.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(country.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">';
            nameSpan.textContent = country.name[language];
        }

        // Sync with the native Webflow <select> WITHOUT clobbering its internal
        // option values: match an existing option by visible label, then by value,
        // and only create a new option when nothing matches. Preserves the value
        // Webflow stores/submits for the country.
        const countryName = country.name[language];
        let nativeOption = Array.from(element.options).find(function(opt) {
            return (opt.textContent || '').trim().toLowerCase() === countryName.toLowerCase();
        });
        if (!nativeOption) {
            nativeOption = Array.from(element.options).find(function(opt) {
                return (opt.value || '').trim().toLowerCase() === countryName.toLowerCase();
            });
        }
        if (!nativeOption) {
            const newOption = document.createElement('option');
            newOption.value = countryName;
            newOption.textContent = countryName;
            if (element.options.length > 0) {
                Array.from(element.options).forEach(function(opt) { if (!opt.value || opt.value === '') opt.remove(); });
            }
            element.appendChild(newOption);
            nativeOption = newOption;
        }
        nativeOption.selected = true;
        element.value = nativeOption.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));

        popover.style.display = 'none';
        trigger.setAttribute('aria-expanded', 'false');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        searchInput.value = '';
        renderCountries(ctx, sortedCountries);
        setTimeout(function() { renderCountries(ctx, sortedCountries); }, 0);
    });
}

export function bindEvents(ctx) {
    bindTrigger(ctx);
    bindOutsideClick(ctx);
    bindSearch(ctx);
    bindList(ctx);
}
