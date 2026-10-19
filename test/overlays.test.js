'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createCanvas } = require('@napi-rs/canvas');
const { hourPalette, hexToRgb } = require('../src/core');
const { C, LAYOUTS, scrim } = require('../src/overlays');

const S = 0.85; // default scrim strength
const lin = v => { v /= 255; return v <= 0.04045 ? v/12.92 : ((v + 0.055)/1.055) ** 2.4; };
const luminance = rgb => rgb.map(lin).reduce((s, v, i) => s + v*[0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05)/(y + 0.05); };
/** What sits behind the calendar text: the palette's brightest background under the full scrim. */
function backdrop(P){
  const bg = hexToRgb(P.bg0), shade = hexToRgb(P.bg1), a = 0.78*S;
  return bg.map((v, i) => v*(1 - 0.16*S)*(1 - a) + shade[i]*a);
}

test('calendar text stays readable on the scrim at every hour', () => {
  const colours = { text: C.text, past: C.past, upcoming: C.futureText, labels: C.dim, holiday: C.holiday, today: C.today };
  for (let h = 0; h < 24; h++){
    const back = backdrop(hourPalette(h));
    for (const [name, hex] of Object.entries(colours)){
      const ratio = contrast(hexToRgb(hex), back);
      assert.ok(ratio >= 4.5, `${name} at ${h}:00 has contrast ${ratio.toFixed(2)}`);
    }
  }
});

test('the scrim fades in gradually instead of starting at a hard edge', () => {
  const W = 20, H = 1000, zone = LAYOUTS.lock.zones.month, P = { bg1: '#000000' };
  const ctx = createCanvas(W, H).getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  scrim(ctx, W, H, P, zone, S);
  const px = ctx.getImageData(W/2, 0, 1, H).data, at = y => px[Math.round(y)*4];
  const base = 255*(1 - 0.16*S), full = at(zone[0]*H + 5), y0 = zone[0]*H;
  assert.ok(full < base*0.4, 'the zone is fully darkened');
  // part of the way through the fade 0.1 H above the zone, untouched 0.25 H above it
  const mid = (base - at(y0 - H*0.1))/(base - full);
  assert.ok(mid > 0.1 && mid < 0.9, `0.1 H above the zone the fade is ${mid.toFixed(2)} of the way in`);
  assert.ok(Math.abs(at(y0 - H*0.25) - base) <= 1, 'nothing changes well above the zone');
  // smoothstep: the first rows of the fade barely change, so there is no visible line where it starts
  const start = y0 - H*0.2;
  assert.ok(base - at(start + H*0.01) <= 2, 'the fade starts with a gentle slope');
});
