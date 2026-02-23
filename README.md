# BeBranded Contents

`@bebranded/bb-contents` is a lightweight vanilla JavaScript IIFE library for Webflow.
It enables ready-to-use front-end features with HTML attributes (`bb-*` or `data-bb-*`), without external dependencies.

## Getting Started

Full product documentation and examples:
- https://www.bebranded.xyz/contents

## Installation

### CDN (recommended)

```html
<!-- BeBranded Contents -->
<script async src="https://cdn.jsdelivr.net/npm/@bebranded/bb-contents@latest/bb-contents.js"></script>
```

### NPM

```bash
npm install @bebranded/bb-contents
```

## Architecture

```
src/core.js ──imports──▶ src/modules/*.js
       │
   esbuild (build.js)
       │
       ▼
bb-contents.js   (IIFE, unminified)
bb-contents.min.js (IIFE, minified + sourcemap)
```

`src/core.js` imports all modules and esbuild bundles everything into a single self-executing IIFE — no external dependencies. `bb-contents.js` and `bb-contents.min.js` are **generated files** and should not be edited directly.

### How It Works

1. **Load & guard** — The IIFE runs on script load. It checks `window.bbContents` to prevent double-initialization, then exposes the library globally and schedules `init()` after a short delay (100ms, or 300ms with `bb-performance-boost`).

2. **Attribute-based detection** — On init, a compound CSS selector is built from `attrMap` (e.g. `[bb-marquee], [data-bb-marquee], ...`). The DOM is scanned (scoped to `[data-bb-scope]` if present) and only modules with matching attributes on the page are initialized. Unused modules never run.

3. **Module resolution** — Each `data-bb-*` attribute is resolved to its parent module using longest-prefix matching. For example, `data-bb-marquee-speed` → tries `marquee-speed` (no match) → tries `marquee` → found. Internal suffixes (`-processed`, `-initialized`) are filtered out.

4. **MutationObserver** — After init, a `MutationObserver` watches for new DOM nodes. When Webflow dynamically adds elements (CMS items, interactions), the observer batches them by module and flushes on the next `requestAnimationFrame`, calling `module.init(root)` for each affected subtree.

5. **Module contract** — Every module follows the same pattern: `init(scope)` → scan scope for its elements → guard with `bbProcessed` / `data-bb-*-processed` to prevent double-processing → execute logic. All modules respect `[data-bb-disable]` on ancestor elements.

```
Page loads → IIFE runs → window.bbContents set
                              │
                        DOMContentLoaded + delay
                              │
                        bbContents.init()
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Scan DOM        Init modules     Setup Observer
     (attrMap keys)    (only needed)    (watch new nodes)
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                     Page is interactive
                              │
                     New DOM node added?
                              │
                     Observer batches → rAF → module.init(node)
```

## Attribute Syntax

Both syntaxes are supported everywhere:

- `bb-*` (short form), for example: `bb-marquee`
- `data-bb-*` (HTML-valid data attribute), for example: `data-bb-marquee`

## Global Behavior

- `data-bb-disable`: disables initialization inside the marked subtree
- `data-bb-scope`: optional root scope to limit module scanning
- `bb-performance-boost` on `<body>`: increases startup delay for performance-sensitive pages

## Global Configuration

You can set configuration before loading the script:

```html
<script>
  window._bbContentsConfig = {
    youtubeEndpoint: "https://your-worker.workers.dev"
  };
</script>
```

## Modules

Each module has its own detailed documentation in the [`docs/`](docs/) folder.

| Module | Attribute | Description | Docs |
|---|---|---|---|
| Marquee | `data-bb-marquee` | Infinite scroll animation | [docs/marquee.md](docs/marquee.md) |
| Share | `data-bb-share` | Social share buttons | [docs/share.md](docs/share.md) |
| Current Year | `data-bb-current-year` | Dynamic year insertion | [docs/current-year.md](docs/current-year.md) |
| Reading Time | `data-bb-reading-time` | Estimated reading time | [docs/reading-time.md](docs/reading-time.md) |
| Country Select | `data-bb-country-select` | Searchable country picker with flags | [docs/country-select.md](docs/country-select.md) |
| Favicon | `data-bb-favicon` | Dynamic favicon with dark mode | [docs/favicon.md](docs/favicon.md) |
| YouTube | `data-bb-youtube-channel` | YouTube feed via Worker proxy | [docs/youtube.md](docs/youtube.md) |

