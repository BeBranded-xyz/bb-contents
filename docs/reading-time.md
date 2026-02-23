# Reading Time

Calculates and displays estimated reading time from local page content or fetched remote content.

**Source:** [`src/modules/readingTime.js`](../src/modules/readingTime.js)

## Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-reading-time` | — | — | Enables reading-time output element |
| `data-bb-reading-time-target` | CSS selector | — | Target element(s) to analyze |
| `data-bb-reading-time-speed` | number | `230` | Reading speed in words/minute |
| `data-bb-reading-time-image-speed` | number | `12` | Time per image in seconds |
| `data-bb-reading-time-format` | text with `{minutes}` | `{minutes} min` | Display format |
| `data-bb-reading-time-url` | URL (same origin only) | — | URL to fetch and analyze |

## Usage

### Basic (Analyze Self)

```html
<div data-bb-reading-time>
  <p>Your article content here...</p>
</div>
<!-- Output: 3 min -->
```

### Analyze a Target Element

```html
<span data-bb-reading-time data-bb-reading-time-target=".article-body"></span>
```

### Custom Format and Speed

```html
<span data-bb-reading-time
      data-bb-reading-time-target=".blog-post"
      data-bb-reading-time-speed="200"
      data-bb-reading-time-format="{minutes} min read">
</span>
```

### Fetch Remote Content

```html
<span data-bb-reading-time data-bb-reading-time-url="/blog/my-article"></span>
```

Only same-origin URLs are allowed for security.

### Auto-Detect from Parent Link

If the reading-time element is inside an `<a>` tag, the link's `href` is automatically used as the URL to fetch:

```html
<a href="/blog/my-article">
  <span data-bb-reading-time></span>
  <h3>My Article Title</h3>
</a>
```

## How It Works

1. **URL resolution** — If the element is inside an `<a>` tag, the link's `href` is used. Otherwise, `data-bb-reading-time-url` is checked. Only same-origin URLs are accepted.
2. **Remote fetch** — If a URL is resolved, the page is fetched, parsed with `DOMParser`, and the content is extracted using common selectors (`article`, `.blog-post-content`, `.post-content`, `main .w-richtext`, etc.).
3. **Local analysis** — If no URL, the target element(s) are analyzed directly on the page.
4. **Calculation** — `wordCount / wordsPerMinute + (imageCount * secondsPerImage / 60)`, rounded up. Minimum 1 minute if there's any content.
5. **Display** — The `{minutes}` placeholder in the format string is replaced with the result.

## Content Detection (Remote Fetch)

When fetching a remote URL, the module tries these selectors in order to find the main content:

1. The custom `targetSelector` (if provided)
2. `article`
3. `[role="article"]`
4. `.blog-post-content`
5. `.post-content`
6. `.article-content`
7. `.content`
8. `main article`
9. `main .w-dyn-bind-empty`
10. `main .w-richtext`
11. Falls back to `document.body`
