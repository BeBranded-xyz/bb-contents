---
name: add-bb-module
description: Add a new feature module to bb-contents following the exact project pattern. Use when adding a new bb-* attribute feature, creating a new data attribute handler, or extending the library with new functionality.
---

# Add a bb-contents Module

Source lives in `src/`. `bb-contents.js` / `.min.js` are generated — never edit
them by hand. See `.cursor/rules/bb-contents-core.mdc` for the full contract.

## Step-by-step

1. **Define the attribute name** — e.g. `bb-tooltip`. All attributes use the dual
   `data-bb-*` / `bb-*` format.
2. **Create the module file** `src/modules/tooltip.js` with a default-exported
   object (boilerplate below).
3. **Wire it into `src/core.js`** in all four places:
   - `import tooltip from './modules/tooltip.js';`
   - add `tooltip` to the `modules: { ... }` object
   - add the trigger to `attrMap` (e.g. `'tooltip': 'tooltip'`)
   - add each option attribute to `_optionRules`
4. **Build**: `npm run build`.
5. **Document**: JSDoc on the module, a section + attribute table in `README.md`,
   and a `docs/tooltip.md`.
6. **Test** by adding the attribute to an HTML element and loading the built script.

## Module boilerplate

Create `src/modules/<name>.js`. Replace `tooltip` / `bb-tooltip` with your names:

```js
/**
 * Module Tooltip
 * Affiche une infobulle au survol de l'élément.
 *
 * @attr {string} bb-tooltip - Texte de l'infobulle
 * @attr {'top'|'bottom'|'left'|'right'} [bb-tooltip-position=top] - Position
 */
export default {
    init(scope) {
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('tooltip'));

        elements.forEach(function (element) {
            if (element.hasAttribute('data-bb-tooltip-processed')) return;
            element.setAttribute('data-bb-tooltip-processed', '1');

            // Read options
            const position = bbContents._getAttr(element, 'bb-tooltip-position') || 'top';

            // Sanitize any value before DOM insertion
            const text = bbContents.utils.sanitize(bbContents._getAttr(element, 'bb-tooltip') || '');

            // ... module logic ...
        });

        bbContents.utils.log('Module Tooltip initialisé:', elements.length, 'éléments');
    }
};
```

## Checklist

- [ ] New file `src/modules/<name>.js` with `export default { init(scope) {...} }`
- [ ] Queries use `bbContents._attrSelector('<name>')`
- [ ] `init` checks `[data-bb-disable]` at the top
- [ ] Every element guarded with `data-bb-<name>-processed` (idempotent re-init)
- [ ] All attribute reads use `bbContents._getAttr()`
- [ ] All values inserted into the DOM are sanitized (`utils.sanitize`, `utils.escapeCss`, `utils.isValidUrl`, ...)
- [ ] Retry loops (if any) have a hard max — never infinite
- [ ] Event listeners added per-element are not duplicated on reinit
- [ ] Wired into `core.js`: import + `modules` + `attrMap` + `_optionRules`
- [ ] `bbContents.utils.log(...)` call at the end
- [ ] `npm run build` run; JSDoc + README + `docs/<name>.md` updated

## Attribute naming conventions

| Purpose | Attribute |
|---|---|
| Main trigger | `data-bb-<name>` |
| Options | `data-bb-<name>-<option>` |
| Processed flag | `data-bb-<name>-processed` |

`_attrSelector('<name>')` automatically generates the dual `[bb-<name>],
[data-bb-<name>]` selector. It accepts the bare name or the `bb-`-prefixed form.