### Quick Reference

#### Marquee

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-marquee` | — | — | Enables marquee on the container |
| `data-bb-marquee-direction` | `left` \| `right` \| `top` \| `bottom` | `left` | Scroll direction |
| `data-bb-marquee-speed` | number | `100` | Speed in pixels/second |
| `data-bb-marquee-pause` | `true` \| `false` | `true` | Pause animation on hover |
| `data-bb-marquee-gap` | number | `50` | Gap between repeated blocks (px) |
| `data-bb-marquee-orientation` | `horizontal` \| `vertical` | `horizontal` | Scroll orientation |
| `data-bb-marquee-height` | number \| `auto` | `300` | Vertical container height (px or `auto`) |
| `data-bb-marquee-min-height` | CSS value | — | Minimum container height |

#### Share

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-share` | `twitter` \| `facebook` \| `linkedin` \| `whatsapp` \| `telegram` \| `email` \| `copy` \| `native` | — | Share network/action |
| `data-bb-url` | URL | current page URL | URL to share |
| `data-bb-text` | text | document title | Text/title to share |

#### Current Year

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-current-year` | — | — | Enables current-year module on the element |
| `data-bb-current-year-format` | text with `{year}` | — | Custom format, for example `Copyright {year}` |
| `data-bb-current-year-prefix` | text | — | Text before year |
| `data-bb-current-year-suffix` | text | — | Text after year |

#### Reading Time

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-reading-time` | — | — | Enables reading-time output element |
| `data-bb-reading-time-target` | CSS selector | — | Target element(s) to analyze |
| `data-bb-reading-time-speed` | number | `230` | Reading speed in words/minute |
| `data-bb-reading-time-image-speed` | number | `12` | Time per image in seconds |
| `data-bb-reading-time-format` | text with `{minutes}` | `{minutes} min` | Display format |
| `data-bb-reading-time-url` | URL (same origin only) | — | URL to fetch and analyze |

#### Country Select

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-country-select` | — | — | Enables module on a `<select>` element |
| `data-bb-country-select-preferred` | comma-separated ISO codes | — | Prioritized countries at the top, for example `FR,BE,CH` |
| `data-bb-country-select-default` | ISO code or country name | current select value | Preselected country |

#### Favicon

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-favicon` | URL | — | Light/default favicon URL |
| `data-bb-favicon-dark` | URL | — | Favicon URL when `prefers-color-scheme: dark` matches |

#### YouTube

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-youtube-channel` | channel ID(s), comma-separated | — | YouTube channel ID(s) |
| `data-bb-youtube-video-count` | number | `10` | Number of videos to display |
| `data-bb-youtube-skip` | number | `0` | Number of videos to skip from start |
| `data-bb-youtube-language` | `fr` \| `en` | `fr` | Relative-date language |
| `data-bb-youtube-allow-shorts` | `true` \| `false` | `false` | Include YouTube Shorts |
| `data-bb-youtube-container` | — | — | Optional container for generated cards |
| `data-bb-youtube-item` | — | — | Template element for one video card |
| `data-bb-youtube-thumbnail` | — | — | `<img>` for thumbnail |
| `data-bb-youtube-title` | — | — | Node for video title |
| `data-bb-youtube-description` | — | — | Node for video description |
| `data-bb-youtube-date` | — | — | Node for relative published date |

## Development

Source files live in `src/`.
`bb-contents.js` and `bb-contents.min.js` are generated build outputs and should not be edited directly.

```bash
npm install
npm run build
```

## Publishing Rules

Version must stay identical in all 3 places:

1. `package.json` -> `version`
2. `src/core.js` -> `BB_CONTENTS_VERSION`
3. `bb-contents.js` header -> `@version` (generated by build)

Release targets:

- Test release: push `develop` + `npm publish --tag test`
- Live release: push `main` + `npm publish`

## Support

- Email: hello@bebranded.xyz
- GitHub issues: bug reports and feature requests

## Contribution

Contributions are welcome. Open an issue to discuss major changes, or submit a pull request directly.

## License

MIT

Copyright (c) 2025 BeBranded
