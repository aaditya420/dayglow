'use strict';
// Shared helpers: seeded randomness, noise, palettes, drawing primitives.
const TAU = Math.PI * 2;

/** Mulberry32: tiny, fast, seedable PRNG returning floats in [0, 1). */
function rng(seed){
  let s = seed >>> 0;
  return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
/** Unbiased Fisher–Yates shuffle of 0..n-1 driven by a seeded RNG. */
function shuffle(R, n){
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--){ const j = Math.floor(R()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** 32-bit FNV-1a hash, used to turn text seeds into numbers. */
function hash(str){ let h = 2166136261; for (const c of String(str)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// Seeded 2D Perlin noise in roughly [-1, 1]
function makeNoise(R){
  const p = new Uint8Array(512), perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--){ const j = Math.floor(R() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = t => t*t*t*(t*(t*6 - 15) + 10);
  const grad = (h, x, y) => { switch (h & 7){ case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } };
  function n2(x, y){
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y), a = p[X] + Y, b = p[X + 1] + Y;
    const l1 = grad(p[a], x, y) + u * (grad(p[b], x - 1, y) - grad(p[a], x, y));
    const l2 = grad(p[a + 1], x, y - 1) + u * (grad(p[b + 1], x - 1, y - 1) - grad(p[a + 1], x, y - 1));
    return (l1 + v * (l2 - l1)) * 0.95;
  }
  n2.fbm = (x, y, oct = 4) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++){ s += a * n2(x * f, y * f); n += a; a *= 0.5; f *= 2.02; } return s / n; };
  return n2;
}

// Curated palettes: two background stops, four inks (dark → light), an accent.
const PALETTES = {
  midnight: { name: 'Midnight', bg0: '#041327', bg1: '#01060d', inks: ['#1f4a55', '#2f6474', '#5d7fa6', '#9fb3cf'], accent: '#f0c76a' },
  ember:    { name: 'Ember',    bg0: '#1b0c08', bg1: '#060302', inks: ['#5e2418', '#9b4227', '#d27a3c', '#f2bb6b'], accent: '#ffd88a' },
  ocean:    { name: 'Ocean',    bg0: '#03161f', bg1: '#010609', inks: ['#0e4757', '#1c7486', '#3fa3b0', '#a3dcdc'], accent: '#f3d58c' },
  forest:   { name: 'Forest',   bg0: '#07150f', bg1: '#020704', inks: ['#1d4430', '#2e6a48', '#6a9a5d', '#c7d68d'], accent: '#f2d27a' },
  rose:     { name: 'Rose',     bg0: '#180a15', bg1: '#060306', inks: ['#552443', '#87385f', '#c56a88', '#f1a9b6'], accent: '#ffd6a0' },
  violet:   { name: 'Violet',   bg0: '#0e0b22', bg1: '#04030b', inks: ['#2d2968', '#4a3e9c', '#7e6cd2', '#bcaaff'], accent: '#ffd98a' },
  mono:     { name: 'Mono',     bg0: '#0d0e12', bg1: '#030304', inks: ['#2a2d33', '#474c55', '#7d838d', '#c4c9d2'], accent: '#e9e3d0' },
  dawn:     { name: 'Dawn',     bg0: '#1c1528', bg1: '#07050d', inks: ['#4a3a6c', '#9c5f7c', '#de8e70', '#f5c57d'], accent: '#ffe0a0' },
};
/** Indian seasons: winter, spring, summer, monsoon, festive autumn. */
const SEASON = m => (m === 11 || m <= 1) ? 'violet' : m <= 3 ? 'rose' : m <= 5 ? 'ember' : m <= 8 ? 'forest' : 'midnight';
// Time-of-day keyframes. Brightness bottoms out in the small hours and peaks at noon;
// bg1 stays dark at every hour because the calendar scrim is drawn with it.
const DAY_KEYS = [
  { h: 0,  name: 'Midnight',    bg0: '#030b18', bg1: '#010308', inks: ['#17384a', '#264f66', '#4a6c94', '#8ea4c4'], accent: '#e8c46a' },
  { h: 3,  name: 'Small Hours', bg0: '#02060f', bg1: '#000205', inks: ['#152c40', '#213f5a', '#3f5a82', '#7c90b4'], accent: '#d9b866' },
  { h: 5,  name: 'First Light', bg0: '#120f2a', bg1: '#04030c', inks: ['#3a3168', '#6a4f86', '#a8708a', '#dca68a'], accent: '#ffcf9a' },
  { h: 7,  name: 'Dawn',        bg0: '#3a2240', bg1: '#0c0812', inks: ['#6a4068', '#b0647a', '#ec9a78', '#ffd29a'], accent: '#fff0c0' },
  { h: 9,  name: 'Morning',     bg0: '#24547a', bg1: '#0a1826', inks: ['#2f6f94', '#4f97b8', '#8cc6d8', '#e2f2f2'], accent: '#ffe6a0' },
  { h: 12, name: 'Noon',        bg0: '#2f6fa6', bg1: '#0e2236', inks: ['#3c86b8', '#62a8d4', '#a2d2ec', '#f2fbff'], accent: '#ffe9a6' },
  { h: 15, name: 'Afternoon',   bg0: '#2a5f8a', bg1: '#0d1e30', inks: ['#3a7a9c', '#6aa2b4', '#c0c8a0', '#f6e6b4'], accent: '#ffd88a' },
  { h: 16, name: 'Late Afternoon', bg0: '#5a4a52', bg1: '#120d12', inks: ['#7a5a5a', '#b07a62', '#e0aa78', '#fadcae'], accent: '#ffe0a0' },
  { h: 17, name: 'Golden Hour', bg0: '#5a3418', bg1: '#140904', inks: ['#8a4a22', '#c26f32', '#eba052', '#ffd890'], accent: '#fff0b8' },
  { h: 18, name: 'Dusk',        bg0: '#3c1830', bg1: '#0e050c', inks: ['#6e2a4c', '#a8466a', '#dc7a7a', '#f8b89a'], accent: '#ffd6a0' },
  { h: 20, name: 'Evening',     bg0: '#120c2c', bg1: '#04030c', inks: ['#2f2a6a', '#4c3f9e', '#7e6cd2', '#bcaaff'], accent: '#ffd98a' },
  { h: 22, name: 'Night',       bg0: '#050f26', bg1: '#01040b', inks: ['#1c3f55', '#2b5a70', '#5476a0', '#98acca'], accent: '#f0c76a' },
];
/** The palette for a wall-clock hour (0–23), blended between the keyframes on either side. */
function hourPalette(hr){
  const h = ((Math.floor(hr) % 24) + 24) % 24;
  let i = DAY_KEYS.length - 1;
  while (DAY_KEYS[i].h > h) i--;
  const a = DAY_KEYS[i], b = DAY_KEYS[(i + 1) % DAY_KEYS.length];
  const span = (b.h > a.h ? b.h : b.h + 24) - a.h, t = (h - a.h)/span;
  return {
    name: t < 0.5 ? a.name : b.name,
    bg0: mix(a.bg0, b.bg0, t), bg1: mix(a.bg1, b.bg1, t),
    inks: a.inks.map((c, k) => mix(c, b.inks[k], t)), accent: mix(a.accent, b.accent, t),
  };
}
function pickPalette(name, R, now, tod){
  if (PALETTES[name]) return PALETTES[name];
  if (name === 'random'){ const k = Object.keys(PALETTES); return PALETTES[k[Math.floor(R() * k.length)]]; }
  if (tod) return hourPalette(now.getUTCHours()); // wall-clock hour in the chosen zone
  return PALETTES[SEASON(now.getUTCMonth())];
}

function hexToRgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgba(h, a){ const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; }
function mix(h1, h2, t){ const a = hexToRgb(h1), b = hexToRgb(h2); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

// 0 triangle, 1 circle, 2 cross, 3 square
function glyph(ctx, type, x, y, r, rot){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.beginPath();
  if (type === 0){ for (let k = 0; k < 3; k++){ const a = -Math.PI/2 + k*TAU/3; ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a)*r, Math.sin(a)*r*1.02 + r*0.12); } ctx.closePath(); }
  else if (type === 1){ ctx.arc(0, 0, r*0.86, 0, TAU); }
  else if (type === 2){ const s = r*0.82; ctx.moveTo(-s, -s); ctx.lineTo(s, s); ctx.moveTo(s, -s); ctx.lineTo(-s, s); }
  else { const s = r*0.78; ctx.rect(-s, -s, s*2, s*2); }
  ctx.stroke(); ctx.restore();
}
function rrect(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath(); }
function bgGradient(ctx, W, H, P){
  const g = ctx.createRadialGradient(W*0.5, H*0.32, 0, W*0.5, H*0.45, H*0.75);
  g.addColorStop(0, P.bg0); g.addColorStop(1, P.bg1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function glow(ctx, x, y, r, color, a){
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r*2, r*2);
}
function starDust(ctx, W, H, R, n, color, y0 = 0, y1 = 1){
  for (let i = 0; i < n; i++){
    const x = R()*W, y = H*(y0 + R()*(y1 - y0)), s = Math.pow(R(), 3)*W*0.003 + W*0.0007;
    ctx.globalAlpha = 0.25 + R()*0.6; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

module.exports = { TAU, rng, hash, shuffle, makeNoise, PALETTES, pickPalette, hourPalette, rgba, mix, hexToRgb, glyph, rrect, bgGradient, glow, starDust };
