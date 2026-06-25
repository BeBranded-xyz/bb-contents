# Project Identity

> **This is the only file that should contain project-specific facts.**
> All the `.mdc` rules in `.cursor/rules/` are written to be project-agnostic and
> defer to this file for the concrete stack, identifiers, and conventions.
>
> Keep this file up to date in the same PR whenever the stack, structure, or a
> key decision changes. Never put secrets here (only public identifiers).

Last updated: 2026-06-25

---

## 1. What this project is

- **Name**: `@bebranded/bb-contents`
- **One-line description**: A lightweight vanilla-JS IIFE library that adds
  ready-to-use front-end features to Webflow sites via `bb-*` / `data-bb-*` HTML
  attributes, with no external dependencies.
- **Domain / problem**: Webflow has no native way to ship reusable, attribute-driven
  JS behaviors (marquees, social share, country pickers, YouTube feeds, etc.).
  bb-contents is a single CDN/npm script that detects `data-bb-*` attributes on the
  page, initializes only the modules actually used, and re-initializes dynamically
  added DOM (CMS items, Webflow interactions) via a `MutationObserver`. Non-trivial
  parts: zero-dependency footprint, dual attribute syntax, safe DOM insertion
  (sanitization), and robust re-init under Webflow's dynamic DOM.
- **Status**: in production (published on npm + jsDelivr).

## 2. How it runs

- **Primary runtime**: Browser. A self-executing IIFE bundle loaded on Webflow
  pages. No server runtime for the library itself.
- **Companion backend**: a single Cloudflare Worker (`youtube-worker.js`) that
  proxies the YouTube feed (see the `integrations` rule and section 7).
- **Entry points**: `src/core.js` (bundle entry) → builds `bb-contents.js` /
  `bb-contents.min.js`. Consumers load the built file from jsDelivr or npm.
- **Local dev command(s)**: `npm install`, then edit `src/` and `npm run build`.
- **Build / start**: `npm run build` (esbuild, see `build.js`) → produces the two
  generated bundles + sourcemap.
- **Deployment target**: npm registry + jsDelivr CDN (library); Cloudflare Workers
  (YouTube proxy).
- **What triggers a deploy**: manual publish. `develop` → `npm publish --tag test`;
  `main` → `npm publish` (tag `latest`). See section 5 and the `bump-and-publish`
  skill.

## 3. Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Language | Vanilla JavaScript (ES2017 target) | No framework, no runtime deps |
| Module format | ES modules in `src/`, bundled to a single IIFE | `window.bbContents` |
| Bundler | esbuild `^0.25` (`build.js`) | unminified + minified + sourcemap |
| Distribution | npm `@bebranded/bb-contents` + jsDelivr CDN | |
| Backend (optional) | Cloudflare Worker | `youtube-worker.js`, YouTube proxy |
| Database | none | |
| Authentication | none | |
| Monitoring / errors | none configured | uses `console.error` via `utils.log`; the `observability` rule module is **not active** |

## 4. Languages & conventions

- **Code, identifiers**: English.
- **Code comments & internal log strings**: French is used in places (e.g.
  `utils.log('Module ... initialisé')`); keep existing style consistent per module.
- **Commit messages**: English, conventional commits (`type(scope): description`).
- **User-facing content (i18n strings in `config.i18n`)**: French + English.
- **Public docs / README**: English. **Per-module docs (`docs/`)**: English.
- **Tone**: technical and factual.
- **Emojis in code / commits / technical docs**: not allowed. (The ✅/❌ markers in
  existing rule/skill checklists are documentation aids, not code.)

## 5. Environments & domains

| Environment | URL / host | Notes |
|---|---|---|
| Product page / docs | https://www.bebranded.xyz/contents | public-facing reference |
| CDN (latest) | https://cdn.jsdelivr.net/npm/@bebranded/bb-contents@latest/bb-contents.js | live |
| CDN (test) | `@bebranded/bb-contents@test` on npm/jsDelivr | from `develop` |
| YouTube Worker | a `*.workers.dev` endpoint (set via `window._bbContentsConfig.youtubeEndpoint`) | not committed |

- **Branch → release mapping**:
  - `develop` → `npm publish --tag test` (consumers: `@bebranded/bb-contents@test`)
  - `main` → `npm publish` (tag `latest`)
  - Current working branch: `refactor/modular-src` (the `src/` split).

## 6. Repository structure

```
.
├── src/                     # SOURCE OF TRUTH — edit here
│   ├── core.js              # bundle entry: config, init, MutationObserver, utils, BB_CONTENTS_VERSION
│   └── modules/             # one file per feature module (ES module default export)
│       ├── marquee.js
│       ├── share.js
│       ├── currentYear.js
│       ├── readingTime.js
│       ├── countrySelect.js
│       ├── favicon.js
│       └── youtube.js
├── build.js                 # esbuild build script (reads version from package.json)
├── bb-contents.js           # GENERATED IIFE bundle (unminified) — do not edit
├── bb-contents.min.js       # GENERATED IIFE bundle (minified) — do not edit
├── bb-contents.min.js.map   # GENERATED sourcemap — do not edit
├── youtube-worker.js        # Cloudflare Worker: YouTube feed proxy
├── docs/                    # one Markdown doc per module (public reference)
├── README.md                # public-facing library reference
├── PROJECT.md               # this file
└── .cursor/
    ├── rules/               # .mdc engineering rules (generic + bb-contents-core)
    └── skills/              # add-bb-module, bump-and-publish
```

