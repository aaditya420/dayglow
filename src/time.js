'use strict';
// Date helpers. "Wall-clock" dates store a zone's local time in the UTC fields of a Date,
// so all calendar math can use getUTC* without host time zone surprises.

const pad2 = n => String(n).padStart(2, '0');
const D = (y, m, d) => new Date(Date.UTC(y, m, d));
const keyOf = dt => `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
/** YYYY-MM-DD for a (possibly overflowing) year/month/day, e.g. (2026, 9, 35) → 2026-11-04. */
const dayKey = (y, m, d) => keyOf(D(y, m, d));

const formatters = new Map();
function formatter(tz){
  let f = formatters.get(tz);
  if (!f){
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
    formatters.set(tz, f);
  }
  return f;
}
function isValidTimeZone(tz){
  if (typeof tz !== 'string' || tz.length > 64) return false;
  try { formatter(tz); return true; } catch { return false; }
}
/** Current wall-clock time in a time zone. */
function nowIn(tz, instant = new Date()){
  const p = {};
  for (const x of formatter(tz).formatToParts(instant)) if (x.type !== 'literal') p[x.type] = Number(x.value);
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
}
function isoWeek(now){
  const t = D(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n);
  return Math.ceil(((t - D(t.getUTCFullYear(), 0, 1))/864e5 + 1)/7);
}
/** Calendar facts for a wall-clock date. */
function calendar(now){
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate();
  const total = Math.round((D(y + 1, 0, 1) - D(y, 0, 1))/864e5);
  const doy = Math.round((D(y, m, d) - D(y, 0, 1))/864e5) + 1;
  const dim = D(y, m + 1, 0).getUTCDate();
  return { y, m, d, doy, total, dim, week: isoWeek(now), weekday: (now.getUTCDay() + 6) % 7 };
}

module.exports = { D, keyOf, dayKey, isValidTimeZone, nowIn, isoWeek, calendar };
