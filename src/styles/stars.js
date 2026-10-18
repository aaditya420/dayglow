'use strict';
// stars: invented constellations over a milky band
const { TAU, makeNoise, hexToRgb, bgGradient, glow, starDust } = require('../core');
const { lowres, blit } = require('./_shared');

function stars(ctx, W, H, R, P){
  bgGradient(ctx, W, H, P);
  const N = makeNoise(R), [sm, sc] = lowres(W, H, 5), w = sm.width, h = sm.height;
  const img = sc.createImageData(w, h), D = img.data, col = P.inks[2];
  const [cr, cg, cb] = hexToRgb(col);
  const ang = -0.9 + R()*0.6, off = (R() - 0.5)*0.4, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const u = x/w - 0.5, v = (y/h - 0.45)*H/W, d = u*sa - v*ca - off;
    let I = Math.exp(-(d*d)/0.02)*(0.45 + 0.55*N.fbm(x/w*5, y/h*9, 4));
    I = Math.max(0, I)*0.55;
    const i = (y*w + x)*4; D[i] = cr*I; D[i + 1] = cg*I; D[i + 2] = cb*I; D[i + 3] = 255;
  }
  sc.putImageData(img, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; blit(ctx, sm, W, H); ctx.restore();
  starDust(ctx, W, H, R, 900, '#e6ecff');
  // constellations: small clusters joined by a minimum spanning tree
  const groups = 5 + Math.floor(R()*3);
  for (let g = 0; g < groups; g++){
    const gx = W*(0.1 + R()*0.8), gy = H*(0.06 + R()*0.82), n = 5 + Math.floor(R()*4), pts = [];
    for (let i = 0; i < n; i++) pts.push([gx + (R() - 0.5)*W*0.3, gy + (R() - 0.5)*W*0.3]);
    const inT = [0], edges = [];
    while (inT.length < n){
      let best = null;
      for (const a of inT) for (let b = 0; b < n; b++){ if (inT.includes(b)) continue; const dd = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]); if (!best || dd < best[2]) best = [a, b, dd]; }
      inT.push(best[1]); edges.push(best);
    }
    ctx.strokeStyle = P.inks[3]; ctx.globalAlpha = 0.28; ctx.lineWidth = W*0.0013;
    ctx.beginPath(); for (const [a, b] of edges){ ctx.moveTo(...pts[a]); ctx.lineTo(...pts[b]); } ctx.stroke();
    ctx.globalAlpha = 1;
    for (const p of pts){ glow(ctx, p[0], p[1], W*0.012, '#ffffff', 0.5); ctx.fillStyle = '#f4f7ff'; ctx.beginPath(); ctx.arc(p[0], p[1], W*0.0028, 0, TAU); ctx.fill(); }
  }
}

module.exports = { id: 'stars', name: 'Constellations', render: stars };
