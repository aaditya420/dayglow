'use strict';
// marble: ink drops on water, one for each day of the month
const { createCanvas } = require('@napi-rs/canvas');
const { TAU, mix, hexToRgb } = require('../core');
const { blit } = require('./_shared');

function marble(ctx, W, H, R, P, I){
  const k = 3, w = Math.ceil(W/k), h = Math.ceil(H/k), sm = createCanvas(w, h);
  const c2 = sm.getContext('2d'), img = c2.createImageData(w, h), D = img.data;
  const pal = [P.inks[0], P.inks[1], P.inks[2], P.inks[3], mix(P.inks[1], P.bg0, 0.4), mix(P.inks[2], P.bg0, 0.5)].map(hexToRgb);
  const acc = hexToRgb(P.accent);
  const bg = hexToRgb(P.bg0);
  const ops = [{ t: 'drop', x: w/2, y: h/2, r: w*3, c: pal[4] }], centers = [], nc = 4 + Math.floor(R()*3);
  for (let i = 0; i < nc; i++) centers.push([w*(0.1 + R()*0.8), h*(0.05 + R()*0.9)]);
  const drops = I.d + 22;
  for (let i = 0; i < drops; i++){
    const today = i === drops - 1, [x, y] = centers[i % nc];
    ops.push({ t: 'drop', x: x + (R() - 0.5)*w*0.02, y: y + (R() - 0.5)*w*0.02, r: w*(today ? 0.08 : 0.05 + R()*0.07), c: today ? acc : pal[(i*7 + Math.floor(i/nc)) % pal.length] });
  }
  // a comb: several parallel tine strokes in one direction, then a second comb across
  for (const ang of [R()*TAU, R()*TAU]){
    const nx = -Math.sin(ang), ny = Math.cos(ang), teeth = 6 + Math.floor(R()*5), spacing = Math.max(w, h)*1.2/teeth;
    for (let t = 0; t < teeth; t++){ const off = (t - teeth/2)*spacing; ops.push({ t: 'tine', ang: ang + (t % 2 ? Math.PI : 0), x: w/2 + nx*off, y: h/2 + ny*off, z: w*(0.05 + R()*0.06), l: w*0.025 }); }
  }
  for (const o of ops) if (o.t === 'tine'){ o.mx = Math.cos(o.ang); o.my = Math.sin(o.ang); }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    let qx = x, qy = y, col = bg;
    for (let i = ops.length - 1; i >= 0; i--){
      const o = ops[i];
      if (o.t === 'drop'){
        const dx = qx - o.x, dy = qy - o.y, d2 = dx*dx + dy*dy;
        if (d2 < o.r*o.r){ col = o.c; break; }
        const f = Math.sqrt(1 - o.r*o.r/d2); qx = o.x + dx*f; qy = o.y + dy*f;
      } else { // tine
        const dist = Math.abs((qx - o.x)*(-o.my) + (qy - o.y)*o.mx), sh = o.z*o.l/(dist + o.l);
        qx -= o.mx*sh; qy -= o.my*sh;
      }
    }
    const j = (y*w + x)*4; D[j] = col[0]; D[j + 1] = col[1]; D[j + 2] = col[2]; D[j + 3] = 255;
  }
  c2.putImageData(img, 0, 0);
  blit(ctx, sm, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
  return `${I.d} drops this month`;
}

module.exports = { id: 'marble', name: 'Ink Marbling', render: marble };
