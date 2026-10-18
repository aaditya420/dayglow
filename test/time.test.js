'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nowIn, isoWeek, calendar, dayKey, isValidTimeZone } = require('../src/time');

test('nowIn returns the wall-clock time of a zone', () => {
  const t = nowIn('Asia/Kolkata', new Date('2026-10-18T18:45:00Z'));
  assert.equal(t.toISOString(), '2026-10-19T00:15:00.000Z'); // already tomorrow in India
});

test('isoWeek matches ISO 8601', () => {
  assert.equal(isoWeek(new Date(Date.UTC(2026, 9, 18))), 42);
  assert.equal(isoWeek(new Date(Date.UTC(2027, 0, 1))), 53); // Friday belongs to 2026-W53
  assert.equal(isoWeek(new Date(Date.UTC(2027, 0, 4))), 1);
});

test('calendar facts', () => {
  const c = calendar(new Date(Date.UTC(2026, 9, 18, 9)));
  assert.deepEqual([c.doy, c.total, c.dim, c.weekday], [291, 365, 31, 6]);
  assert.equal(calendar(new Date(Date.UTC(2028, 1, 29))).total, 366);
});

test('dayKey normalises overflowing days', () => {
  assert.equal(dayKey(2026, 9, 35), '2026-11-04');
});

test('time zone validation', () => {
  assert.ok(isValidTimeZone('Europe/London'));
  assert.ok(!isValidTimeZone('Mars/Olympus'));
  assert.ok(!isValidTimeZone(undefined));
});
