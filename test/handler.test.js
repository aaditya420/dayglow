'use strict';
process.env.WALLPAPER_OFFLINE = '1';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const handler = require('../api/wallpaper');

// A stand-in for Node's ServerResponse that validates headers the way the real one does.
function call(method, url, { failOn } = {}){
  return new Promise(resolve => {
    const headers = {};
    const res = {
      statusCode: 200,
      headersSent: false,
      setHeader: (k, v) => {
        if (k === failOn) throw new Error(`simulated failure setting ${k}`);
        http.validateHeaderName(k); http.validateHeaderValue(k, v);
        headers[k.toLowerCase()] = v;
      },
      getHeaderNames: () => Object.keys(headers),
      removeHeader: k => { delete headers[k.toLowerCase()]; },
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

test('values the header cannot carry still return an image', async () => {
  for (const q of ['style=%F0%9F%98%80', 'view=%E2%9C%A8', 'style=a%0D%0AX-Evil:1', 'palette=%00']){
    const r = await call('GET', `/api/wallpaper?w=300&h=650&seed=1&${q}`);
    assert.equal(r.status, 200, q);
    assert.equal(r.headers['content-type'], 'image/png', q);
    assert.match(r.headers['x-wallpaper-warning'], /^[\x20-\x7e]+$/, q);
  }
});

test('an error after headers are set returns a clean 500', async () => {
  const r = await call('GET', '/api/wallpaper?w=300&h=650&seed=1', { failOn: 'X-Wallpaper-Style' });
  assert.equal(r.status, 500);
  assert.equal(r.headers['content-type'], 'text/plain; charset=utf-8');
  assert.equal(r.headers['content-length'], undefined);
  assert.equal(r.headers['content-disposition'], undefined);
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
});
