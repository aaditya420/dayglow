'use strict';
// assemble: PlayStation symbols re-forming through the month
const { TAU, glyph, bgGradient } = require('../core');

function assemble(ctx, W, H, R, P, I){
  bgGradient(ctx, W, H, P);
  const p = I.d/I.dim, cx = W/2, cy = H*0.34, rad = W*0.21, gs = W*0.11;
  const cols = ['#58b8a6', '#dc7b72', '#7393dc', '#cb8fc6'];
  const centers = [[0, -rad], [rad, 0], [0, rad], [-rad, 0]], types = [0, 1, 2, 3];
  const outline = t => {
    if (t === 0){ const v = [0, 1, 2].map(k => { const a = -Math.PI/2 + k*TAU/3; return [Math.cos(a)*gs, Math.sin(a)*gs + gs*0.12]; }); return [[...v, v[0]]]; }
    if (t === 1){ const v = []; for (let k = 0; k <= 36; k++){ const a = k/36*TAU; v.push([Math.cos(a)*gs*0.86, Math.sin(a)*gs*0.86]); } return [v]; }
    if (t === 2){ const q = gs*0.82; return [[[-q, -q], [q, q]], [[q, -q], [-q, q]]]; }
    const q = gs*0.78; return [[[-q, -q], [q, -q], [q, q], [-q, q], [-q, -q]]];
  };
  // split each outline into short fragments
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  types.forEach((t, gi) => {
    const [ox, oy] = centers[gi];
    for (const poly of outline(t)){
      ctx.save(); ctx.translate(cx + ox, cy + oy); ctx.beginPath(); poly.forEach((q, z) => ctx[z ? 'lineTo' : 'moveTo'](q[0], q[1]));
      ctx.strokeStyle = cols[gi]; ctx.globalAlpha = 0.12; ctx.lineWidth = W*0.012; ctx.stroke(); ctx.restore();
      const pts = [];
      for (let k = 0; k < poly.length - 1; k++){ const [a, b] = [poly[k], poly[k + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(L/(gs*0.16))); for (let q = 0; q < m; q++) pts.push([a[0] + (b[0] - a[0])*q/m, a[1] + (b[1] - a[1])*q/m]); }
      pts.push(poly[poly.length - 1]);
      for (let k = 0; k < pts.length - 1; k += 2){
        const seg = pts.slice(k, k + 3), mxp = seg.reduce((s, q) => s + q[0], 0)/seg.length, myp = seg.reduce((s, q) => s + q[1], 0)/seg.length;
        const spread = Math.pow(1 - p, 2.2), ang = R()*TAU, dist = W*(0.04 + R()*0.3)*spread, rot = (R() - 0.5)*Math.PI*1.4*spread;
        ctx.save(); ctx.translate(cx + ox + mxp + Math.cos(ang)*dist, cy + oy + myp + Math.sin(ang)*dist); ctx.rotate(rot);
        ctx.beginPath(); seg.forEach((q, z) => ctx[z ? 'lineTo' : 'moveTo'](q[0] - mxp, q[1] - myp));
        ctx.strokeStyle = cols[gi]; ctx.globalAlpha = 0.35 + 0.6*p; ctx.lineWidth = W*0.012;
        if (p > 0.95){ ctx.shadowColor = cols[gi]; ctx.shadowBlur = W*0.03; }
        ctx.stroke(); ctx.restore();
      }
    }
  });
  ctx.globalAlpha = 1;
  // drifting dust
  for (let i = 0; i < 90; i++){ ctx.globalAlpha = 0.15 + R()*0.25; ctx.strokeStyle = P.inks[1 + Math.floor(R()*3)]; ctx.lineWidth = W*0.002; glyph(ctx, Math.floor(R()*4), R()*W, R()*H, W*(0.004 + R()*0.008), R()*TAU); }
  ctx.globalAlpha = 1;
  return `${Math.round(p*100)}% assembled`;
}

module.exports = { id: 'assemble', name: 'Reassembly', render: assemble };
