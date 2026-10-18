'use strict';
// shapes: the original scattered PlayStation symbols
const { glyph, bgGradient } = require('../core');

function shapes(ctx, W, H, R, P, I){
  bgGradient(ctx, W, H, P);
  ctx.strokeStyle = P.inks[1];
  const z = I.zone;
  for (let i = 0; i < 170; i++){
    const x = R()*W, y = R()*H, r = W*(0.008 + R()*0.024), t = Math.floor(R()*4), rot = (R() - 0.5)*0.9, a = 0.16 + R()*0.22;
    if (z && x > W*0.06 && x < W*0.94 && y > z.y0 && y < z.y1) continue;
    ctx.globalAlpha = a; ctx.lineWidth = Math.max(1.5, r*0.16);
    glyph(ctx, t, x, y, r, rot);
  }
  ctx.globalAlpha = 1;
}

module.exports = { id: 'shapes', name: 'Shapes', render: shapes };
