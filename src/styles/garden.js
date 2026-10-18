'use strict';
// garden: a meadow where every past day has grown
const { TAU, shuffle, makeNoise, rgba, mix, bgGradient, glow, starDust } = require('../core');

function garden(ctx, W, H, R, P, I){
  bgGradient(ctx, W, H, P);
  starDust(ctx, W, H, R, 120, P.inks[3], 0, 0.45);
  const gy = I.horizon, N = makeNoise(R);
  const soil = ctx.createLinearGradient(0, gy, 0, H); soil.addColorStop(0, mix(P.bg0, P.inks[0], 0.35)); soil.addColorStop(1, P.bg1);
  ctx.fillStyle = soil; ctx.fillRect(0, gy, W, H - gy);
  const order = shuffle(R, I.doy);
  ctx.lineCap = 'round';
  for (const i of order){
    const x = W*0.03 + (i/I.total)*W*0.94 + (R() - 0.5)*W*0.01, age = I.doy - 1 - i;
    const grow = Math.min(1, (age + 1)/45), hgt = H*(0.06 + 0.24*(N(i*0.07, 3) + 1)/2)*grow*(0.7 + R()*0.5);
    const sway = (N(i*0.1, 9))*W*0.06, isToday = age === 0, hol = I.isHoliday(i);
    const tx = x + sway, ty = gy - hgt;
    ctx.strokeStyle = isToday ? P.accent : P.inks[1 + Math.floor(R()*2)]; ctx.globalAlpha = isToday ? 1 : 0.35 + R()*0.4; ctx.lineWidth = W*(isToday ? 0.004 : 0.0016 + R()*0.0016);
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x, gy - hgt*0.6, tx, ty); ctx.stroke();
    if (grow > 0.5 && R() < 0.35){ // a leaf
      const lt = 0.4 + R()*0.3, lx = x + (tx - x)*lt*lt, ly = gy - hgt*lt, dir = R() < 0.5 ? -1 : 1;
      ctx.fillStyle = P.inks[2]; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(lx + dir*W*0.008, ly, W*0.009, W*0.0035, dir*0.6, 0, TAU); ctx.fill();
    }
    if (hol || (grow === 1 && R() < 0.05)){
      const pc = hol ? '#e8907f' : P.inks[3], pr = W*(hol ? 0.011 : 0.006), np = hol ? 7 : 5;
      ctx.globalAlpha = hol ? 0.95 : 0.6;
      for (let k = 0; k < np; k++){ const a = k/np*TAU; ctx.fillStyle = pc; ctx.beginPath(); ctx.ellipse(tx + Math.cos(a)*pr*0.75, ty + Math.sin(a)*pr*0.75, pr*0.62, pr*0.42, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = P.accent; ctx.beginPath(); ctx.arc(tx, ty, pr*0.35, 0, TAU); ctx.fill();
      if (hol) glow(ctx, tx, ty, pr*4, pc, 0.25);
    }
    if (isToday) glow(ctx, tx, ty, W*0.04, P.accent, 0.5);
  }
  ctx.globalAlpha = 1;
  // seeds waiting for the rest of the year
  for (let i = I.doy; i < I.total; i++){ const x = W*0.03 + (i/I.total)*W*0.94; ctx.fillStyle = rgba(P.inks[2], 0.35); ctx.fillRect(x, gy + 2, W*0.0016, W*0.0016); }
  // fireflies
  for (let i = 0; i < 40; i++) glow(ctx, R()*W, gy - R()*H*0.32, W*0.008, P.accent, 0.4 + R()*0.3);
}

module.exports = { id: 'garden', name: 'Living Garden', render: garden };
