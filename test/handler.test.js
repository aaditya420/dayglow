'use strict';
process.env.WALLPAPER_OFFLINE = '1';
const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/wallpaper');

function call(method, url){
  return new Promise(resolve => {
    const headers = {};
    const res = {
      statusCode: 200,
      setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
      end: body => resolve({ status: res.statusCode, headers, body }),
    };
    handler({ method, url }, res);
  });
}

test('GET returns an image with headers', async () => {
  const r = await call('GET', '/api/wallpaper?w=300&h=650&style=topo&seed=5');
  assert.equal(r.status, 200);
  assert.equal(r.headers['content-type'], 'image/png');
  assert.equal(r.headers['x-wallpaper-style'], 'topo');
  assert.match(r.headers['cache-control'], /s-maxage=/);
  assert.equal(Number(r.headers['content-length']), r.body.length);
});

test('random pulls are never cached', async () => {
  const r = await call('GET', '/api/wallpaper?w=300&h=650');
  assert.match(r.headers['cache-control'], /no-store/);
});

test('HEAD has no body; other methods are rejected', async () => {
  const head = await call('HEAD', '/api/wallpaper?w=300&h=650&seed=1');
  assert.equal(head.status, 200);
  assert.equal(head.body, undefined);
  const post = await call('POST', '/api/wallpaper');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

test('warnings are reported in a header', async () => {
  const r = await call('GET', '/api/wallpaper?w=300&h=650&style=bogus&seed=1');
  assert.match(r.headers['x-wallpaper-warning'], /unknown style/);
});
