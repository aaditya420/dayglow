'use strict';
// truchet: quarter-arc tiles forming endless tubes
const { makeNoise, bgGradient } = require('../core');

function truchetStyle(ctx, W, H, R, P, I){
  bgGradient(ctx, W, H, P);
  const n = 7 + Math.floor(R()*6), s = W/n, rows = Math.ceil(H/s) + 1, N = makeNoise(R);
  const tiles = []; for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) tiles.push([i, j, R() < 0.5]);
  for (const pass of [0, 1]){
    for (const [i, j, o] of tiles){
      const x = i*s, y = j*s, t = (N(i*0.25, j*0.25) + 1)/2, c = P.inks[Math.min(3, Math.floor(t*3.99))];
      ctx.beginPath();
      if (o){ ctx.arc(x, y, s/2, 0, Math.PI/2); ctx.moveTo(x + s, y + s/2); ctx.arc(x + s, y + s, s/2, -Math.PI/2, Math.PI, true); }
      else { ctx.arc(x + s, y, s/2, Math.PI/2, Math.PI); ctx.moveTo(x + s/2, y + s); ctx.arc(x, y + s, s/2, 0, -Math.PI/2, true); }
      if (pass === 0){ ctx.strokeStyle = P.bg1; ctx.globalAlpha = 0.95; ctx.lineWidth = s*0.26; }
      else { ctx.strokeStyle = c; ctx.globalAlpha = 0.5; ctx.lineWidth = s*0.1; }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

module.exports = { id: 'truchet', name: 'Truchet', render: truchetStyle };
