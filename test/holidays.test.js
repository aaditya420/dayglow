'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadHolidays } = require('../src/holidays');

const IN = loadHolidays('IN');

test('looks up holidays by date', () => {
  assert.equal(IN.name(2026, 10, 8), 'Diwali');
  assert.equal(IN.name(2026, 10, 9), null);
  assert.ok(IN.isYearDay(2026, 0 + 25)); // 26 January
});

test('finds the next holiday', () => {
  assert.deepEqual(
    (({ name, days }) => ({ name, days }))(IN.next(2026, 9, 18)),
    { name: 'Dussehra', days: 2 });
  assert.equal(IN.next(2026, 9, 20).days, 0);
  assert.equal(IN.next(2030, 0, 1), null);
});

test('rejects unsafe or unknown calendar codes', () => {
  for (const code of ['../package', 'none', 'ZZ']){
    const cal = loadHolidays(code);
    assert.equal(cal.name(2026, 10, 8), null);
    assert.equal(cal.next(2026, 0, 1), null);
  }
});

test('holiday data is well formed', () => {
  const data = require('../data/holidays/IN.json');
  for (const [k, v] of Object.entries(data.dates)){
    assert.match(k, /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
    assert.ok(!Number.isNaN(new Date(k).getTime()), k);
    assert.equal(typeof v, 'string');
  }
});
