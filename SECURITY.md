# Security policy

## Supported versions

Only the latest release on `main` receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Include what you found, how to reproduce it, and the impact you expect. You should get a reply within 7 days, and a fix or mitigation plan within 30 days for confirmed issues. Reporters are credited in the release notes unless they ask not to be.

## Scope

In scope:

- The wallpaper function (`api/`, `src/`), for example input that crashes it, exhausts memory or time, reads files outside `data/`, or reflects untrusted content in responses.
- The GitHub Actions workflows, for example anything that could expose repository secrets.

Out of scope:

- Rate limiting and abuse protection of individual deployments. These are configured per project in Vercel (Firewall and Deployment Protection).
- Vulnerabilities in third-party services such as Vercel or Open-Meteo. Report those to the vendor.

## How the project handles secrets

- The code needs no secrets to run. Weather data comes from a keyless public API.
- Deployment credentials (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) live only in GitHub Actions secrets and are never committed. Pull requests from forks do not receive them.
- `.env` files are ignored by git. Only `.env.example`, which contains no secrets, is tracked.
- If you think a credential was exposed, rotate it immediately in Vercel and then report it as above.
