'use strict';
// GET /api/wallpaper → PNG (or JPEG/WebP). See README for the query parameters.
const { parseOptions } = require('../src/options');
const { render } = require('../src/render');

/** Seconds until the next wall-clock hour, so cached pinned-seed images still roll over with the clock. */
const secondsToNextHour = wallClock => Math.max(60, 3600 - (wallClock.getUTCMinutes()*60 + wallClock.getUTCSeconds()));

module.exports = async function handler(req, res){
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD'){
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  try {
    const q = new URL(req.url, 'http://localhost').searchParams;
    const opts = parseOptions(q);
    const out = await render(opts);
    res.statusCode = 200;
    const ext = out.format === 'jpeg' ? 'jpg' : out.format;
    res.setHeader('Content-Type', `image/${out.format}`);
    res.setHeader('Content-Length', String(out.body.length));
    res.setHeader('Content-Disposition', `inline; filename="dayglow-${out.style}-${out.seed}.${ext}"`);
    // Random pulls must never be cached; pinned seeds can be shared from the CDN until the hour turns.
    res.setHeader('Cache-Control', out.deterministic && !opts.dateOverride
      ? `public, max-age=0, s-maxage=${secondsToNextHour(opts.now)}, stale-while-revalidate=60`
      : out.deterministic ? 'public, max-age=0, s-maxage=86400' : 'no-store, max-age=0');
    res.setHeader('X-Wallpaper-Style', out.style);
    res.setHeader('X-Wallpaper-Seed', String(out.seed));
    res.setHeader('X-Wallpaper-Palette', out.palette);
    if (opts.warnings.length) res.setHeader('X-Wallpaper-Warning', opts.warnings.join('; '));
    return res.end(req.method === 'HEAD' ? undefined : out.body);
  } catch (err){
    console.error('render failed', err);
    if (res.headersSent) return res.end();
    // Drop the image headers set before the failure, or the error body goes out with the PNG's length.
    for (const name of res.getHeaderNames()) res.removeHeader(name);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end('Could not render the wallpaper.');
  }
};
