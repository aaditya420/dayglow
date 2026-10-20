'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseChangelog, bumpCommit } = require('../scripts/release');

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
