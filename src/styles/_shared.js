'use strict';
// Helpers shared by several styles.
const { createCanvas } = require('@napi-rs/canvas');
const { TAU, glow } = require('../core');

/** A smaller canvas for per-pixel work; upscaled later with `blit`. */
function lowres(W, H, k){
  const c = createCanvas(Math.ceil(W/k), Math.ceil(H/k));
  return [c, c.getContext('2d')];
}

/** Draw a small canvas over the full frame, smoothed or pixel-sharp. */
function blit(ctx, small, W, H, smooth = true){
  ctx.save();
  ctx.imageSmoothingEnabled = smooth;
  if (smooth) ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, W, H);
  ctx.restore();
}

/** Moon disc with the lit fraction for a phase angle (0 new, 180 full, waxing lit on the right). */
function drawMoon(ctx, x, y, r, phaseDeg){
  glow(ctx, x, y, r*3.2, '#fff3d6', 0.22);
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = 'rgba(30,34,48,0.9)'; ctx.fill(); ctx.clip();
  const ph = (phaseDeg % 360)*Math.PI/180, k = Math.cos(ph), waxing = phaseDeg < 180;
  ctx.fillStyle = '#f4ecd8'; ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI/2, Math.PI/2, !waxing);
  ctx.ellipse(x, y, Math.abs(k)*r, r, 0, Math.PI/2, -Math.PI/2, (k > 0) === waxing);
  ctx.fill();
  ctx.restore();
}

module.exports = { lowres, blit, drawMoon };
