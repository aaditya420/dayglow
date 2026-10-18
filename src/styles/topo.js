'use strict';
// topo: map-style contour lines (marching squares)
const { makeNoise, bgGradient } = require('../core');

function topo(ctx, W, H, R, P){
  bgGradient(ctx, W, H, P);
  const N = makeNoise(R), gw = 120, gh = Math.round(gw*H/W), sx = W/(gw - 1), sy = H/(gh - 1);
  const ox = R()*100, oy = R()*100, sc = 1.1 + R()*0.9;
  const F = new Float32Array(gw*gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++){
    const u = i/gw*sc + ox, v = j/gh*sc*(H/W) + oy;
    F[j*gw + i] = N.fbm(u, v, 3) + 0.4*N(u*0.45 + 7, v*0.45 + 3);
  }
  let mn = Infinity, mx = -Infinity; for (const v of F){ if (v < mn) mn = v; if (v > mx) mx = v; }
  const levels = 22;
  for (let L = 1; L < levels; L++){
    const t = mn + (mx - mn)*L/levels;
    ctx.beginPath();
    for (let j = 0; j < gh - 1; j++) for (let i = 0; i < gw - 1; i++){
      const a = F[j*gw + i], b = F[j*gw + i + 1], c = F[(j + 1)*gw + i + 1], d = F[(j + 1)*gw + i];
      const idx = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const x = i*sx, y = j*sy, lerp = (p, q) => (t - p)/(q - p);
      const top = [x + sx*lerp(a, b), y], right = [x + sx, y + sy*lerp(b, c)], bottom = [x + sx*lerp(d, c), y + sy], left = [x, y + sy*lerp(a, d)];
      const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
      switch (idx){
        case 1: case 14: seg(left, bottom); break; case 2: case 13: seg(bottom, right); break;
        case 3: case 12: seg(left, right); break; case 4: case 11: seg(top, right); break;
        case 6: case 9: seg(top, bottom); break; case 7: case 8: seg(left, top); break;
        case 5: seg(left, top); seg(bottom, right); break; case 10: seg(top, right); seg(left, bottom); break;
      }
    }
    const major = L % 5 === 0;
    ctx.strokeStyle = P.inks[Math.min(3, 1 + Math.floor(L/levels*3))]; ctx.globalAlpha = major ? 0.55 : 0.28;
    ctx.lineWidth = W*(major ? 0.0028 : 0.0015); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

module.exports = { id: 'topo', name: 'Topography', render: topo };
