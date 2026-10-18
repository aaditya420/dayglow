'use strict';
const A = require('astronomy-engine');
// tide: a sea whose height follows the real moon
const { makeNoise, rgba, mix, glyph, bgGradient, starDust } = require('../core');
const { drawMoon } = require('./_shared');

function tide(ctx, W, H, R, P, I){
  const when = new Date(I.now.getTime() - I.tzOffsetMin*60000);
  const phase = A.MoonPhase(when), illum = A.Illumination('Moon', when).phase_fraction;
  bgGradient(ctx, W, H, P);
  starDust(ctx, W, H, R, 220, '#e6ecff', 0, 0.5);
  const wy = H*(0.53 - 0.14*illum), mx = W*(0.25 + R()*0.5), my = H*0.17;
  drawMoon(ctx, mx, my, W*0.065, phase);
  const N = makeNoise(R);
  const sea = ctx.createLinearGradient(0, wy, 0, H); sea.addColorStop(0, mix(P.bg0, P.inks[0], 0.6)); sea.addColorStop(1, P.bg1);
  ctx.fillStyle = sea; ctx.fillRect(0, wy, W, H - wy);
  const surf = x => wy + H*0.006*N(x/W*6, 1.1) + H*0.003*Math.sin(x/W*40);
  // wave lines
  for (let k = 0; k < 46; k++){
    const t = k/46, y0 = wy + (H - wy)*t*t*1.05;
    ctx.beginPath();
    for (let x = 0; x <= W; x += W/90){ const y = y0 + H*(0.002 + t*0.01)*N(x/W*(5 - t*3) + k*3.1, k); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = P.inks[1 + (k % 3)]; ctx.globalAlpha = 0.12 + (1 - t)*0.25; ctx.lineWidth = W*(0.0012 + t*0.002); ctx.stroke();
  }
  // moonlight path
  ctx.globalAlpha = 1;
  for (let i = 0; i < 160; i++){
    const t = R(), y = wy + (H - wy)*t, spread = W*(0.02 + t*0.12), x = mx + (R() - 0.5)*spread*2;
    ctx.fillStyle = rgba('#f4ecd8', (1 - t)*0.5*illum + 0.05); ctx.fillRect(x, y, W*(0.01 + R()*0.03)*(1 - t*0.5), W*0.0018);
  }
  // surface and buoys: one per day left in the month
  ctx.beginPath(); for (let x = 0; x <= W; x += W/120) x ? ctx.lineTo(x, surf(x)) : ctx.moveTo(x, surf(x));
  ctx.strokeStyle = P.inks[3]; ctx.globalAlpha = 0.5; ctx.lineWidth = W*0.002; ctx.stroke();
  const left = I.dim - I.d;
  for (let i = 0; i < left; i++){
    const x = W*(0.06 + 0.88*(i + 0.5)/Math.max(left, 1)) + (R() - 0.5)*W*0.01, y = surf(x) - W*0.006;
    ctx.globalAlpha = 0.75; ctx.strokeStyle = P.inks[2 + (i % 2)]; ctx.lineWidth = W*0.0028;
    glyph(ctx, i % 4, x, y, W*0.011, (R() - 0.5)*0.5);
  }
  ctx.globalAlpha = 1;
  return `Moon ${Math.round(illum*100)}% lit · tide ${illum > 0.66 ? 'high' : illum > 0.33 ? 'mid' : 'low'}`;
}

module.exports = { id: 'tide', name: 'Moon Tide', render: tide };
