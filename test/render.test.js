'use strict';
process.env.WALLPAPER_OFFLINE = '1';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseOptions } = require('../src/options');
const { render, resolveSeed } = require('../src/render');
const { STYLE_IDS } = require('../src/styles');

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const at = new Date('2026-10-18T03:30:00Z');
const opts = qs => parseOptions(new URLSearchParams(`w=300&h=650&${qs}`), {}, at);

for (const style of STYLE_IDS){
  test(`style "${style}" renders in every view`, async () => {
    for (const view of ['month', 'year', 'none']){
      const out = await render(opts(`style=${style}&view=${view}&seed=7&label=1`));
      assert.ok(out.body.subarray(0, 4).equals(PNG), `${style}/${view} is a PNG`);
      assert.equal(out.style, style);
    }
  });
}

test('home screen layout renders every view, including six-row months', async () => {
  for (const view of ['month', 'year', 'none']){
    for (const date of ['2026-10-18', '2026-08-20']){
      const out = await render(opts(`style=garden&screen=home&view=${view}&date=${date}&seed=3&label=1`));
      assert.ok(out.body.subarray(0, 4).equals(PNG), `${view} ${date}`);
    }
  }
});

test('lock and home share the art for the same seed', async () => {
  const lock = await render(opts('style=gallery&seed=4321'));
  const home = await render(opts('style=gallery&seed=4321&screen=home'));
  assert.equal(home.style, lock.style);
  assert.equal(home.palette, lock.palette);
  assert.ok(!home.body.equals(lock.body)); // same art, calendar in a different place
});

test('a pinned seed is reproducible; random pulls differ', async () => {
  const a = await render(opts('style=flow&seed=123'));
  const b = await render(opts('style=flow&seed=123'));
  assert.ok(a.body.equals(b.body));
  assert.equal(a.deterministic, true);
  const seeds = new Set();
  for (let i = 0; i < 5; i++) seeds.add((await render(opts('style=shapes'))).seed);
  assert.ok(seeds.size > 1);
});

test('gallery picks a real style and is reproducible with a seed', async () => {
  const a = await render(opts('style=gallery&seed=99'));
  assert.ok(STYLE_IDS.includes(a.style));
  assert.equal((await render(opts('style=gallery&seed=99'))).style, a.style);
});

test('seed modes', () => {
  const cal = { y: 2026, m: 9, d: 18 };
  assert.equal(resolveSeed('daily', cal, 9), resolveSeed('daily', cal, 20));
  assert.notEqual(resolveSeed('hourly', cal, 9), resolveSeed('hourly', cal, 10));
  assert.equal(resolveSeed('42', cal, 0), 42);
  assert.equal(resolveSeed('sunset', cal, 0), resolveSeed('sunset', cal, 5));
});

test('festive days and other formats render', async () => {
  for (const date of ['2026-11-08', '2027-03-23', '2027-08-15', '2026-12-25', '2027-03-10', '2026-10-02']){
    const out = await render(opts(`style=kolam&date=${date}&seed=1`));
    assert.ok(out.body.length > 1000, date);
  }
  const jpg = await render(opts('format=jpg&seed=1'));
  assert.deepEqual([...jpg.body.subarray(0, 2)], [0xff, 0xd8]);
});
