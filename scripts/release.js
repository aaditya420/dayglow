'use strict';
// Tags and publishes a GitHub release for every dated version in CHANGELOG.md that has no tag yet.
// Runs on every push to main, so merging a `chore(release): X.Y.Z` pull request releases it.
// Usage (CI): GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/release.js [--dry-run]
const { execFileSync } = require('child_process');
const fs = require('fs');

// Versions released before this workflow existed, pinned to the commit each changelog section describes.
const HISTORICAL = Object.freeze({
  '1.0.0': 'a63ea0b38ed455dfde80db74b8b8b00cc286039a',
  '1.1.0': 'e85649fbac398b5cc3f7bbbab26e54db6130bced',
  '1.1.1': '2e8984e82570c338c10a089e6befe35bac0d31f7',
});

const HEADING = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})[ \t]*$/gm;

/** Dated release sections of a Keep a Changelog file, oldest first: [{ version, date, notes }]. */
function parseChangelog(text){
  const heads = [...text.matchAll(HEADING)];
  return heads.map(m => {
    const start = m.index + m[0].length;
    const rest = text.slice(start);
    const end = rest.search(/^## /m);
    return { version: m[1], date: m[2], notes: (end < 0 ? rest : rest.slice(0, end)).trim() };
  }).reverse();
}

/** The first commit on main's first-parent line whose package.json has `version`: the release pull request's merge. */
function bumpCommit(version, git){
  const shas = git(['log', '--first-parent', '--reverse', '--format=%H', 'HEAD']).split('\n').filter(Boolean);
  for (const sha of shas){
    let v;
    try { v = JSON.parse(git(['show', `${sha}:package.json`])).version; } catch { continue; }
    if (v === version) return sha;
  }
  return null;
}

/** Creates the tag and its GitHub release in one REST call. Resolves to the release's URL. */
async function createRelease({ repo, token, tag, target, title, notes, latest }, fetchImpl = fetch){
  const res = await fetchImpl(`https://api.github.com/repos/${repo}/releases`, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'dayglow-release',
    },
    body: JSON.stringify({ tag_name: tag, target_commitish: target, name: title, body: notes, make_latest: latest ? 'true' : 'false' }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return (await res.json()).html_url;
}

async function main(){
  const dry = process.argv.includes('--dry-run');
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo, GITHUB_STEP_SUMMARY: summary } = process.env;
  if (!dry && !(token && repo)) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY must be set.');
  const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const tags = new Set(git(['tag', '--list', 'v*']).split('\n').filter(Boolean));
  const releases = parseChangelog(fs.readFileSync('CHANGELOG.md', 'utf8'));
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  if (!releases.some(r => r.version === pkg)) console.log(`::warning::package.json is ${pkg} but CHANGELOG.md has no dated [${pkg}] section.`);
  const newest = releases.at(-1)?.version;
  let made = 0, failed = 0;
  for (const r of releases){
    const tag = `v${r.version}`;
    if (tags.has(tag)) continue;
    const target = HISTORICAL[r.version] || bumpCommit(r.version, git);
    if (!target){ console.log(`::warning::No commit on main sets package.json to ${r.version}; skipped ${tag}.`); continue; }
    console.log(`${dry ? 'Would release' : 'Releasing'} ${tag} at ${target.slice(0, 7)}`);
    made++;
    if (dry) continue;
    try {
      const url = await createRelease({ repo, token, tag, target, title: `Dayglow ${r.version}`,
        notes: r.notes || `Released ${r.date}.`, latest: r.version === newest });
      console.log(`  ${url}`);
      if (summary) fs.appendFileSync(summary, `- [${tag}](${url}) at \`${target.slice(0, 7)}\`\n`);
    } catch (err){
      failed++;
      // An annotation keeps the reason visible on the run page and in the checks API.
      console.log(`::error title=Release ${tag}::${String(err.message).replace(/\r?\n/g, ' ')}`);
    }
  }
  if (!made) console.log('Every dated version in CHANGELOG.md is already tagged.');
  if (failed) process.exitCode = 1;
}

if (require.main === module) main().catch(err => { console.log(`::error title=Release::${err.message}`); process.exitCode = 1; });
module.exports = { parseChangelog, bumpCommit, createRelease, HISTORICAL };
