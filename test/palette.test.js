'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pickPalette, hourPalette, PALETTES, hexToRgb } = require('../src/core');

const at = (iso) => new Date(`${iso}Z`); // wall-clock time in UTC fields, as src/time.js stores it
const luminance = hex => hexToRgb(hex)
  .map(v => { v /= 255; return v <= 0.04045 ? v/12.92 : ((v + 0.055)/1.055) ** 2.4; })
  .reduce((s, v, i) => s + v*[0.2126, 0.7152, 0.0722][i], 0);
const HEX = /^#[0-9a-f]{6}$/;

test('auto palette with tod follows the hour, not the season', () => {
  for (const hh of ['03', '09', '12', '17', '21']){
    const jan = pickPalette('auto', null, at(`2026-01-15T${hh}:00:00`), true);
    const jul = pickPalette('auto', null, at(`2026-07-15T${hh}:00:00`), true);
    assert.deepEqual(jan, jul, `${hh}:00`);
    assert.deepEqual(jan, hourPalette(Number(hh)));
  }
});

test('every hour has its own palette and brightness', () => {
  const pals = [...Array(24).keys()].map(hourPalette);
  for (const [h, p] of pals.entries()){
    for (const c of [p.bg0, p.bg1, p.accent, ...p.inks]) assert.match(c, HEX, `${h}:00`);
    assert.ok(p.name, `${h}:00 has a name`);
    const prev = pals[(h + 23) % 24];
    assert.notEqual(luminance(p.bg0), luminance(prev.bg0), `${h}:00 differs from the hour before`);
  }
});

test('brightness rises from the small hours to noon and falls back', () => {
  const lum = h => luminance(hourPalette(h % 24).bg0);
  for (let h = 3; h < 12; h++) assert.ok(lum(h + 1) > lum(h), `${h + 1}:00 brighter than ${h}:00`);
  for (let h = 12; h < 27; h++) assert.ok(lum(h + 1) < lum(h), `${(h + 1) % 24}:00 darker than ${h % 24}:00`);
});

test('the scrim colour stays dark at every hour', () => {
  for (let h = 0; h < 24; h++) assert.ok(luminance(hourPalette(h).bg1) < 0.02, `${h}:00`);
});

test('tod=0 keeps the seasonal palette; named palettes ignore the hour', () => {
  assert.equal(pickPalette('auto', null, at('2026-07-15T12:00:00'), false), PALETTES.forest);
  assert.equal(pickPalette('auto', null, at('2026-01-15T03:00:00'), false), PALETTES.violet);
  assert.equal(pickPalette('ocean', null, at('2026-07-15T03:00:00'), true), PALETTES.ocean);
});
