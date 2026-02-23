# Favicon

Dynamically replaces the page favicon, with support for automatic light/dark mode switching via `prefers-color-scheme`.

**Source:** [`src/modules/favicon.js`](../src/modules/favicon.js)

## Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-favicon` | URL | — | Light/default favicon URL |
| `data-bb-favicon-dark` | URL | — | Favicon URL when `prefers-color-scheme: dark` matches |

## Usage

### Simple Favicon Override

```html
<div data-bb-favicon="https://example.com/favicon.png"></div>
```

### Dark Mode Support

```html
<div data-bb-favicon="https://example.com/favicon-light.png"
     data-bb-favicon-dark="https://example.com/favicon-dark.png">
</div>
```

The favicon automatically switches when the user toggles their system dark mode.

## How It Works

1. **Detection** — Finds elements with `data-bb-favicon` or `data-bb-favicon-dark`.
2. **Original favicon** — The existing `<link rel="icon">` is saved for reference.
3. **Favicon element** — Finds or creates a `<link rel="icon">` in `<head>`.
4. **Cache busting** — A `?v=timestamp` query parameter is appended to force browser refresh.
5. **Dark mode** — If both light and dark URLs are provided, a `matchMedia('(prefers-color-scheme: dark)')` listener is set up. The favicon updates in real time when the user switches modes.

## Notes

- The element carrying the attributes can be any element (e.g. a hidden `<div>`). It only serves as a configuration holder.
- If only `data-bb-favicon-dark` is set without `data-bb-favicon`, the dark favicon will not be applied (both are needed for dark mode switching).
- The `?v=timestamp` suffix ensures the browser doesn't serve a cached version of the old favicon.
