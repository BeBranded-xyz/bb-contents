# YouTube

Displays a dynamic YouTube video feed in Webflow using a Worker proxy endpoint. Supports multiple channels, caching, bot detection, and Webflow template-based rendering.

**Source:** [`src/modules/youtube.js`](../src/modules/youtube.js) (orchestration) + [`src/modules/youtube/`](../src/modules/youtube/) (`format`, `cache`, `fetch`, `render`)
**Worker:** [`youtube-worker.js`](../youtube-worker.js) — the Cloudflare Worker proxy that holds the API key.

## Attributes

### Feed Configuration

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-bb-youtube-channel` | channel ID(s), comma-separated | — | YouTube channel ID(s) to fetch |
| `data-bb-youtube-video-count` | number | `10` | Number of videos to display |
| `data-bb-youtube-skip` | number | `0` | Number of videos to skip from start |
| `data-bb-youtube-language` | `fr` \| `en` | `fr` | Language for relative dates |
| `data-bb-youtube-allow-shorts` | `true` \| `false` | `false` | Include YouTube Shorts |

### Template Attributes

| Attribute | Description |
|---|---|
| `data-bb-youtube-container` | Optional wrapper where generated cards are inserted |
| `data-bb-youtube-item` | Template element cloned for each video card |
| `data-bb-youtube-thumbnail` | `<img>` element for the video thumbnail |
| `data-bb-youtube-title` | Element for the video title |
| `data-bb-youtube-description` | Element for the video description |
| `data-bb-youtube-date` | Element for the relative published date |
| `data-bb-youtube-channel` | Element for the channel name inside a card |

## Usage

### Required: Worker Endpoint

Set the endpoint **before** loading `bb-contents.js`:

```html
<script>
  window._bbContentsConfig = {
    youtubeEndpoint: "https://your-worker.workers.dev"
  };
</script>
```

Or at runtime:

```html
<script>
  configureYouTube("https://your-worker.workers.dev");
</script>
```

## Worker Setup (`youtube-worker.js`)

The browser never sees the YouTube API key — all requests go through a Cloudflare
Worker that holds the key and proxies the YouTube Data API. Deploy `youtube-worker.js`
with `wrangler` and configure these environment variables / secrets:

| Variable | Required | Description |
|---|---|---|
| `YOUTUBE_API_KEY` | Yes (secret) | YouTube Data API key. Stored as a Worker secret — never exposed to the client. |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated allowlist of origins permitted to call the proxy, e.g. `https://www.bebranded.xyz,https://your-site.webflow.io`. |

**CORS behavior:**
- When `ALLOWED_ORIGINS` is **set**, only those origins receive a CORS header; any
  other origin gets `403 Origin not allowed`. This protects your YouTube quota from
  being consumed by other sites.
- When `ALLOWED_ORIGINS` is **unset**, the Worker falls back to `Access-Control-Allow-Origin: *`
  (open) so nothing breaks before you configure it. **Set it before going to production.**

The Worker also caches responses for 24h (Cloudflare cache) and times out upstream
requests after 10s.

### Basic Feed

```html
<div data-bb-youtube-channel="UCxxxxxxxxxxxxxx">
  <a data-bb-youtube-item href="#">
    <img data-bb-youtube-thumbnail />
    <h3 data-bb-youtube-title></h3>
    <p data-bb-youtube-description></p>
    <span data-bb-youtube-date></span>
  </a>
</div>
```

### Multiple Channels

```html
<div data-bb-youtube-channel="UCxxxx,UCyyyy" data-bb-youtube-video-count="6">
  <div data-bb-youtube-item>
    <img data-bb-youtube-thumbnail />
    <h3 data-bb-youtube-title></h3>
    <span data-bb-youtube-date></span>
  </div>
</div>
```

Videos from both channels are merged and sorted by publish date (most recent first).

### Skip and Limit

```html
<div data-bb-youtube-channel="UCxxxx"
     data-bb-youtube-video-count="3"
     data-bb-youtube-skip="2">
  <!-- Shows videos 3, 4, 5 (skips the first 2) -->
</div>
```

## How It Works

1. **Bot detection** — Checks `navigator.userAgent` against known bot patterns. Bots are silently skipped to avoid API calls.
2. **Configuration grouping** — Multiple elements with the same channel+options are grouped into a single API request.
3. **Endpoint validation** — The Worker URL is validated (protocol, match against configured endpoint).
4. **Cache** — Responses are cached in `localStorage` for 24 hours. Cache keys include channel IDs, shorts setting, and language.
5. **Deduplication** — If a request for the same cache key is already in flight, subsequent elements wait for it to complete.
6. **Fetch** — Single channel: one `fetch()` call. Multiple channels: parallel fetches merged and sorted by date.
7. **Template rendering** — The `data-bb-youtube-item` element is cloned for each video. Template attributes (`thumbnail`, `title`, `description`, `date`, `channel`) are filled. Links are set to `https://youtube.com/watch?v=VIDEO_ID`.
8. **Error handling** — On failure, expired cache is used as fallback. If no cache, an error message is displayed.

## Relative Date Format

Dates are displayed as relative time strings:

| Range | French | English |
|---|---|---|
| 1 day | Il y a 1 jour | 1 day ago |
| < 7 days | Il y a 3 jours | 3 days ago |
| 1 week | Il y a 1 semaine | 1 week ago |
| < 30 days | Il y a 2 semaines | 2 weeks ago |
| 1 month | Il y a 1 mois | 1 month ago |
| < 365 days | Il y a 6 mois | 6 months ago |
| 1 year | Il y a 1 an | 1 year ago |
| > 1 year | Il y a 2 ans | 2 years ago |

## Caching

- **Storage:** `localStorage` with keys prefixed `youtube_`
- **TTL:** 24 hours
- **Cleanup:** Expired entries are purged on each module init
- **Fallback:** Expired cache is still used if a fresh fetch fails

## Error States

| Condition | Behavior |
|---|---|
| No endpoint configured | Retries up to 10 times (500ms interval), then shows setup instructions |
| No template element | Shows error message |
| API error | Falls back to expired cache, then shows error |
| Bot detected | Module silently skips |
