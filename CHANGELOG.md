# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- A release workflow tags each dated version in the changelog once it reaches `main` and publishes its GitHub release with those notes. Its first runs backfilled tags for v1.0.0 to v1.2.0.

## [1.2.0] - 2026-10-20

### Fixed

- Unknown `style`, `view`, `palette` or `screen` values with emoji, accented or control characters (for example `?style=😀`) no longer fail the request. The warning header now quotes them in plain ASCII, and an error response no longer keeps the image's length and file name headers.
- Calendar text is brighter and has a soft shadow, so upcoming days, labels and the year view's future symbols stay readable over the dark band at every hour (upcoming days went from about 2:1 to at least 6:1 contrast).
- The dark band behind the calendar fades in and out along a smooth curve over a longer distance, so its edge no longer shows as a line across the art.

### Added

- CLAUDE.md with the project's engineering, commit and release rules.
- CI checks that pull request titles and commits follow Conventional Commits; Dependabot now writes `chore(deps)` and `ci(deps)` messages.

### Changed

- `palette=auto` with `tod=1` (the default) now colours every hour of the day differently, darkest around 3 AM and brightest at noon, instead of falling back to the season's palette during the day. Use `tod=0` for the seasonal palettes. Pinned seeds keep their art but take the colours of the hour.

## [1.1.1] - 2026-10-18

### Fixed

- Ground-line styles (arcade, city, garden, tide, sky) now end at the bottom of the clock on the lock screen and at the bottom of a widget row on the home screen, leaving a gap above the calendar instead of touching its header.

### Removed

- The `/home.png` and `/home-year.png` paths. Add `screen=home` to any URL instead, e.g. `/month.png?screen=home`.

## [1.1.0] - 2026-10-18

### Added

- `screen=home` layout, with `/home.png` and `/home-year.png` shortcuts. The calendar sits between a row of widgets and the page dots, and the footer and caption are left out because the dock covers them.
- README steps for matching lock and home screens with a shared seed.

## [1.0.0] - 2026-10-18

### Added

- Wallpaper API with month + week and year views, and an art-only view.
- 17 procedural styles, including a real night sky, a moon-driven tide and live weather.
- Random, daily, hourly and pinned seeds; curated palettes with season and time-of-day modes.
- India's gazetted holidays for 2026–2027 with a next-holiday countdown and festive decorations.
- PNG, JPEG and WebP output.
- Tests, linting, CI/CD to Vercel through GitHub Actions, CodeQL and Dependabot.
