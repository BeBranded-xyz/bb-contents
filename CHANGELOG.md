# Changelog

User-facing and developer-facing changes. Newest first.
Format follows the `github-workflow` rule: date · type · summary.

## [Unreleased] — Security, runtime robustness & modular refactor

- **Type**: fix (security)
- **Summary**:
  - `utils.sanitize` now escapes `"` and `'` as well as `& < >`, making it safe in
    HTML attribute contexts (was a latent attribute-injection vector).
  - `utils.isValidUrl` accepts only absolute `http(s)` URLs and rejects
    `javascript:` / `data:`.
  - `reading-time` now enforces same-origin on the fetched URL **regardless of
    source** (the wrapping `<a href>` path previously bypassed the check).
  - `youtube` validates thumbnail URLs before assignment and never throws out of
    `initElement` (a malformed attribute no longer aborts page init).
  - `youtube-worker.js`: CORS is now restricted via the `ALLOWED_ORIGINS` env var
    (falls back to open `*` only when unset). See [docs/youtube.md](docs/youtube.md).

- **Type**: fix (runtime)
- **Summary**:
  - `youtube` bot detection no longer flags Firefox/Safari (and other non-Chrome
    browsers) as bots — the feed now renders for them. UA-pattern, `webdriver` and
    `HeadlessChrome` checks remain.
  - `marquee` animation loops self-terminate when the element leaves the DOM, and
    all image/size polling loops are hard-capped (no more unbounded polling).

- **Type**: improvement (refactor, no behavior change)
- **Summary**: Split the monolithic modules into focused files, all under 300 lines:
  `core` → `internal/{utils,option-rules}`; `countrySelect` → `{data,ui,render}`;
  `youtube` → `youtube/{format,cache,fetch,render}`; `marquee` →
  `marquee/{dropdown,images,animate,safari-animate,dom}`.

> Verified via build + bundle marker diffs. Not yet validated in a real browser —
> smoke-test marquee (Safari + dropdowns), country-select, and the YouTube feed
> before the live `npm publish`.
