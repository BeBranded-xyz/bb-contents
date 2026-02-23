# Current Year

Inserts the current year into an element. Useful for copyright notices and dynamic date displays.

**Source:** [`src/modules/currentYear.js`](../src/modules/currentYear.js)

## Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-current-year` | — | — | Enables current-year module on the element |
| `data-bb-current-year-format` | text with `{year}` | — | Custom format, for example `Copyright {year}` |
| `data-bb-current-year-prefix` | text | — | Text before year |
| `data-bb-current-year-suffix` | text | — | Text after year |

## Usage

### Simple Year

```html
<span data-bb-current-year></span>
<!-- Output: 2026 -->
```

### With Format

```html
<span data-bb-current-year data-bb-current-year-format="© {year} BeBranded"></span>
<!-- Output: © 2026 BeBranded -->
```

### With Prefix and Suffix

```html
<span data-bb-current-year data-bb-current-year-prefix="Copyright " data-bb-current-year-suffix=" - All rights reserved"></span>
<!-- Output: Copyright 2026 - All rights reserved -->
```

## How It Works

1. The module scans for elements with `data-bb-current-year`.
2. The current year is computed via `new Date().getFullYear()`.
3. If `data-bb-current-year-format` is set and contains `{year}`, the placeholder is replaced.
4. Otherwise, prefix + year + suffix are concatenated.
5. The result is set via `element.textContent` (safe against XSS).

## Priority

- `format` takes precedence if it contains `{year}`.
- If no format, `prefix` and `suffix` are used.
- If nothing is set, the raw year string is inserted.
