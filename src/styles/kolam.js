'use strict';
// kolam: a symmetric chalk pattern drawn around a dot grid
const { TAU, rgba, bgGradient, starDust } = require('../core');

function kolam(ctx, W, H, R, P, I){
  bgGradient(ctx, W, H, P);
  const n = 7 + 2*Math.floor(R()*3), cx = W/2, cy = H*0.34, size = W*0.82, s = size/n/Math.SQRT2*1.0;
  const o = []; for (let i = 0; i < n; i++){ o.push([]); for (let j = 0; j < n; j++) o[i].push(0); }
  const h = Math.ceil(n/2);
  for (let i = 0; i < h; i++) for (let j = i; j < h; j++){ const v = R() < 0.5 ? 1 : 0; o[i][j] = v; o[j][i] = v; }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
    const mi = Math.min(i, n - 1 - i), mj = Math.min(j, n - 1 - j), flips = (i !== mi) + (j !== mj);
    o[i][j] = flips % 2 ? 1 - o[mi][mj] : o[mi][mj];
  }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI/4); ctx.translate(-n*s/2, -n*s/2);
  const festive = !!I.todayHoliday, cols = festive ? ['#e8907f', P.accent, P.inks[3], '#9ad1c5'] : [P.inks[3]];
  // grid dots at the vertices
  ctx.fillStyle = rgba(P.inks[3], 0.8);
  for (let i = 1; i < n; i++) for (let j = 1; j < n; j++){ ctx.beginPath(); ctx.arc(i*s, j*s, s*0.06, 0, TAU); ctx.fill(); }
  for (const pass of [0, 1]){
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      const x = i*s, y = j*s; ctx.beginPath();
      if (o[i][j]){ ctx.arc(x, y, s/2, 0, Math.PI/2); ctx.moveTo(x + s, y + s/2); ctx.arc(x + s, y + s, s/2, -Math.PI/2, Math.PI, true); }
      else { ctx.arc(x + s, y, s/2, Math.PI/2, Math.PI); ctx.moveTo(x + s/2, y + s); ctx.arc(x, y + s, s/2, 0, -Math.PI/2, true); }
      const ring = Math.max(Math.abs(i - (n - 1)/2), Math.abs(j - (n - 1)/2));
      if (pass === 0){ ctx.strokeStyle = rgba(cols[Math.floor(ring) % cols.length], 0.18); ctx.lineWidth = s*0.22; }
      else { ctx.strokeStyle = cols[Math.floor(ring) % cols.length]; ctx.globalAlpha = 0.85; ctx.lineWidth = s*0.065; }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  // frame
  ctx.strokeStyle = rgba(P.inks[2], 0.4); ctx.lineWidth = s*0.04; ctx.strokeRect(-s*0.35, -s*0.35, n*s + s*0.7, n*s + s*0.7);
  ctx.restore();
  starDust(ctx, W, H, R, 70, P.inks[2]);
}

module.exports = { id: 'kolam', name: 'Kolam', render: kolam };
