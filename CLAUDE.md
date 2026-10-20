# CLAUDE.md

Instructions for Claude (and any other coding agent) working in this repository. They are requirements, not suggestions. When a request conflicts with them, say so and ask before going ahead.

## What this is

Dayglow is one Vercel serverless function (`api/wallpaper.js`) that renders an iPhone wallpaper with `@napi-rs/canvas`. Procedural art sits on top, and a month, week or year calendar sits below the clock. It has no database and no API keys. Everything is driven by query parameters, which are documented in README.md.

```
api/wallpaper.js     HTTP handler: method check, caching headers, errors
src/options.js       query parsing, defaults, limits, warnings
src/render.js        pipeline: palette, art, scrim, calendar, caption, encode
src/overlays.js      calendar views, scrim, festivals, caption, LAYOUTS per screen
src/styles/          one file per art style, registered in index.js
src/core.js          seeded RNG, noise, palettes, drawing primitives
src/time.js          time zone and calendar helpers (wall-clock dates in UTC fields)
src/holidays.js      holiday calendars from data/holidays/<CODE>.json
src/weather.js       Open-Meteo client with a 15-minute cache
test/                node:test suites
scripts/             preview renderer, commit checker
```

## Commands

```sh
npm ci                 # install exactly what package-lock.json says
npm run check          # lint + tests: must pass before every commit
npm run preview        # render every style to previews/ plus a contact sheet
npm run preview -- "screen=home&view=year"   # extra query for every render
```

Use Node.js 22 (`.nvmrc`). Set `WALLPAPER_OFFLINE=1` to skip network calls. The tests already run offline.

## Engineering rules

### Security

- Never commit credentials, tokens, `.env` files, personal email addresses, or Vercel team or project IDs. Deploy credentials live only in GitHub Actions secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
- If a secret is pasted into a conversation, don't use it or store it. Tell the user to revoke it.
- Commit as the GitHub noreply address, never a personal email.
- Treat every query parameter as hostile. Parse it in `src/options.js`, clamp it to `LIMITS`, and fall back to the default with an entry in `warnings`. Never throw on bad input, and never pass raw input to the file system, shell or `eval`.
- Network calls stay limited to Open-Meteo, with a timeout and a fallback. Don't add outbound calls that need keys.
- Keep workflow permissions read-only by default. Never expose secrets to `pull_request` runs from forks. Use only GitHub-owned actions, pinned to a major version.
- Don't change repository settings, branch rules, Vercel protection or domains unless the user asks.

### Determinism

- Styles take every random choice from `R()`. Never use `Math.random()`, `Date.now()` or `new Date()` inside a style; time comes from `I.now`. The same seed, date and parameters must produce byte-identical output, because pinned seeds and lock and home matching depend on it.
- Wall-clock dates are stored in UTC fields (`src/time.js`). Use the `getUTC*` methods and the `D()` helper, never local-time methods.

### Layout

- All positions are fractions of the image height or width, never fixed pixels. Images go up to 2000 × 4400.
- Calendar placement and the art boundary come from `LAYOUTS` in `src/overlays.js`, chosen with `screen`. Don't hard-code a y position that duplicates a layout value.
- Styles with a ground line end at `I.horizon`, and nothing structural is drawn inside `I.zone`, where the calendar sits.
- Check every visual change on both `screen=lock` and `screen=home`, and for both `view=month` and `view=year`, with `npm run preview`. Look at the images before calling the change done.

### Performance

- A full-size render stays under about one second. For per-pixel work, render on a low-resolution canvas (`lowres`) and scale it up (`blit`).
- Load data and fonts once at module scope or lazily, never once per request.
- Random pulls are sent as `no-store`. Pinned seeds can be cached until the next hour. Keep that split.

### Code

- CommonJS with `'use strict'`, and no build step. Follow `.editorconfig` and `eslint.config.js`. Never add `eslint-disable` to get past a rule; fix the code.
- Keep changes small and focused, and match the style of the code around them.
- Add a dependency only when it clearly earns its place. Pin exact versions and update `THIRD_PARTY_NOTICES.md`. Any runtime data file the function reads must be listed in `vercel.json` → `includeFiles`.
- New styles follow "Adding an art style" in CONTRIBUTING.md and are registered in `src/styles/index.js`.

