'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseOptions, LIMITS } = require('../src/options');

const at = new Date('2026-10-18T03:30:00Z'); // 09:00 in India
const parse = (qs, env = {}) => parseOptions(new URLSearchParams(qs), env, at);

test('defaults', () => {
  const o = parse('');
  assert.equal(o.style, 'shapes');
  assert.equal(o.view, 'month');
  assert.equal(o.palette, 'auto');
  assert.equal(o.format, 'png');
  assert.equal(o.screen, 'lock');
  assert.equal(o.tz, 'Asia/Kolkata');
  assert.equal(o.tzOffsetMin, 330);
  assert.equal(o.now.toISOString(), '2026-10-18T09:00:00.000Z');
  assert.deepEqual([o.w, o.h], [1179, 2556]);
  assert.deepEqual(o.warnings, []);
});

test('unknown values fall back with a warning', () => {
  const o = parse('style=nope&view=sideways&palette=neon&screen=watch');
  assert.equal(o.style, 'shapes');
  assert.equal(o.view, 'month');
  assert.equal(o.palette, 'auto');
  assert.equal(o.screen, 'lock');
  assert.equal(o.warnings.length, 4);
});

test('screen option', () => {
  assert.equal(parse('').screen, 'lock');
  assert.equal(parse('screen=HOME').screen, 'home');
});

test('sizes and coordinates are clamped', () => {
  const o = parse('w=99999&h=1&lat=200&lon=-999&scrim=7');
  assert.deepEqual([o.w, o.h], [LIMITS.maxW, LIMITS.minH]);
  assert.deepEqual([o.lat, o.lon, o.scrim], [90, -180, 1]);
});

test('date override, including invalid dates', () => {
  assert.equal(parse('date=2026-11-08T21:30').now.toISOString(), '2026-11-08T21:30:00.000Z');
  assert.equal(parse('date=2026-11-08').now.toISOString(), '2026-11-08T09:00:00.000Z');
  assert.equal(parse('date=2026-02-31').dateOverride, false);
  assert.equal(parse('date=tomorrow').dateOverride, false);
});

test('environment defaults and bad time zones', () => {
  const o = parse('tz=Not/AZone', { WALLPAPER_TZ: 'Europe/London', WALLPAPER_LAT: '51.5', WALLPAPER_LON: '-0.12', WALLPAPER_HOLIDAYS: 'none' });
  assert.equal(o.tz, 'Europe/London');
  assert.deepEqual([o.lat, o.lon, o.holidays], [51.5, -0.12, 'none']);
});

test('seed is length-limited and flags parse', () => {
  const o = parse(`seed=${'x'.repeat(500)}&label=yes&festive=off&tod=0&format=JPG`);
  assert.equal(o.seed.length, LIMITS.seedLength);
  assert.deepEqual([o.label, o.festive, o.tod, o.format], [true, false, false, 'jpeg']);
});
