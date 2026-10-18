'use strict';
// Current conditions from Open-Meteo (free, no API key), cached per location while the function is warm.
const TTL_MS = 15*60*1000, TIMEOUT_MS = 2500, MAX_ENTRIES = 200;
const cache = new Map();

async function fetchWeather(lat, lon, tz){
  if (process.env.WALLPAPER_OFFLINE === '1') return null;
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`, hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
    latitude: lat.toFixed(4), longitude: lon.toFixed(4), timezone: tz, forecast_days: '1',
    current: 'temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m',
    daily: 'temperature_2m_max,precipitation_probability_max',
  });
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'dayglow-wallpaper' } });
    if (!r.ok) return null;
    const j = await r.json(), c = j.current || {};
    if (typeof c.temperature_2m !== 'number') return null;
    const data = {
      temp: c.temperature_2m, cloud: c.cloud_cover ?? 0, wind: c.wind_speed_10m ?? 0, windDir: c.wind_direction_10m ?? 0,
      rain: j.daily?.precipitation_probability_max?.[0] ?? 0,
    };
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    return null; // the weather style falls back to an imagined forecast
  }
}

module.exports = { fetchWeather };