### Tests and docs

- Every behaviour change or bug fix comes with a test that fails without it. Run `npm run check` before every commit.
- Update README.md in the same pull request whenever a parameter, path, default, style or environment variable changes.
- Add a line under `## [Unreleased]` in CHANGELOG.md for every user-visible change, following Keep a Changelog.

## Commits and pull requests

### Branches and pull requests

- Never push to `main`. Every change goes through a pull request, and the code owner's review is required to merge.
- Name branches `<type>/<short-description>`, for example `fix/tide-horizon` or `feat/home-countdown`.
- Use one pull request per logical change. Unrelated fixes, refactors, dependency bumps and docs go in separate pull requests, even when they are found together.
- Fill in the pull request template. Say what changed, why, and how it was checked; include screenshots for visual changes.
- Pull requests are squash-merged, so the pull request title becomes the commit on `main` and must itself be a Conventional Commit.

### Conventional Commits

Commit messages and pull request titles follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). CI checks them with `scripts/check-commits.js`.

```
<type>(<scope>)!: <subject>

<body: what and why, wrapped at 72>

BREAKING CHANGE: <what breaks and how to migrate>
Refs: #12
```

| Type | Use for | Release |
| --- | --- | --- |
| `feat` | a new parameter, value, style, path or behaviour | minor |
| `fix` | a bug fix, including visual fixes | patch |
| `perf` | faster or lighter with the same output | patch |
| `refactor` | a code change with no behaviour change | none |
| `docs` | README, CLAUDE.md, comments | none |
| `test` | tests only | none |
| `build` | dependencies, package.json, vercel.json | patch if runtime |
| `ci` | workflows, Dependabot, CodeQL | none |
| `chore` | maintenance, releases, dependency bumps | none |
| `style` | formatting only | none |
| `revert` | reverting an earlier commit | depends |

- The scope is optional, written in lowercase, and names the area: a style id (`tide`, `sky`), or `api`, `options`, `overlays`, `layout`, `holidays`, `weather`, `deps`, `release`.
- The subject is imperative and lowercase, with no trailing period, and the whole header is at most 72 characters (CI allows up to 100 for Dependabot).
- A breaking change gets `!` after the type or scope and a `BREAKING CHANGE:` footer.
- Every commit must pass `npm run check` on its own. Don't leave `fixup!` or `WIP` commits in a pull request.

## Versioning and releases

The project follows [Semantic Versioning 2.0.0](https://semver.org/). The public API is everything a Shortcut or self-hoster relies on: URL paths, query parameters and their values, defaults, response headers (`X-Wallpaper-*`, `Cache-Control`), environment variables, and the holiday data format.

- **MAJOR:** removing or renaming a path, parameter, value, header or environment variable; changing a default so that existing URLs produce a different kind of result; or changing the holiday file format.
- **MINOR:** a new style, parameter, value, path, screen layout or holiday calendar, added in a backward-compatible way.
- **PATCH:** bug fixes, visual corrections, performance work and dependency updates that change no contract.

A changed look for a pinned seed is not breaking on its own, but note it in the changelog.

To cut a release, in its own pull request titled `chore(release): X.Y.Z`:

1. Choose the version from the commits since the last tag. Any `!` means major, any `feat` means minor, otherwise patch.
2. Run `npm version X.Y.Z --no-git-tag-version`, which updates `package.json` and `package-lock.json`.
3. In CHANGELOG.md, move `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` and start a new, empty Unreleased section.
4. After the pull request is merged, the Release workflow (`.github/workflows/release.yml`) tags the merge commit `vX.Y.Z` and publishes a GitHub release with that changelog section. Check that its run succeeded.

## Deploys

- CI deploys `main` to production and same-repository pull requests to preview, once the Vercel secrets are set. A direct deploy from an agent happens only when the user asks, and must come from committed code.
- After any production deploy, fetch a pinned URL (for example `/month.png?style=arcade&seed=4242&date=2026-10-18T22:00`) and confirm it returns an image that matches a local render.
