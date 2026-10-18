'use strict';
// aurora: soft light curtains over a starry sky
const { makeNoise, mix, hexToRgb, bgGradient, starDust } = require('../core');
const { lowres, blit } = require('./_shared');

function aurora(ctx, W, H, R, P){
  bgGradient(ctx, W, H, P);
  starDust(ctx, W, H, R, 260, '#dfe8ff', 0, 0.7);
  const N = makeNoise(R), k = 4, [sm, sc] = lowres(W, H, k), w = sm.width, h = sm.height;
  const img = sc.createImageData(w, h), D = img.data;
  const cols = [mix('#5ef2b0', P.inks[3], 0.25), mix('#4fc3f7', P.inks[2], 0.3), mix('#b388ff', P.inks[3], 0.3)].map(hexToRgb);
  const curtains = [0, 1, 2].map(c => ({ base: 0.16 + c*0.11 + R()*0.06, amp: 0.06 + R()*0.06, f: 1.5 + R()*2, o: R()*50, col: cols[c % 3], s: 0.75 - c*0.18 }));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    let r = 0, g = 0, b = 0; const u = x/w, v = y/h;
    for (const C of curtains){
      const yc = C.base + C.amp*N(u*C.f + C.o, C.o);
      const d = yc - v;
      let I = d > 0 ? Math.exp(-d/0.14) : Math.exp(d/0.02);
      I *= 0.55 + 0.45*N(u*28 + C.o, v*1.5 + C.o); // vertical rays
      I *= C.s * (0.6 + 0.4*N(u*3 + 9, C.o));
      I = Math.max(0, I);
      r += C.col[0]*I; g += C.col[1]*I; b += C.col[2]*I;
    }
    const i = (y*w + x)*4; D[i] = Math.min(255, r); D[i + 1] = Math.min(255, g); D[i + 2] = Math.min(255, b); D[i + 3] = 255;
  }
  sc.putImageData(img, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.85; blit(ctx, sm, W, H); ctx.restore();
}

module.exports = { id: 'aurora', name: 'Aurora', render: aurora };
