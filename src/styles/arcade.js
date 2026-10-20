'use strict';
// arcade: a retro pixel level for the current week
const { createCanvas } = require('@napi-rs/canvas');
const { makeNoise, rgba, mix } = require('../core');
const { blit } = require('./_shared');

const PIX = { '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001001001001','8':'111101111101111','9':'111101111001111','L':'100100100100111','V':'101101101101010','H':'101101111101101','P':'111101111100100',' ':'000000000000000' };
function pixText(ctx, str, x, y, px, color){ ctx.fillStyle = color; [...str].forEach((ch, i) => { const g = PIX[ch] || PIX[' ']; for (let k = 0; k < 15; k++) if (g[k] === '1') ctx.fillRect(x + (i*4 + k % 3)*px, y + Math.floor(k/3)*px, px, px); }); }
function arcade(ctx, W, H, R, P, I){
  const k = 7, w = Math.ceil(W/k), h = Math.ceil(H/k), sm = createCanvas(w, h), c = sm.getContext('2d');
  const N = makeNoise(R), bands = [P.bg1, P.bg0, mix(P.bg0, P.inks[0], 0.6), mix(P.inks[0], P.inks[1], 0.5)];
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const gyp = Math.round(I.horizon/k);
  for (let y = 0; y < gyp; y++){
    const t = y/gyp*(bands.length - 1), i0 = Math.floor(t), fr = t - i0;
    for (let x = 0; x < w; x++){ const use = fr*16 > bayer[y % 4][x % 4] ? i0 + 1 : i0; c.fillStyle = bands[Math.min(bands.length - 1, use)]; c.fillRect(x, y, 1, 1); }
  }
  for (let i = 0; i < 70; i++){ c.fillStyle = R() < 0.8 ? '#cfd8ff' : P.accent; c.fillRect(Math.floor(R()*w), Math.floor(R()*gyp*0.7), 1, 1); }
  const mx = Math.floor(w*(0.2 + R()*0.6)), my = Math.floor(h*0.13), mr = 7;
  for (let y = -mr; y <= mr; y++) for (let x = -mr; x <= mr; x++) if (x*x + y*y <= mr*mr){ c.fillStyle = (x + 3)*(x + 3) + y*y < mr*mr*0.55 ? '#2a2e40' : '#f2e9cf'; c.fillRect(mx + x, my + y, 1, 1); }
  // mountain layers
  [[0.30, P.inks[0], 0.5], [0.18, mix(P.inks[0], P.bg1, 0.3), 1.2], [0.09, P.bg1, 2.2]].forEach(([amp, col, f], li) => {
    c.fillStyle = col;
    for (let x = 0; x < w; x++){ const top = gyp - Math.round(h*amp*(0.35 + 0.65*(N.fbm(x/w*f*3 + li*10, li, 3) + 0.6)/1.2)); c.fillRect(x, top, 1, gyp - top); }
  });
  // ground and path
  c.fillStyle = mix(P.inks[0], P.bg1, 0.5); c.fillRect(0, gyp, w, h - gyp);
  for (let x = 0; x < w; x += 2){ c.fillStyle = P.inks[1]; c.fillRect(x, gyp, 1, 1); }
  // player at today, coins for days left this month, stars on holidays
  const left = I.dim - I.d, px0 = Math.floor(w*0.14), span = w - px0 - 6;
  const hero = ['001100','011110','001100','111111','001100','010010'];
  hero.forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1'){ c.fillStyle = P.accent; c.fillRect(px0 + rx - 3, gyp - 6 + ry, 1, 1); } }));
  for (let i = 1; i <= left; i++){
    const x = px0 + 4 + Math.round(span*i/(left + 1)), yy = gyp - 5 - (i % 2)*2, hol = I.isHolidayDate(I.y, I.m, I.d + i);
    c.fillStyle = hol ? '#e8907f' : '#f3d58c';
    if (hol){ c.fillRect(x, yy - 2, 1, 5); c.fillRect(x - 2, yy, 5, 1); c.fillRect(x - 1, yy - 1, 3, 3); } else { c.fillRect(x, yy, 2, 3); c.fillStyle = '#b8902e'; c.fillRect(x + 1, yy, 1, 3); }
  }
  blit(ctx, sm, W, H, false);
  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
  // HUD under the status bar
  const wk = I.week, hp = 1 - I.d/I.dim, ps = Math.round(W*0.0065);
  pixText(ctx, `LVL ${wk}`, W*0.07, H*0.066, ps, P.inks[3]);
  const bx = W*0.62, by = H*0.066, bw = W*0.3, bh = ps*5;
  ctx.fillStyle = rgba(P.inks[3], 0.25); ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = hp > 0.3 ? '#7fd18b' : '#e8907f'; ctx.fillRect(bx, by, bw*hp, bh);
  pixText(ctx, 'HP', bx - ps*9, by, ps, P.inks[3]);
  return `Level ${wk} · ${left} coins left`;
}

module.exports = { id: 'arcade', name: 'Arcade', render: arcade };
