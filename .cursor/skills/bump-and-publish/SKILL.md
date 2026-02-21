---
name: bump-and-publish
description: Bump the version of bb-contents and publish to GitHub and npm. Use when the user asks to release, publish, bump the version, or push a new version of bb-contents.
---

# Bump Version & Publish

## Step 1 — Decide the new version

Follow semver:
- **Patch** `1.1.x` → bug fix, no new attribute
- **Minor** `1.x.0` → new module or new attribute
- **Major** `x.0.0` → breaking change

## Step 2 — Update version in 3 places

All three must be identical before any commit or publish.

| File | Location | Example |
|---|---|---|
| `package.json` | `"version": "..."` | `"version": "1.1.22"` |
| `bb-contents.js` | `const BB_CONTENTS_VERSION = '...'` (~line 13) | `'1.1.22'` |
| `bb-contents.js` | `@version ...` in JSDoc header (~line 4) | `@version 1.1.22` |

## Step 3 — Commit the version bump

```bash
git add package.json bb-contents.js
git commit -m "chore: bump version to X.X.X"
```

## Step 4 — Publish (choose target)

### develop / test release

```bash
git push origin develop
npm publish --tag test
```

Consumers install with: `npm install @bebranded/bb-contents@test`

### main / live release

```bash
git push origin main
npm publish
```

Consumers install with: `npm install @bebranded/bb-contents@latest`

## Checklist

- [ ] All 3 version references updated to the same value
- [ ] `git status` is clean before publishing
- [ ] Correct branch checked out (`develop` or `main`)
- [ ] `npm publish` uses correct tag (`--tag test` or omit for latest)
- [ ] Verify on jsDelivr CDN after publish: `https://cdn.jsdelivr.net/npm/@bebranded/bb-contents@X.X.X/bb-contents.js`
