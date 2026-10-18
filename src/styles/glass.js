'use strict';
// glass: stained-glass Voronoi cells
const { makeNoise, rgba, bgGradient, glow } = require('../core');

function glass(ctx, W, H, R, P){
  bgGradient(ctx, W, H, P);
  const n = 80 + Math.floor(R()*50), pts = [];
  for (let i = 0; i < n; i++) pts.push([R()*W, R()*H]);
  const clip = (poly, a, b, c) => { // keep a*x + b*y <= c
    const out = [];
    for (let i = 0; i < poly.length; i++){
      const p = poly[i], q = poly[(i + 1) % poly.length], fp = a*p[0] + b*p[1] - c, fq = a*q[0] + b*q[1] - c;
      if (fp <= 0) out.push(p);
      if (fp*fq < 0){ const t = fp/(fp - fq); out.push([p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t]); }
    }
    return out;
  };
  const N = makeNoise(R);
  pts.forEach(([px, py], i) => {
    let poly = [[0, 0], [W, 0], [W, H], [0, H]];
    for (let j = 0; j < n && poly.length; j++){
      if (j === i) continue; const [qx, qy] = pts[j];
      poly = clip(poly, qx - px, qy - py, ((qx*qx + qy*qy) - (px*px + py*py))/2);
    }
    if (poly.length < 3) return;
    const t = (N(px/W*2.5, py/H*4) + 1)/2, c1 = P.inks[Math.min(3, Math.floor(t*3.99))], c2 = P.inks[Math.max(0, Math.min(3, Math.floor(t*3.99) - 1))];
    const g = ctx.createLinearGradient(px - W*0.08, py - W*0.08, px + W*0.08, py + W*0.08);
    g.addColorStop(0, rgba(c1, 0.42)); g.addColorStop(1, rgba(c2, 0.14));
    ctx.beginPath(); poly.forEach((p, k) => ctx[k ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = P.bg1; ctx.lineWidth = W*0.007; ctx.lineJoin = 'round'; ctx.stroke();
  });
  glow(ctx, W*0.5, H*0.18, W*0.7, P.inks[3], 0.12);
}

module.exports = { id: 'glass', name: 'Stained Glass', render: glass };
