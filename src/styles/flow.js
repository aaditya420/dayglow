'use strict';
// flow: thousands of fine lines following a noise current
const { TAU, makeNoise, bgGradient } = require('../core');

function flow(ctx, W, H, R, P, I, opt = {}){
  bgGradient(ctx, W, H, P);
  const N = makeNoise(R), f = (0.9 + R()*1.6)/W, base = opt.angle ?? R()*TAU, turb = opt.turb ?? (1.2 + R()*1.8);
  const count = opt.count ?? 2200, steps = opt.steps ?? 70, step = W*0.0045;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++){
    let x = R()*W*1.1 - W*0.05, y = R()*H*1.1 - H*0.05;
    const c = Math.floor(R()*4), lw = W*(0.0008 + R()*0.0018);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < steps; s++){
      const a = base + N.fbm(x*f, y*f, 3)*TAU*turb*0.5;
      x += Math.cos(a)*step; y += Math.sin(a)*step; ctx.lineTo(x, y);
    }
    ctx.globalAlpha = 0.08 + R()*0.22; ctx.strokeStyle = P.inks[c]; ctx.lineWidth = lw; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

module.exports = { id: 'flow', name: 'Flow Field', render: flow };
