'use strict';
// city: a skyline where every window is a day of the year
const { rgba, mix, bgGradient, glow, starDust } = require('../core');

function city(ctx, W, H, R, P, I){
  bgGradient(ctx, W, H, P);
  starDust(ctx, W, H, R, 140, '#e6ecff', 0, 0.35);
  const gy = I.horizon;
  // back layer silhouettes
  for (let x = -W*0.02; x < W;){ const bw = W*(0.04 + R()*0.07), bh = H*(0.05 + R()*0.2); ctx.fillStyle = mix(P.bg0, P.inks[0], 0.35); ctx.fillRect(x, gy - bh, bw, bh); x += bw + W*0.004; }
  // main layer with windows
  const blds = []; for (let x = 0; x < W;){ const bw = W*(0.07 + R()*0.08); const mid = 1 - Math.abs(x/W - 0.5)*1.2; const bh = H*(0.08 + R()*0.22*mid + 0.06*mid); blds.push([x, bw, bh]); x += bw + W*(0.006 + R()*0.01); }
  const win = W*0.009, gap = W*0.0075, wins = [];
  for (const [x, bw, bh] of blds){
    const g = ctx.createLinearGradient(0, gy - bh, 0, gy); g.addColorStop(0, mix(P.bg0, P.inks[0], 0.7)); g.addColorStop(1, P.bg1);
    ctx.fillStyle = g; ctx.fillRect(x, gy - bh, bw, bh);
    if (bh > H*0.2 && R() < 0.6){ ctx.fillStyle = '#ff5c5c'; glow(ctx, x + bw/2, gy - bh - W*0.012, W*0.012, '#ff5c5c', 0.6); ctx.fillRect(x + bw/2 - 1, gy - bh - W*0.012, 2, W*0.012); }
    const cols = Math.floor((bw - gap)/(win + gap)), rows = Math.floor((bh - gap*2)/(win*1.4 + gap)), x0 = x + (bw - cols*(win + gap) + gap)/2;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) wins.push([x0 + c*(win + gap), gy - gap - (r + 1)*(win*1.4 + gap)]);
  }
  // spread the year's days over the windows
  const stride = wins.length/I.total, lit = new Map();
  for (let dd = 0; dd < I.total; dd++) lit.set(Math.floor(dd*stride), dd);
  wins.forEach(([x, y], k) => {
    const dd = lit.get(k);
    let col, a;
    if (dd === undefined){ col = P.inks[0]; a = 0.35; }
    else if (dd === I.doy - 1){ col = P.accent; a = 1; glow(ctx, x + win/2, y + win*0.7, W*0.03, P.accent, 0.6); }
    else if (I.isHoliday(dd)){ col = '#e8907f'; a = dd < I.doy ? 0.9 : 0.45; }
    else if (dd < I.doy){ col = R() < 0.8 ? '#f3d58c' : '#cfe3ff'; a = 0.45 + R()*0.45; }
    else { col = P.inks[1]; a = 0.35; }
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(x, y, win, win*1.4);
  });
  ctx.globalAlpha = 1;
  // water reflection below the street line
  const refl = ctx.createLinearGradient(0, gy, 0, gy + H*0.12); refl.addColorStop(0, rgba('#f3d58c', 0.08)); refl.addColorStop(1, rgba('#f3d58c', 0));
  ctx.fillStyle = refl; ctx.fillRect(0, gy, W, H*0.12);
  ctx.fillStyle = rgba(P.inks[2], 0.5); ctx.fillRect(0, gy, W, Math.max(1, H*0.0012));
}

module.exports = { id: 'city', name: 'City of Days', render: city };
