/**
 * Country Select — DOM & style construction helpers.
 * Pure builders: capture the original <select>'s computed style and build the
 * custom trigger/popover UI. No event wiring (see countrySelect.render.js).
 */

export function captureStyles(element) {
    const selectComputedStyle = window.getComputedStyle(element);
    const selectWidth = element.offsetWidth || parseFloat(selectComputedStyle.width) || 'auto';
    const selectHeight = element.offsetHeight || parseFloat(selectComputedStyle.height) || 'auto';
    const selectMinWidth = selectComputedStyle.minWidth !== 'none' ? selectComputedStyle.minWidth : null;
    const selectMaxWidth = selectComputedStyle.maxWidth !== 'none' ? selectComputedStyle.maxWidth : null;
    const selectMinHeight = selectComputedStyle.minHeight !== 'none' ? selectComputedStyle.minHeight : null;
    const selectMaxHeight = selectComputedStyle.maxHeight !== 'none' ? selectComputedStyle.maxHeight : null;

    const selectBgColor = selectComputedStyle.backgroundColor;
    let selectBorder = selectComputedStyle.border;
    if (!selectBorder || selectBorder === 'none' || selectBorder === '0px none rgb(0, 0, 0)') {
        if (selectComputedStyle.borderWidth && selectComputedStyle.borderStyle && selectComputedStyle.borderColor) {
            selectBorder = selectComputedStyle.borderWidth + ' ' + selectComputedStyle.borderStyle + ' ' + selectComputedStyle.borderColor;
        } else {
            selectBorder = null;
        }
    }
    const selectBorderColor = selectComputedStyle.borderColor;
    const selectBorderRadius = selectComputedStyle.borderRadius;
    const selectColor = selectComputedStyle.color;
    const selectFontSize = selectComputedStyle.fontSize;
    const selectFontFamily = selectComputedStyle.fontFamily;
    let selectPadding = selectComputedStyle.padding;
    if (!selectPadding || selectPadding === '0px') {
        if (selectComputedStyle.paddingTop && selectComputedStyle.paddingRight && selectComputedStyle.paddingBottom && selectComputedStyle.paddingLeft) {
            selectPadding = selectComputedStyle.paddingTop + ' ' + selectComputedStyle.paddingRight + ' ' + selectComputedStyle.paddingBottom + ' ' + selectComputedStyle.paddingLeft;
        } else {
            selectPadding = null;
        }
    }

    return {
        selectWidth, selectHeight, selectMinWidth, selectMaxWidth, selectMinHeight, selectMaxHeight,
        selectBgColor, selectBorder, selectBorderColor, selectBorderRadius, selectColor,
        selectFontSize, selectFontFamily, selectPadding
    };
}

function buildWrapper(element, styles) {
    const { selectWidth, selectHeight, selectMinWidth, selectMaxWidth, selectMinHeight, selectMaxHeight } = styles;

    const wrapper = document.createElement('div');
    wrapper.className = 'bb-country-select-wrapper';
    let wrapperStyle = 'position: relative;';
    if (selectWidth !== 'auto' && selectWidth > 0) wrapperStyle += ' width: ' + selectWidth + 'px;';
    if (selectHeight !== 'auto' && selectHeight > 0) wrapperStyle += ' min-height: ' + selectHeight + 'px;';
    if (selectMinWidth) wrapperStyle += ' min-width: ' + selectMinWidth + ';';
    if (selectMaxWidth) wrapperStyle += ' max-width: ' + selectMaxWidth + ';';
    if (selectMinHeight) wrapperStyle += ' min-height: ' + selectMinHeight + ';';
    if (selectMaxHeight) wrapperStyle += ' max-height: ' + selectMaxHeight + ';';
    wrapper.style.cssText = wrapperStyle;

    const selectStyle = element.style.cssText || '';
    element.style.cssText = selectStyle + '; position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; overflow: hidden;';
    element.setAttribute('aria-hidden', 'true');

    return wrapper;
}

