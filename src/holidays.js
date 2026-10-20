'use strict';
// Public holiday calendars, loaded from data/holidays/<CODE>.json.
const fs = require('fs');
const path = require('path');
const { D, keyOf, dayKey } = require('./time');

const DIR = path.join(__dirname, '..', 'data', 'holidays');
const cache = new Map();

/** Load a calendar by ISO country code ("IN"), or an empty one for "none" or unknown codes. */
function loadHolidays(code = 'IN'){
  const id = String(code).toUpperCase();
  if (cache.has(id)) return cache.get(id);
  let dates = {};
  if (/^[A-Z]{2}$/.test(id)){ // the strict pattern also rules out path traversal
    try { dates = JSON.parse(fs.readFileSync(path.join(DIR, `${id}.json`), 'utf8')).dates || {}; }
    catch { dates = {}; }
  }
  const keys = Object.keys(dates).sort();
  const cal = {
    /** Holiday name for a date, or null. Day may overflow the month. */
    name: (y, m, d) => dates[dayKey(y, m, d)] || null,
    /** True when the i-th day of year y (0-based) is a holiday. */
    isYearDay: (y, i) => Boolean(dates[keyOf(D(y, 0, i + 1))]),
    /** The next holiday on or after a date: { name, date, days } or null. */
    next(y, m, d){
      const today = dayKey(y, m, d);
      let lo = 0, hi = keys.length;
      while (lo < hi){ const mid = (lo + hi) >> 1; if (keys[mid] < today) lo = mid + 1; else hi = mid; }
      if (lo >= keys.length) return null;
      const [hy, hm, hd] = keys[lo].split('-').map(Number), date = D(hy, hm - 1, hd);
      return { name: dates[keys[lo]], date, days: Math.round((date - D(y, m, d))/864e5) };
    },
  };
  cache.set(id, cal);
  return cal;
}

module.exports = { loadHolidays };
