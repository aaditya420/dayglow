'use strict';
// Query-string parsing. Every value is validated and clamped; unknown values fall back to defaults
// so a typo in a Shortcut still returns a wallpaper instead of an error.
const { PALETTES } = require('./core');
const { STYLE_IDS } = require('./styles');
const { isValidTimeZone, nowIn } = require('./time');

const LIMITS = Object.freeze({ minW: 300, maxW: 2000, minH: 600, maxH: 4400, seedLength: 64 });
const VIEWS = ['month', 'year', 'none'];
const SCREENS = ['lock', 'home'];
const FORMATS = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', webp: 'webp' };
const PALETTE_NAMES = ['auto', 'random', ...Object.keys(PALETTES)];
const DATE_RE = /^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:T([0-9]{2})(?::([0-9]{2}))?)?$/;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
function number(v, def, lo, hi, float = false){
  if (v == null || v === '') return def;
  const n = float ? Number.parseFloat(v) : Number.parseInt(v, 10);
  return Number.isFinite(n) ? clamp(n, lo, hi) : def;
}
function flag(v, def){
  if (v == null || v === '') return def;
  return !/^(0|false|off|no)$/i.test(v);
}

/** Defaults come from environment variables so each deployment can set its own home location. */
function defaults(env = process.env){
  const tz = isValidTimeZone(env.WALLPAPER_TZ) ? env.WALLPAPER_TZ : 'Asia/Kolkata';
  return {
    tz,
    lat: number(env.WALLPAPER_LAT, 28.6139, -90, 90, true),
    lon: number(env.WALLPAPER_LON, 77.209, -180, 180, true),
    holidays: env.WALLPAPER_HOLIDAYS || 'IN',
  };
}

/**
 * @param {URLSearchParams} q
 * @param {Record<string,string|undefined>} [env]
 * @param {Date} [instant] real current time, injectable for tests
 */
function parseOptions(q, env = process.env, instant = new Date()){
  const base = defaults(env);
  const tz = isValidTimeZone(q.get('tz')) ? q.get('tz') : base.tz;
  const realNow = nowIn(tz, instant);
  const tzOffsetMin = Math.round((realNow.getTime() - instant.getTime())/60000);

  let now = realNow, dateOverride = false;
  const dm = DATE_RE.exec(q.get('date') || '');
  if (dm){
    const [, y, mo, d, h, mi] = dm.map(Number);
    const at = new Date(Date.UTC(y, mo - 1, d, Number.isNaN(h) ? realNow.getUTCHours() : h, Number.isNaN(mi) ? realNow.getUTCMinutes() : mi));
    if (!Number.isNaN(at.getTime()) && at.getUTCMonth() === mo - 1 && !(h > 23) && !(mi > 59)){ now = at; dateOverride = true; } // rejects 2026-02-31
  }

  const style = String(q.get('style') || 'shapes').toLowerCase();
  const view = String(q.get('view') || 'month').toLowerCase();
  const palette = String(q.get('palette') || 'auto').toLowerCase();
  const screen = String(q.get('screen') || 'lock').toLowerCase();
  const seed = q.get('seed');
  const warnings = [];
  if (!(style === 'gallery' || style === 'random' || STYLE_IDS.includes(style))) warnings.push(`unknown style "${style.slice(0, 20)}"`);
  if (!VIEWS.includes(view)) warnings.push(`unknown view "${view.slice(0, 20)}"`);
  if (!PALETTE_NAMES.includes(palette)) warnings.push(`unknown palette "${palette.slice(0, 20)}"`);
  if (!SCREENS.includes(screen)) warnings.push(`unknown screen "${screen.slice(0, 20)}"`);

  return {
    style: STYLE_IDS.includes(style) || style === 'gallery' || style === 'random' ? style : 'shapes',
    view: VIEWS.includes(view) ? view : 'month',
    screen: SCREENS.includes(screen) ? screen : 'lock',
    palette: PALETTE_NAMES.includes(palette) ? palette : 'auto',
    seed: seed == null || seed === '' ? null : String(seed).slice(0, LIMITS.seedLength),
    tod: flag(q.get('tod'), true),
    festive: flag(q.get('festive'), true),
    scrim: q.has('scrim') ? number(q.get('scrim'), 0.85, 0, 1, true) : null,
    label: q.has('label') ? flag(q.get('label'), false) : null,
    lat: number(q.get('lat'), base.lat, -90, 90, true),
    lon: number(q.get('lon'), base.lon, -180, 180, true),
    w: number(q.get('w'), 1179, LIMITS.minW, LIMITS.maxW),
    h: number(q.get('h'), 2556, LIMITS.minH, LIMITS.maxH),
    format: FORMATS[String(q.get('format') || 'png').toLowerCase()] || 'png',
    holidays: base.holidays,
    tz, tzOffsetMin, now, dateOverride, warnings,
  };
}

module.exports = { parseOptions, defaults, LIMITS, VIEWS, SCREENS, PALETTE_NAMES, FORMATS };