- **Monorepo?**: No.
- **Generated / exempt files** (excluded from the 300-line and edit-by-hand rules):
  `bb-contents.js`, `bb-contents.min.js`, `bb-contents.min.js.map`. These are build
  outputs — change `src/` and run `npm run build` instead.

## 7. Data & source of truth

- **Application database**: none. The library is stateless; state lives in the DOM
  and per-element flags (`element.bbProcessed`, `data-bb-*-processed`).
- **External APIs**: YouTube Data, accessed **only** through the Cloudflare Worker
  proxy (`youtube-worker.js`) — the API key never reaches the browser. The `youtube`
  module fetches from `window._bbContentsConfig.youtubeEndpoint`.

### Business invariants

- **`src/` is the source of truth; `bb-contents.js` / `.min.js` are generated.**
  Never hand-edit the bundles; edit `src/` and rebuild.
- **The version string must be identical in 2 source places and propagates to the
  generated bundle**: `package.json` `version` and `src/core.js`
  `BB_CONTENTS_VERSION` must match; `build.js` injects `package.json.version` into
  the generated `@version` banner. A release where these diverge is invalid.
- **Every module is idempotent**: re-running `init()` on the same element must be a
  no-op (guarded by `element.bbProcessed`). The `MutationObserver` will re-call
  modules on new nodes.
- **No external runtime dependency may be added** — the zero-dependency footprint is
  a product guarantee.
- **All values inserted into the DOM must be sanitized** (see section on security
  helpers in `bb-contents-core.mdc`).

## 8. Public identifiers

| Key | Value |
|---|---|
| npm package | `@bebranded/bb-contents` |
| GitHub repo | `github.com/BeBranded-xyz/bb-contents` |
| Global object | `window.bbContents` |
| Config object | `window._bbContentsConfig` (e.g. `{ youtubeEndpoint }`) |
| Attribute prefix | `bb-` / `data-bb-` |
| Worker env vars | `YOUTUBE_API_KEY` (secret), `ALLOWED_ORIGINS` (comma-separated CORS allowlist) |

> No secrets here. The YouTube API key value lives only in the Cloudflare Worker's
> env (`YOUTUBE_API_KEY`). `ALLOWED_ORIGINS` must list the production origins before
> launch, otherwise the Worker stays open (`*`) — see [docs/youtube.md](docs/youtube.md).

## 9. Active rule modules

- [ ] `database` — not used (no DB).
- [ ] `auth` — not used (no authentication).
- [x] `integrations` — the Cloudflare YouTube Worker + third-party (YouTube) API.
- [ ] `observability` — no error tracker configured; the library logs via
  `console.error` through `utils.log`. Revisit if Sentry or similar is added.
- [ ] `graphify` — not used (no `graphify-out/`).

Always active: `project-identity`, `code-standards`, `security`, `github-workflow`,
plus the project-specific `bb-contents-core`.

## 10. Reference documents

| Doc | Purpose |
|---|---|
| `README.md` | Public library reference, architecture overview, module tables |
| `docs/*.md` | Per-module detailed documentation |
| `.cursor/rules/bb-contents-core.mdc` | Project-specific coding & module-contract rules |
| `.cursor/skills/add-bb-module/SKILL.md` | How to add a new module |
| `.cursor/skills/bump-and-publish/SKILL.md` | Release process |

## 11. Key architecture decisions

- **Single IIFE, zero dependencies**: must run on any Webflow page from one
  `<script>` tag without a bundler or imports on the consumer side.
- **Modular `src/` + esbuild bundle**: source is split one file per module for
  maintainability; esbuild bundles to a single self-executing IIFE so the public
  artifact stays a single file. (This is the `refactor/modular-src` work.)
- **Attribute-driven, lazy module init**: only modules whose attributes appear on
  the page run; unused code never executes. Keeps pages fast.
- **`MutationObserver` re-init**: required because Webflow injects DOM dynamically
  (CMS, interactions) after first paint.
- **YouTube via a Worker proxy**: keeps the API key server-side and adds caching/
  rate-limit control the browser cannot do safely.

## 12. External systems — do not assume undocumented behavior

Rely on official docs only; do not extrapolate:

- **Webflow** DOM injection timing and CMS rendering behavior (drives the init
  delay and `MutationObserver` design).
- **jsDelivr / npm** caching and `@latest` / `@test` tag resolution and propagation
  delay after publish.
- **YouTube Data API** quotas, rate limits, and response shape (consumed by the
  Worker).
- **Cloudflare Workers** runtime limits and caching semantics.
