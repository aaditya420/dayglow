'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkHeader } = require('../scripts/check-commits');

test('accepts Conventional Commit headers', () => {
  for (const h of [
    'feat: add aurora palette for winter',
    'fix(tide): keep the waterline above the calendar',
    'feat(api)!: drop the /home.png path',
    'chore(deps): bump eslint from 10.12.0 to 10.13.0',
    'chore(deps-dev): bump the dev-dependencies group with 2 updates',
    'ci(deps): bump actions/checkout from 4 to 7',
    'chore(release): 1.2.0',
  ]) assert.equal(checkHeader(h), null, h);
});

test('rejects headers that are not Conventional Commits', () => {
  for (const h of [
    '',
    'Add aurora palette',
    'feature: add aurora palette',
    'feat:add aurora palette',
    'feat(Tide): capital scope',
    'fix: trailing period.',
    'fixup! feat: something',
    `feat: ${'x'.repeat(100)}`,
  ]) assert.notEqual(checkHeader(h), null, h);
});
