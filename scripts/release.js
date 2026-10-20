'use strict';
// Tags and publishes a GitHub release for every dated version in CHANGELOG.md that has no tag yet.
// Runs on every push to main, so merging a `chore(release): X.Y.Z` pull request releases it.
// Usage (CI): GH_TOKEN=... node scripts/release.js [--dry-run]
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

function main(){
  const dry = process.argv.includes('--dry-run');
  const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const tags = new Set(git(['tag', '--list', 'v*']).split('\n').filter(Boolean));
  const releases = parseChangelog(fs.readFileSync('CHANGELOG.md', 'utf8'));
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  if (!releases.some(r => r.version === pkg)) console.log(`::warning::package.json is ${pkg} but CHANGELOG.md has no dated [${pkg}] section.`);
  const newest = releases.at(-1)?.version;
  let made = 0;
  for (const r of releases){
    const tag = `v${r.version}`;
    if (tags.has(tag)) continue;
    const target = HISTORICAL[r.version] || bumpCommit(r.version, git);
    if (!target){ console.log(`::warning::No commit on main sets package.json to ${r.version}; skipped ${tag}.`); continue; }
    console.log(`${dry ? 'Would release' : 'Releasing'} ${tag} at ${target.slice(0, 7)}`);
    made++;
    if (dry) continue;
    execFileSync('gh', ['release', 'create', tag, '--target', target, '--title', `Dayglow ${r.version}`,
      '--notes', r.notes || `Released ${r.date}.`, `--latest=${r.version === newest}`], { stdio: 'inherit' });
  }
  if (!made) console.log('Every dated version in CHANGELOG.md is already tagged.');
}

if (require.main === module) main();
module.exports = { parseChangelog, bumpCommit, HISTORICAL };
