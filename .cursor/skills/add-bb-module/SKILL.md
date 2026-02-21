---
name: add-bb-module
description: Add a new feature module to bb-contents.js following the exact project pattern. Use when adding a new bb-* attribute feature, creating a new data attribute handler, or extending the library with new functionality.
---

# Add a bb-contents Module

## Step-by-step

1. **Define the attribute name** — e.g. `bb-tooltip`. All attributes use the `data-bb-*` / `bb-*` dual format.
2. **Insert the module** into `bbContents.modules` inside `bb-contents.js`, before the closing `};` of the modules object. Follow the boilerplate below exactly.
3. **Test** by adding the attribute to an HTML element and loading the script.

## Module boilerplate

Replace `moduleName` and `bb-attr` with your actual names:

```js
// Module ModuleName
moduleName: {
    detect: function(scope) {
        const s = scope || document;
        return s.querySelector(bbContents._attrSelector('bb-attr')) !== null;
    },

    init: function(root) {
        const scope = root || document;
        if (scope.closest && scope.closest('[data-bb-disable]')) return;
        const elements = scope.querySelectorAll(bbContents._attrSelector('bb-attr'));

        elements.forEach(function(element) {
            if (element.bbProcessed) return;
            element.bbProcessed = true;

            // Read options
            const option = bbContents._getAttr(element, 'bb-attr-option') || 'default';

            // Sanitize any value before DOM insertion
            const safeValue = bbContents.utils.sanitize(option);

            // Module logic here
            element.setAttribute('data-bb-attr-processed', 'true');
        });

        bbContents.utils.log('Module ModuleName initialisé:', elements.length, 'éléments');
    }
},
```

## Checklist

- [ ] `detect` uses `bbContents._attrSelector()`
- [ ] `init` checks `data-bb-disable` at the top
- [ ] `init` guards every element with `if (element.bbProcessed) return`
- [ ] All attribute reads use `bbContents._getAttr()`
- [ ] All values inserted into the DOM are sanitized (`utils.sanitize`, `utils.escapeCss`, etc.)
- [ ] Retry loops (if any) have a hard max — never infinite
- [ ] Event listeners added per-element are not duplicated on reinit
- [ ] `data-bb-[name]-processed` attribute is set when done
- [ ] `bbContents.utils.log(...)` call at the end

## Attribute naming conventions

| Purpose | Attribute |
|---|---|
| Main trigger | `data-bb-[name]` |
| Options | `data-bb-[name]-[option]` |
| Processed flag | `data-bb-[name]-processed` |

Use `_attrSelector('bb-name')` — it automatically generates the dual `[bb-name], [data-bb-name]` selector.
