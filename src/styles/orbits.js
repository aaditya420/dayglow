'use strict';
// orbits: symbols travelling on tilted elliptical orbits
const { TAU, glyph, bgGradient, glow, starDust } = require('../core');

function orbits(ctx, W, H, R, P, I){
  bgGradient(ctx, W, H, P);
  starDust(ctx, W, H, R, 160, P.inks[3]);
  const cx = W*0.5, cy = H*0.33, tilt = (R() - 0.5)*0.6, squash = 0.38 + R()*0.2, rings = 8;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
  for (let k = 1; k <= rings; k++){
    const rx = W*(0.06 + k*0.062), ry = rx*squash;
    ctx.globalAlpha = 0.32; ctx.strokeStyle = P.inks[1]; ctx.lineWidth = W*0.0018;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
    const n = 3 + k*2, phase = R()*TAU, size = W*(0.008 + k*0.0022);
    for (let j = 0; j < n; j++){
      const a = phase + j/n*TAU, x = Math.cos(a)*rx, y = Math.sin(a)*ry;
      const depth = (Math.sin(a) + 1)/2; // front of the orbit is brighter
      ctx.globalAlpha = 0.25 + depth*0.55; ctx.strokeStyle = P.inks[1 + Math.floor(depth*2.99)]; ctx.lineWidth = size*0.2;
      glyph(ctx, (j + k) % 4, x, y, size*(0.7 + depth*0.6), a);
    }
  }
  // the accent marker rides the outer orbit to show month progress
  const rx = W*(0.06 + rings*0.062), a = -Math.PI/2 + I.monthProg*TAU;
  ctx.globalAlpha = 1; ctx.shadowColor = P.accent; ctx.shadowBlur = W*0.03; ctx.strokeStyle = P.accent; ctx.lineWidth = W*0.006;
  glyph(ctx, I.m % 4, Math.cos(a)*rx, Math.sin(a)*rx*squash, W*0.022, 0);
  ctx.restore(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  // core glow
  glow(ctx, cx, cy, W*0.18, P.inks[2], 0.22);
}

module.exports = { id: 'orbits', name: 'Orbits', render: orbits };
