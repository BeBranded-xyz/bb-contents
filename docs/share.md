# Share

Adds social share actions to clickable elements. Supports multiple networks, clipboard copy, and the Web Share API.

**Source:** [`src/modules/share.js`](../src/modules/share.js)

## Attributes

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-share` | `twitter` \| `facebook` \| `linkedin` \| `whatsapp` \| `telegram` \| `email` \| `copy` \| `native` | — | Share network/action |
| `data-bb-url` | URL | current page URL | URL to share |
| `data-bb-text` | text | document title | Text/title to share |

## Usage

### Basic Share Buttons

```html
<button data-bb-share="twitter">Share on Twitter</button>
<button data-bb-share="linkedin">Share on LinkedIn</button>
<button data-bb-share="copy">Copy Link</button>
```

### Custom URL and Text

```html
<a data-bb-share="whatsapp" data-bb-url="https://example.com" data-bb-text="Check this out!">
  Share on WhatsApp
</a>
```

### Native Share (Mobile)

```html
<button data-bb-share="native">Share</button>
```

Falls back to clipboard copy if the Web Share API is not available.

## How It Works

1. **Detection** — Elements with `data-bb-share` are found and a click handler is attached.
2. **URL building** — Each network has a URL template. The share URL and text are encoded and inserted.
3. **Popup** — For web networks (`twitter`, `facebook`, `linkedin`, `whatsapp`, `telegram`), a centered popup window is opened.
4. **Email** — Opens a `mailto:` link with the subject and body pre-filled.
5. **Copy** — Uses `navigator.clipboard.writeText` with a fallback to `window.prompt`.
6. **Native** — Uses `navigator.share()` with a fallback to clipboard copy.

## Supported Networks

| Network | Action |
|---|---|
| `twitter` | Opens Twitter/X intent with URL + text |
| `facebook` | Opens Facebook share dialog |
| `linkedin` | Opens LinkedIn share page |
| `whatsapp` | Opens WhatsApp with text + URL |
| `telegram` | Opens Telegram share with URL + text |
| `email` | Opens default mail client with subject + body |
| `copy` | Copies URL to clipboard |
| `native` | Uses Web Share API (mobile-friendly) |

## Accessibility

- Non-button/link elements automatically get `role="button"` and `tabindex="0"`.
- Keyboard activation via Enter or Space is supported for non-native elements.
- All elements get `cursor: pointer`.
