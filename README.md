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

## Marquee

Duplicates and scrolls content in an infinite loop, horizontally or vertically.

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-marquee` | - | - | Enables marquee on the container |
| `data-bb-marquee-direction` | `left` \| `right` \| `top` \| `bottom` | `left` | Scroll direction |
| `data-bb-marquee-speed` | number | `100` | Speed in pixels/second |
| `data-bb-marquee-pause` | `true` \| `false` | `true` | Pause animation on hover |
| `data-bb-marquee-gap` | number | `50` | Gap between repeated blocks (px) |
| `data-bb-marquee-orientation` | `horizontal` \| `vertical` | `horizontal` | Scroll orientation |
| `data-bb-marquee-height` | number \| `auto` | `300` | Vertical container height (px or `auto`) |
| `data-bb-marquee-min-height` | CSS value | - | Minimum container height |

## Share

Adds share actions to clickable elements.

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-share` | `twitter` \| `facebook` \| `linkedin` \| `whatsapp` \| `telegram` \| `email` \| `copy` \| `native` | - | Share network/action |
| `data-bb-url` | URL | current page URL | URL to share |
| `data-bb-text` | text | document title | Text/title to share |

## Current Year

Inserts the current year in an element.

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-current-year` | - | - | Enables current-year module on the element |
| `data-bb-current-year-format` | text with `{year}` | - | Custom format, for example `Copyright {year}` |
| `data-bb-current-year-prefix` | text | - | Text before year |
| `data-bb-current-year-suffix` | text | - | Text after year |

## Reading Time

Calculates and displays estimated reading time from local or fetched content.

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-reading-time` | - | - | Enables reading-time output element |
| `data-bb-reading-time-target` | CSS selector | - | Target element(s) to analyze |
| `data-bb-reading-time-speed` | number | `230` | Reading speed in words/minute |
| `data-bb-reading-time-image-speed` | number | `12` | Time per image in seconds |
| `data-bb-reading-time-format` | text with `{minutes}` | `{minutes} min` | Display format |
| `data-bb-reading-time-url` | URL (same origin only) | - | URL to fetch and analyze |

## Country Select

Replaces a native `<select>` with a searchable country picker including flags.

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-country-select` | - | - | Enables module on a `<select>` element |
| `data-bb-country-select-preferred` | comma-separated ISO codes | - | Prioritized countries at the top, for example `FR,BE,CH` |
| `data-bb-country-select-default` | ISO code or country name | current select value | Preselected country |

## Favicon

Updates the page favicon dynamically, with dark-mode support.

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-favicon` | URL | - | Light/default favicon URL |
| `data-bb-favicon-dark` | URL | - | Favicon URL when `prefers-color-scheme: dark` matches |

## YouTube

Displays a dynamic YouTube feed through a Worker proxy endpoint.

### Feed Configuration Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-youtube-channel` | channel ID(s), comma-separated | - | Enables the module and specifies one or multiple YouTube channel IDs |
| `data-bb-youtube-video-count` | number | `10` | Number of videos to display |
| `data-bb-youtube-skip` | number | `0` | Number of videos to skip from start |
| `data-bb-youtube-language` | `fr` \| `en` | `fr` | Relative-date language |
| `data-bb-youtube-allow-shorts` | `true` \| `false` | `false` | Include YouTube Shorts |

### Template Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-youtube-container` | - | container element | Optional node where generated cards are inserted |
| `data-bb-youtube-item` | - | - | Template element used as one video card |
| `data-bb-youtube-thumbnail` | - | - | `<img>` node for thumbnail |
| `data-bb-youtube-title` | - | - | Node for video title |
| `data-bb-youtube-description` | - | - | Node for video description |
| `data-bb-youtube-date` | - | - | Node for relative published date |
| `data-bb-youtube-channel` | - | - | Node for channel name inside card |

### Required Worker Endpoint

Set the endpoint before loading `bb-contents.js`:

```html
<script>
  window._bbContentsConfig = {
    youtubeEndpoint: "https://your-worker.workers.dev"
  };
</script>
```

You can also update it at runtime:

```html
<script>
  configureYouTube("https://your-worker.workers.dev");
</script>
```

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
2. `bb-contents.js` -> `BB_CONTENTS_VERSION`
3. `bb-contents.js` header -> `@version`

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
