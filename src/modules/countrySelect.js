/**
 * Module Country Select
 * Remplace un élément <select> natif par un dropdown pays personnalisé avec drapeaux et recherche.
 *
 * @attr {string} bb-country-select - Active le module sur un élément <select>
 * @attr {string} [bb-country-select-preferred] - Codes pays ISO à afficher en tête de liste (ex: "FR,BE,CH")
 * @attr {string} [bb-country-select-default] - Code ou nom du pays sélectionné par défaut
 */
import countries from './countrySelect.data.js';
import { captureStyles, buildUI } from './countrySelect.ui.js';
import { renderCountries, bindEvents } from './countrySelect.render.js';

export default {
    countries,

    getLanguage(element) {
        let lang = element.getAttribute('lang');
        if (!lang && element.closest) {
            const langElement = element.closest('[lang]');
            if (langElement) lang = langElement.getAttribute('lang');
        }
        if (!lang) lang = document.documentElement.getAttribute('lang');
        if (!lang) lang = 'fr';
        return lang && lang.startsWith('en') ? 'en' : 'fr';
    },

    findCountry(query) {
        if (!query) return null;
        const upperQuery = query.toUpperCase().trim();
        const lowerQuery = query.toLowerCase().trim();
        return this.countries.find(function(c) {
            return c.alpha2 === upperQuery ||
                   c.alpha3 === upperQuery ||
                   c.name.fr.toLowerCase() === lowerQuery ||
                   c.name.en.toLowerCase() === lowerQuery;
        });
    },

    init(root) {
        const scope = root || document;
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('country-select'));
        const self = this;

        elements.forEach(function(element) {
            if (element.hasAttribute('data-bb-country-select-processed')) return;
            if (element.tagName !== 'SELECT') return;
            element.setAttribute('data-bb-country-select-processed', '1');
            self._enhance(element);
        });

        bbContents.utils.log('Module CountrySelect initialisé:', elements.length, 'éléments');
    },

    _enhance(element) {
        const self = this;
        const cfg = self._resolveConfig(element);

        self._applyDefaultOption(element, cfg.defaultCountry, cfg.language);
        const sortedCountries = self._sortCountries(cfg.preferredCountries, cfg.language);
        const styles = captureStyles(element);
        const ui = buildUI(element, styles, cfg);

        const ctx = {
            self, element, language: cfg.language, styles, sortedCountries,
            currentSelectedCountry: cfg.defaultCountry,
            wrapper: ui.wrapper, trigger: ui.trigger, popover: ui.popover,
            searchInput: ui.searchInput, list: ui.list,
            flagSpan: ui.flagSpan, nameSpan: ui.nameSpan, chevron: ui.chevron
        };

        renderCountries(ctx, sortedCountries);

        const parent = element.parentNode;
        parent.insertBefore(ui.wrapper, element);
        ui.wrapper.appendChild(element);
        ui.wrapper.appendChild(ui.trigger);
        ui.wrapper.appendChild(ui.popover);

        bindEvents(ctx);

        ui.wrapper.setAttribute('data-bb-country-select-processed', 'true');
    },

    _resolveConfig(element) {
        const self = this;
        const language = self.getLanguage(element);
        const preferredAttr = bbContents._getAttr(element, 'bb-country-select-preferred');
        const defaultAttr = bbContents._getAttr(element, 'bb-country-select-default');
        const placeholder = bbContents.config.i18n.selectCountry[language] ||
                          (language === 'en' ? 'Select country' : 'Sélectionner un pays');
        const searchPlaceholder = bbContents.config.i18n.searchCountry[language] ||
                                (language === 'en' ? 'Search country...' : 'Rechercher un pays...');

        let preferredCountries = [];
        if (preferredAttr) {
            preferredAttr.split(',').forEach(function(code) {
                const country = self.findCountry(code.trim());
                if (country) preferredCountries.push(country.alpha2);
            });
        }

        let defaultCountry = null;
        if (defaultAttr) {
            defaultCountry = self.findCountry(defaultAttr.trim());
        } else if (element.value) {
            defaultCountry = self.findCountry(element.value);
        }

        return { language, placeholder, searchPlaceholder, preferredCountries, defaultCountry };
    },

    _applyDefaultOption(element, defaultCountry, language) {
        if (!defaultCountry) return;
        const countryName = defaultCountry.name[language];
        const existingOption = Array.from(element.options).find(function(opt) {
            return opt.value === countryName;
        });
        if (!existingOption) {
            const newOption = document.createElement('option');
            newOption.value = countryName;
            newOption.textContent = countryName;
            element.appendChild(newOption);
        }
        element.value = countryName;
    },

    _sortCountries(preferredCountries, language) {
        const self = this;
        const compare = function(a, b) {
            return a.name[language].localeCompare(b.name[language], language === 'fr' ? 'fr' : 'en', {
                sensitivity: 'base', ignorePunctuation: true, numeric: true
            });
        };
        let sortedCountries = self.countries.slice();
        if (preferredCountries.length > 0) {
            const preferred = preferredCountries
                .map(function(code) { return self.countries.find(function(c) { return c.alpha2 === code; }); })
                .filter(function(c) { return c !== undefined; });
            const others = sortedCountries.filter(function(c) {
                return preferredCountries.indexOf(c.alpha2) === -1;
            }).sort(compare);
            return preferred.concat(others);
        }
        return sortedCountries.sort(compare);
    }
};
