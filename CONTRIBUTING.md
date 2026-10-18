# Contributing to Dayglow

Thanks for helping. Bug reports, new art styles, holiday calendars, docs and fixes are all welcome.

## Getting set up

```sh
git clone https://github.com/<you>/dayglow.git
cd dayglow
npm install
npm run check      # lint + tests, must pass before a pull request
npm run preview    # renders every style into previews/
```

Use Node.js 22 (see `.nvmrc`). Tests run offline; set `WALLPAPER_OFFLINE=1` yourself when previewing without network.

## Adding an art style

1. Create `src/styles/<id>.js`. Export `{ id, name, render }`, where `render(ctx, W, H, R, P, I)`:
   - `ctx` is a 2D canvas context of `W` × `H` pixels.
   - `R()` is the seeded random generator. Use it for every random choice so a pinned seed reproduces the image. Never use `Math.random()`.
   - `P` is the palette (`bg0`, `bg1`, `inks[0..3]`, `accent`).
   - `I` holds the date and context: `y`, `m`, `d`, `doy`, `total`, `dim`, `week`, `monthProg`, `zone`, `horizon`, `lat`, `lon`, `isHoliday(i)`, `todayHoliday` and more (see `src/render.js`).
   - Return an optional short string for the caption.
2. Register it in `src/styles/index.js`.
3. Keep the area in `I.zone` calm. The calendar is drawn there.
4. Keep render time under about one second at 1179 × 2556. For per-pixel work, draw on a low-resolution canvas (`lowres`) and upscale it (`blit`).
5. Run `npm run preview` and attach a screenshot of the new style to your pull request. The render tests pick up new styles automatically.

## Adding a holiday calendar

Add `data/holidays/<ISO country code>.json`:

```json
{
  "country": "GB",
  "name": "United Kingdom — bank holidays (England and Wales)",
  "source": "where the dates came from",
  "dates": { "2026-12-25": "Christmas Day" }
}
```

Cite an official source in `source`. Dates use `YYYY-MM-DD`.

## Pull requests

- Keep each pull request focused on one change and describe what it does and why.
- Add or update tests for behaviour changes.
- Make sure `npm run check` passes. CI runs the same checks.
- Write commit messages and the pull request title as [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), for example `feat(aurora): add a winter palette` or `fix(tide): keep the waterline above the calendar`. CI checks them. Pull requests are squash-merged, so the title becomes the commit on `main`.
- Add a line under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) for user-visible changes. Versions follow [Semantic Versioning](https://semver.org/); see [CLAUDE.md](CLAUDE.md) for what counts as major, minor and patch.
- By contributing you agree that your work is released under the [MIT License](LICENSE).

## Reporting bugs

Open an issue with the exact URL you requested (remove anything private), what you expected and what you got. The `X-Wallpaper-*` response headers and the `label=1` caption help a lot. For security issues, follow [SECURITY.md](SECURITY.md) instead.
