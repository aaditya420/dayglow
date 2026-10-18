'use strict';
// weather: today's forecast as an abstract painting
const { makeNoise, bgGradient, glow, starDust, PALETTES } = require('../core');

function weather(ctx, W, H, R, P, I){
  const wx = I.weather || { temp: 18 + R()*18, rain: Math.round(R()*100), cloud: Math.round(R()*100), windDir: R()*360, wind: 4 + R()*20, fake: true };
  const pal = wx.temp < 12 ? PALETTES.violet : wx.temp < 20 ? PALETTES.ocean : wx.temp < 27 ? PALETTES.midnight : wx.temp < 33 ? PALETTES.rose : PALETTES.ember;
  bgGradient(ctx, W, H, pal);
  const night = I.now.getUTCHours() >= 19 || I.now.getUTCHours() < 6;
  if (night && wx.cloud < 50) starDust(ctx, W, H, R, 180, '#e6ecff', 0, 0.6);
  if (!night && wx.cloud < 40) glow(ctx, W*0.82, H*0.12, W*0.7, pal.accent, 0.28);
  // wind sets the stroke direction (screen angle: wind blowing toward dir+180)
  const ang = ((wx.windDir + 180 - 90)*Math.PI/180);
  const N = makeNoise(R), f = 1.6/W, turb = 0.3 + Math.min(1.2, wx.wind/25);
  for (let i = 0; i < 700; i++){
    let x = R()*W, y = R()*H; const len = W*(0.04 + R()*0.12)*(0.6 + wx.wind/30), c = pal.inks[Math.floor(R()*4)];
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 12; s++){ const a = ang + N(x*f, y*f)*turb; x += Math.cos(a)*len/12; y += Math.sin(a)*len/12; ctx.lineTo(x, y); }
    ctx.strokeStyle = c; ctx.globalAlpha = 0.06 + R()*0.12; ctx.lineWidth = W*(0.004 + R()*0.01); ctx.lineCap = 'round'; ctx.stroke();
  }
  // clouds as haze
  for (let i = 0; i < Math.round(wx.cloud/8); i++) glow(ctx, R()*W, R()*H*0.6, W*(0.2 + R()*0.35), '#9aa6b8', 0.05 + wx.cloud/2000);
  // rain streaks
  const drops = Math.round(wx.rain*9), slant = Math.cos(ang)*0.35;
  ctx.strokeStyle = '#cfe0f5'; ctx.lineWidth = W*0.0013;
  for (let i = 0; i < drops; i++){ const x = R()*W, y = R()*H, l = H*(0.012 + R()*0.02); ctx.globalAlpha = 0.12 + R()*0.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + slant*l, y + l); ctx.stroke(); }
  ctx.globalAlpha = 1;
  const dirs = ['N','NE','E','SE','S','SW','W','NW'], dname = dirs[Math.round(wx.windDir/45) % 8];
  return wx.fake ? 'Weather unavailable · imagined forecast' : `${Math.round(wx.temp)}° · ${wx.rain}% rain · ${wx.cloud}% cloud · wind ${dname} ${Math.round(wx.wind)} km/h`;
}

module.exports = { id: 'weather', name: 'Weather Paint', render: weather };
