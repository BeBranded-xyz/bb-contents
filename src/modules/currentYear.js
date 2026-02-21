/**
 * Module Current Year
 * Insère l'année courante dans un élément texte, avec options de format, préfixe et suffixe.
 *
 * @attr {string} bb-current-year - Active le module sur l'élément
 * @attr {string} [bb-current-year-format] - Format avec placeholder {year}, ex: "© {year}"
 * @attr {string} [bb-current-year-prefix] - Texte avant l'année
 * @attr {string} [bb-current-year-suffix] - Texte après l'année
 */
export default {
    init(scope) {
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('current-year'));
        const year = String(new Date().getFullYear());

        elements.forEach(function(element) {
            if (element.hasAttribute('data-bb-current-year-processed')) return;
            element.setAttribute('data-bb-current-year-processed', '1');

            const customFormat = bbContents._getAttr(element, 'bb-current-year-format');
            const prefix = bbContents._getAttr(element, 'bb-current-year-prefix') || '';
            const suffix = bbContents._getAttr(element, 'bb-current-year-suffix') || '';

            if (customFormat && customFormat.includes('{year}')) {
                element.textContent = customFormat.replace('{year}', year);
            } else if (prefix || suffix) {
                element.textContent = prefix + year + suffix;
            } else {
                element.textContent = year;
            }
        });

        bbContents.utils.log('Module CurrentYear initialisé:', elements.length, 'éléments');
    }
};