function buildTrigger(styles, cfg) {
    const {
        selectWidth, selectHeight, selectMinWidth, selectMaxWidth, selectMinHeight, selectMaxHeight,
        selectBgColor, selectBorder, selectBorderColor, selectBorderRadius, selectColor,
        selectFontSize, selectFontFamily, selectPadding
    } = styles;
    const { language, placeholder, defaultCountry } = cfg;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'bb-country-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const selectedCountry = defaultCountry;
    const selectedName = selectedCountry ? selectedCountry.name[language] : placeholder;
    const selectedFlag = selectedCountry && bbContents.utils.isValidCountryCode(selectedCountry.alpha2)
        ? '<img src="https://hatscripts.github.io/circle-flags/flags/' + selectedCountry.alpha2.toLowerCase() + '.svg" alt="' + bbContents.utils.sanitize(selectedCountry.name[language]) + '" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">'
        : '';

    trigger.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;"><span class="bb-country-flag" style="flex-shrink: 0;">' + selectedFlag + '</span><span class="bb-country-name" style="flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + bbContents.utils.sanitize(selectedName) + '</span></div><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink: 0; transition: transform 0.2s;"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    let triggerStyle = 'display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-sizing: border-box; transition: border-color 0.2s;';
    if (selectBgColor && selectBgColor !== 'rgba(0, 0, 0, 0)' && selectBgColor !== 'transparent') triggerStyle += ' background-color: ' + selectBgColor + ';';
    if (selectBorder && selectBorder !== 'none' && selectBorder !== '0px none rgb(0, 0, 0)') triggerStyle += ' border: ' + selectBorder + ';';
    else if (selectBorderColor && selectBorderColor !== 'rgba(0, 0, 0, 0)') triggerStyle += ' border-color: ' + selectBorderColor + ';';
    if (selectBorderRadius && selectBorderRadius !== '0px') triggerStyle += ' border-radius: ' + selectBorderRadius + ';';
    if (selectColor && selectColor !== 'rgba(0, 0, 0, 0)') triggerStyle += ' color: ' + selectColor + ';';
    if (selectFontSize) triggerStyle += ' font-size: ' + selectFontSize + ';';
    if (selectFontFamily) triggerStyle += ' font-family: ' + selectFontFamily + ';';
    if (selectPadding && selectPadding !== '0px') triggerStyle += ' padding: ' + selectPadding + ';';
    if (selectWidth !== 'auto' && selectWidth > 0) triggerStyle += ' width: ' + selectWidth + 'px;';
    else triggerStyle += ' width: 100%;';
    if (selectHeight !== 'auto' && selectHeight > 0) triggerStyle += ' height: ' + selectHeight + 'px;';
    if (selectMinWidth) triggerStyle += ' min-width: ' + selectMinWidth + ';';
    if (selectMaxWidth) triggerStyle += ' max-width: ' + selectMaxWidth + ';';
    if (selectMinHeight) triggerStyle += ' min-height: ' + selectMinHeight + ';';
    if (selectMaxHeight) triggerStyle += ' max-height: ' + selectMaxHeight + ';';
    trigger.style.cssText = triggerStyle;

    return {
        trigger,
        flagSpan: trigger.querySelector('.bb-country-flag'),
        nameSpan: trigger.querySelector('.bb-country-name'),
        chevron: trigger.querySelector('svg')
    };
}

function buildPopover(styles, cfg) {
    const { selectBorderRadius, selectFontSize, selectFontFamily } = styles;
    const { searchPlaceholder } = cfg;

    const popover = document.createElement('div');
    popover.className = 'bb-country-select-popover';
    popover.setAttribute('role', 'listbox');
    let popoverStyle = 'position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; max-height: 300px; overflow: hidden; display: none; z-index: 50; background-color: white; border: 1px solid #e5e7eb;';
    if (selectBorderRadius && selectBorderRadius !== '0px') popoverStyle += ' border-radius: ' + selectBorderRadius + ';';
    else popoverStyle += ' border-radius: 6px;';
    popoverStyle += ' box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);';
    popover.style.cssText = popoverStyle;

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'bb-country-search';
    searchWrapper.style.cssText = 'position: sticky; top: 0; padding: 8px; background-color: white; border-bottom: 1px solid #e5e7eb; z-index: 1;';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'bb-country-search-input';
    searchInput.placeholder = searchPlaceholder;
    searchInput.setAttribute('aria-label', searchPlaceholder);
    let searchInputStyle = 'width: 100%; padding: 8px 12px; box-sizing: border-box;';
    if (selectFontSize) searchInputStyle += ' font-size: ' + selectFontSize + ';';
    if (selectFontFamily) searchInputStyle += ' font-family: ' + selectFontFamily + ';';
    searchInputStyle += ' border: 1px solid #e5e7eb;';
    if (selectBorderRadius && selectBorderRadius !== '0px') {
        const borderRadiusValue = parseFloat(selectBorderRadius);
        if (!isNaN(borderRadiusValue)) searchInputStyle += ' border-radius: ' + (borderRadiusValue * 0.75) + 'px;';
    } else {
        searchInputStyle += ' border-radius: 4px;';
    }
    searchInput.style.cssText = searchInputStyle;

    searchWrapper.appendChild(searchInput);
    popover.appendChild(searchWrapper);

    const list = document.createElement('div');
    list.className = 'bb-country-list';
    list.style.cssText = 'overflow-y: auto; max-height: 250px; padding-bottom: 8px;';
    popover.appendChild(list);

    return { popover, searchInput, list };
}

export function buildUI(element, styles, cfg) {
    const wrapper = buildWrapper(element, styles);
    const t = buildTrigger(styles, cfg);
    const p = buildPopover(styles, cfg);
    return {
        wrapper, trigger: t.trigger, popover: p.popover, searchInput: p.searchInput, list: p.list,
        flagSpan: t.flagSpan, nameSpan: t.nameSpan, chevron: t.chevron
    };
}
