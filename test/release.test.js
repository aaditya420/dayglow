'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseChangelog, bumpCommit, createRelease, HISTORICAL } = require('../scripts/release');

const CHANGELOG = `# Changelog

Intro text.

## [Unreleased]

### Fixed

- Not released yet.

## [1.1.0] - 2026-10-18

### Added

- Home screen layout.

## [1.0.0] - 2026-10-18

### Added

- First release.
`;

test('reads dated sections oldest first and skips Unreleased', () => {
  const r = parseChangelog(CHANGELOG);
  assert.deepEqual(r.map(x => x.version), ['1.0.0', '1.1.0']);
  assert.equal(r[1].date, '2026-10-18');
  assert.equal(r[1].notes, '### Added\n\n- Home screen layout.');
  assert.equal(r[0].notes, '### Added\n\n- First release.');
});

test('ignores headings that are not dated versions', () => {
  assert.deepEqual(parseChangelog('## [Unreleased]\n\n## [2.0.0-beta] - 2026-01-01\n\n## Notes\n'), []);
});

test('finds the first first-parent commit where package.json takes a version', () => {
  // newest first, as git log prints it
  const history = [['d4', '1.2.0'], ['c3', '1.2.0'], ['b2', '1.1.0'], ['a1', '1.0.0']];
  const git = args => {
    if (args[0] === 'log') return history.map(([sha]) => sha).reverse().join('\n');
    const sha = args[1].split(':')[0];
    return JSON.stringify({ version: history.find(([s]) => s === sha)[1] });
  };
  assert.equal(bumpCommit('1.2.0', git), 'c3');
  assert.equal(bumpCommit('1.0.0', git), 'a1');
  assert.equal(bumpCommit('9.9.9', git), null);
});

test('creates a release through the REST API with the tag, commit and notes', async () => {
  let call;
  const fetchStub = async (url, init) => { call = { url, init }; return { ok: true, status: 201, json: async () => ({ html_url: 'https://github.com/o/r/releases/tag/v1.2.0' }) }; };
  const url = await createRelease({ repo: 'o/r', token: 't0k', tag: 'v1.2.0', target: 'bf18603', title: 'Dayglow 1.2.0', notes: '### Fixed', latest: true }, fetchStub);
  assert.equal(url, 'https://github.com/o/r/releases/tag/v1.2.0');
  assert.equal(call.url, 'https://api.github.com/repos/o/r/releases');
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers.authorization, 'Bearer t0k');
  assert.deepEqual(JSON.parse(call.init.body), { tag_name: 'v1.2.0', target_commitish: 'bf18603', name: 'Dayglow 1.2.0', body: '### Fixed', make_latest: 'true' });
});

test('a refused release reports the status and GitHub message', async () => {
  const fetchStub = async () => ({ ok: false, status: 403, text: async () => '{"message":"Resource not accessible by integration"}' });
  await assert.rejects(createRelease({ repo: 'o/r', token: 't', tag: 'v1.0.0', target: 'a1', title: 'x', notes: 'y', latest: false }, fetchStub),
    /403.*Resource not accessible by integration/);
});

test('historical pins avoid commits that change workflow files', t => {
  // The job's GITHUB_TOKEN is refused (403) when it tags a commit that edits .github/workflows.
  const { execFileSync } = require('node:child_process');
  const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  for (const [version, sha] of Object.entries(HISTORICAL)){
    let files;
    try { files = git(['show', '--format=', '--name-only', '--first-parent', sha]); } catch { t.diagnostic(`${sha} not in this clone; skipped`); continue; }
    assert.ok(!/^\.github\/workflows\//m.test(files), `v${version} at ${sha.slice(0, 7)} changes workflow files`);
    assert.equal(JSON.parse(git(['show', `${sha}:package.json`])).version, version);
  }
});
