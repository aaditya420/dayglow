'use strict';
const A = require('astronomy-engine');
// sky: the real sky tonight for a location
const path = require('path');
const fs = require('fs');
const { TAU, makeNoise, rgba, mix, bgGradient, glow } = require('../core');
const { drawMoon } = require('./_shared');

let STARS = null, LINES = null, MW = null;
function skyData(){
  if (!STARS){
    const dir = path.join(path.dirname(require.resolve('d3-celestial/package.json')), 'data');
    STARS = JSON.parse(fs.readFileSync(path.join(dir, 'stars.6.json'))).features;
    LINES = JSON.parse(fs.readFileSync(path.join(dir, 'constellations.lines.json'))).features;
    MW = JSON.parse(fs.readFileSync(path.join(dir, 'mw.json'))).features;
  }
}
function bvColor(bv){ const t = Math.max(-0.3, Math.min(1.8, +bv || 0.6)); return t < 0.3 ? mix('#b9ccff', '#ffffff', (t + 0.3)/0.6) : t < 1 ? mix('#ffffff', '#ffe2b0', (t - 0.3)/0.7) : mix('#ffe2b0', '#ffb07a', (t - 1)/0.8); }
function sky(ctx, W, H, R, P, I){
  skyData();
  // Tonight at 21:00 local unless it's already night
  const hr = I.now.getUTCHours();
  const local = new Date(I.now.getTime()); if (hr >= 5 && hr < 19) local.setUTCHours(21, 0, 0, 0);
  const when = new Date(local.getTime() - I.tzOffsetMin*60000); // real UTC instant
  const obs = new A.Observer(I.lat, I.lon, 0);
  const lst = (A.SiderealTime(when)*15 + I.lon + 360) % 360, lat = I.lat*Math.PI/180;
  const toVec = (raDeg, decDeg) => {
    const ha = (lst - raDeg)*Math.PI/180, dec = decDeg*Math.PI/180;
    const alt = Math.asin(Math.sin(dec)*Math.sin(lat) + Math.cos(dec)*Math.cos(lat)*Math.cos(ha));
    const az = Math.atan2(-Math.sin(ha)*Math.cos(dec), Math.sin(dec)*Math.cos(lat) - Math.cos(dec)*Math.sin(lat)*Math.cos(ha));
    return [Math.cos(alt)*Math.sin(az), Math.cos(alt)*Math.cos(az), Math.sin(alt)]; // east, north, up
  };
  // find planets and moon above the horizon, then aim the camera at the best one
  const bodies = [];
  for (const b of ['Moon', 'Venus', 'Jupiter', 'Saturn', 'Mars', 'Mercury']){
    const eq = A.Equator(b, when, obs, true, true), hz = A.Horizon(when, obs, eq.ra, eq.dec, 'normal');
    if (hz.altitude > 3) bodies.push({ b, az: hz.azimuth, alt: hz.altitude });
  }
  const target = bodies.find(x => x.alt > 8 && x.alt < 70);
  const A0 = (target ? target.az : 180)*Math.PI/180, h0 = Math.min(60, Math.max(32, (target ? target.alt : 40) + 6))*Math.PI/180;
  const d = [Math.sin(A0)*Math.cos(h0), Math.cos(A0)*Math.cos(h0), Math.sin(h0)], rl = Math.hypot(d[1], d[0]);
  const r = [d[1]/rl, -d[0]/rl, 0], u = [r[1]*d[2] - r[2]*d[1], r[2]*d[0] - r[0]*d[2], r[0]*d[1] - r[1]*d[0]];
  const s = H*0.36, cx = W/2, cy = H*0.37;
  const proj = v => { const dd = v[0]*d[0] + v[1]*d[1] + v[2]*d[2]; if (dd < -0.6) return null; const k = 2/(1 + dd); return [cx + (v[0]*r[0] + v[1]*r[1] + v[2]*r[2])*k*s, cy - (v[0]*u[0] + v[1]*u[1] + v[2]*u[2])*k*s]; };
  const ra = lon => (lon < 0 ? lon + 360 : lon);
  bgGradient(ctx, W, H, P);
  // Milky Way
  ctx.fillStyle = rgba(P.inks[3], 0.055);
  for (const f of MW){
    for (const polyg of f.geometry.coordinates){
      ctx.beginPath(); let ok = false;
      for (const ring of polyg){ ring.forEach((c, k) => { const p = proj(toVec(ra(c[0]), c[1])); if (!p) return; ok = true; ctx[k ? 'lineTo' : 'moveTo'](p[0], p[1]); }); ctx.closePath(); }
      if (ok) ctx.fill('evenodd');
    }
  }
  // constellation lines
  ctx.strokeStyle = P.inks[2]; ctx.globalAlpha = 0.35; ctx.lineWidth = W*0.0012; ctx.beginPath();
  for (const f of LINES) for (const line of f.geometry.coordinates){
    let prev = null;
    for (const c of line){ const v = toVec(ra(c[0]), c[1]); const p = v[2] > 0 ? proj(v) : null; if (p && prev){ ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); } prev = p; }
  }
  ctx.stroke(); ctx.globalAlpha = 1;
  // stars
  for (const f of STARS){
    const m = f.properties.mag; const v = toVec(ra(f.geometry.coordinates[0]), f.geometry.coordinates[1]);
    if (v[2] < 0) continue; const p = proj(v); if (!p || p[0] < -10 || p[0] > W + 10 || p[1] < -10 || p[1] > H + 10) continue;
    const rad = W*0.0013*Math.max(0.7, 4.6 - m*0.65), col = bvColor(f.properties.bv);
    if (m < 2) glow(ctx, p[0], p[1], rad*5, col, 0.35);
    ctx.globalAlpha = Math.min(1, 1.35 - m*0.12); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // planets and moon
  const seen = [];
  ctx.font = `600 ${Math.round(W*0.024)}px Manrope`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const { b, az: azd, alt: altd } of bodies){
    const az = azd*Math.PI/180, al = altd*Math.PI/180;
    const p = proj([Math.cos(al)*Math.sin(az), Math.cos(al)*Math.cos(az), Math.sin(al)]);
    if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
    seen.push(b);
    if (b === 'Moon'){ drawMoon(ctx, p[0], p[1], W*0.03, A.MoonPhase(when)); continue; }
    const col = { Mercury: '#d8cfc4', Venus: '#fff4d6', Mars: '#ff9a72', Jupiter: '#ffe3b8', Saturn: '#f1d79a' }[b];
    glow(ctx, p[0], p[1], W*0.02, col, 0.45); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], W*0.0045, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(col, 0.75); ctx.fillText(b, p[0] + W*0.014, p[1]);
  }
  // horizon hills
  // the hills never dip below the art boundary, so their edge can't run through the calendar
  const N = makeNoise(R), hy = Math.min(proj([Math.sin(A0), Math.cos(A0), 0])[1], I.horizon);
  ctx.fillStyle = P.bg1; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += W/80) ctx.lineTo(x, hy - H*0.02 - H*0.025*(N.fbm(x/W*3, 1.3, 3) + 0.5));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  const t = `${local.getUTCHours()}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
  const facing = ['N','NE','E','SE','S','SW','W','NW'][Math.round(((A0*180/Math.PI) % 360)/45) % 8];
  return `Facing ${facing} · ${t}` + (seen.filter(b => b !== 'Moon').length ? ' · ' + seen.filter(b => b !== 'Moon').join(', ') : '');
}

module.exports = { id: 'sky', name: 'Tonight’s Sky', render: sky };
