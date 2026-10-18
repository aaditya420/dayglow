'use strict';
// The render pipeline: seed → style art → festival → scrim → vignette → calendar view → caption → image.
const crypto = require('crypto');
const { createCanvas } = require('@napi-rs/canvas');
const { rng, hash, pickPalette } = require('./core');
const { STYLES, STYLE_IDS } = require('./styles');
const { calendar } = require('./time');
const { loadHolidays } = require('./holidays');
const { fetchWeather } = require('./weather');
const { registerFonts } = require('./fonts');
const overlays = require('./overlays');

registerFonts();

/** Resolve the seed: random by default, or derived from the date/hour, or pinned. */
function resolveSeed(seed, cal, hour){
  if (seed == null || seed === 'random') return crypto.randomInt(0, 1e6);
  if (seed === 'daily') return hash(`${cal.y}-${cal.m}-${cal.d}`) % 1e6;
  if (seed === 'hourly') return hash(`${cal.y}-${cal.m}-${cal.d}-${hour}`) % 1e6;
  return /^[0-9]+$/.test(seed) ? Number(seed.slice(-9)) % 1e6 : hash(seed) % 1e6;
}

/**
 * @param {ReturnType<import('./options').parseOptions>} o
 * @returns {Promise<{body: Buffer, format: string, seed: number, style: string, palette: string, deterministic: boolean}>}
 */
async function render(o){
  const { w: W, h: H, now } = o;
  const cal = calendar(now);
  const seed = resolveSeed(o.seed, cal, now.getUTCHours());
  const R = rng(seed);

  const gallery = o.style === 'gallery' || o.style === 'random';
  const style = gallery ? STYLE_IDS[Math.floor(R()*STYLE_IDS.length)] : o.style;
  const S = STYLES[style];
  const P = pickPalette(o.palette, R, now, o.tod);
  const hol = loadHolidays(o.holidays);
  const todayHoliday = hol.name(cal.y, cal.m, cal.d);
  const L = overlays.layoutFor(o.screen), zone = L.zones[o.view];

  const I = {
    ...cal, now, hol, todayHoliday, view: o.view,
    zone: zone && { y0: zone[0]*H, y1: zone[1]*H },
    horizon: o.view === 'none' ? H*0.8 : H*L.horizon, screen: o.screen,
    monthProg: cal.d/cal.dim, yearProg: cal.doy/cal.total,
    lat: o.lat, lon: o.lon, tzOffsetMin: o.tzOffsetMin,
    isHoliday: i => hol.isYearDay(cal.y, i),
    isHolidayDate: (y, m, d) => Boolean(hol.name(y, m, d)),
    weather: style === 'weather' ? await fetchWeather(o.lat, o.lon, o.tz) : null,
  };

  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const detail = S.render(ctx, W, H, R, P, I);

  ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
  if (o.festive) overlays.festival(ctx, W, H, R, todayHoliday, L);
  overlays.scrim(ctx, W, H, P, zone, o.scrim ?? (style === 'shapes' ? 0 : 0.85));
  overlays.vignette(ctx, W, H);
  if (o.view === 'month') overlays.drawMonthWeek(ctx, W, H, I, L);
  else if (o.view === 'year') overlays.drawYear(ctx, W, H, I, L);

  // The home screen dock covers the caption spot, so captions are lock-screen only.
  if (L.caption && (o.label ?? gallery)){
    const parts = [gallery ? `No. ${cal.doy} · ${S.name}` : S.name];
    if (detail) parts.push(detail);
    if (todayHoliday && o.festive) parts.push(todayHoliday);
    parts.push(`${P.name} · #${seed}`);
    overlays.caption(ctx, W, H, parts.join(' · '));
  }

  // Async encode keeps the event loop free. JPEG/WebP encode several times faster than PNG for busy styles.
  const format = o.format || 'png';
  const body = format === 'png' ? await canvas.encode('png') : await canvas.encode(format, format === 'jpeg' ? 92 : 90);
  const deterministic = o.seed != null && o.seed !== 'random' && style !== 'weather' && style !== 'sky';
  return { body, format, seed, style, palette: P.name, deterministic };
}

module.exports = { render, resolveSeed };
