# Country Select

Replaces a native `<select>` element with a searchable country picker including flags, bilingual labels (French/English), and preferred country ordering.

**Source:** [`src/modules/countrySelect.js`](../src/modules/countrySelect.js)

## Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-country-select` | — | — | Enables module on a `<select>` element |
| `data-bb-country-select-preferred` | comma-separated ISO codes | — | Prioritized countries at the top, for example `FR,BE,CH` |
| `data-bb-country-select-default` | ISO code or country name | current select value | Preselected country |

## Usage

### Basic

```html
<select data-bb-country-select>
  <option value="">Select a country</option>
</select>
```

### With Preferred Countries

```html
<select data-bb-country-select data-bb-country-select-preferred="FR,BE,CH,CA">
  <option value="">Select a country</option>
</select>
```

France, Belgium, Switzerland, and Canada will appear at the top of the list.

### With Default Selection

```html
<select data-bb-country-select data-bb-country-select-default="FR">
  <option value="">Select a country</option>
</select>
```

Accepts ISO alpha-2 (`FR`), alpha-3 (`FRA`), or full country names (`France`).

## How It Works

1. **Detection** — The module finds `<select>` elements with `data-bb-country-select`.
2. **Style capture** — The original select's computed styles (background, border, border-radius, font, padding, dimensions) are captured.
3. **DOM replacement** — The `<select>` is hidden (`opacity: 0; pointer-events: none`) and a custom UI is built:
   - A **trigger button** showing the selected flag + country name + chevron
   - A **popover** with a search input and scrollable country list
4. **Style inheritance** — The trigger button inherits all visual styles from the original `<select>`, ensuring design consistency.
5. **Search** — The search input filters countries by name (fr/en), ISO alpha-2, or alpha-3 codes.
6. **Selection** — On click, the hidden `<select>`'s value is updated and a `change` event is dispatched, so form integrations (Webflow, logic flows) continue to work.

## Language Detection

The module automatically detects the page language:
1. Checks the `lang` attribute on the element itself
2. Walks up to the nearest ancestor with `lang`
3. Falls back to `document.documentElement.lang`
4. Defaults to `fr` if nothing is found

Supported languages: `fr` (French) and `en` (English).

## Country Data

All 249 countries/territories are built-in with:
- ISO 3166-1 alpha-2 code (e.g. `FR`)
- ISO 3166-1 alpha-3 code (e.g. `FRA`)
- Name in French and English

Flags are loaded from [circle-flags](https://hatscripts.github.io/circle-flags/) as SVG images.

## Generated DOM Structure

```html
<div class="bb-country-select-wrapper">
  <select data-bb-country-select style="opacity: 0; ..."><!-- hidden --></select>
  <button class="bb-country-select-trigger" aria-haspopup="listbox">
    <div>
      <span class="bb-country-flag"><img src="...flag.svg" /></span>
      <span class="bb-country-name">France</span>
    </div>
    <svg><!-- chevron --></svg>
  </button>
  <div class="bb-country-select-popover" role="listbox">
    <div class="bb-country-search">
      <input class="bb-country-search-input" type="text" />
    </div>
    <div class="bb-country-list">
      <div class="bb-country-item" data-country="fr" role="option">
        <img src="...fr.svg" /> <span>France</span>
      </div>
      <!-- ... more items -->
    </div>
  </div>
</div>
```

## Accessibility

- Trigger has `aria-haspopup="listbox"` and `aria-expanded`
- Popover has `role="listbox"`
- Items have `role="option"` and `aria-selected`
- Escape key closes the dropdown and returns focus to the trigger
- Search input gets focus when the dropdown opens
