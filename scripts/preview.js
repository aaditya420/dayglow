'use strict';
// Renders every style to previews/ plus a labelled contact sheet.
// Usage: npm run preview -- [extra query string]   e.g.  npm run preview -- "view=year&palette=ocean"
process.env.WALLPAPER_OFFLINE ??= '1';
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { parseOptions } = require('../src/options');
const { render } = require('../src/render');
const { STYLES, STYLE_IDS } = require('../src/styles');
const { FAMILY } = require('../src/fonts');

async function main(){
  const extra = process.argv[2] || '';
  const out = path.join(__dirname, '..', 'previews');
  fs.mkdirSync(out, { recursive: true });
  const tiles = [];
  for (const id of STYLE_IDS){
    const t = performance.now();
    const r = await render(parseOptions(new URLSearchParams(`style=${id}&seed=4242&${extra}`)));
    fs.writeFileSync(path.join(out, `${id}.png`), r.body);
    tiles.push({ id, img: await loadImage(r.body) });
    console.log(`${id.padEnd(9)} ${String(Math.round(performance.now() - t)).padStart(5)} ms`);
  }
  const tw = 300, th = Math.round(tw*tiles[0].img.height/tiles[0].img.width), pad = 14, lab = 34, cols = 6;
  const rows = Math.ceil(tiles.length/cols);
  const sheet = createCanvas(cols*(tw + pad) + pad, rows*(th + lab + pad) + pad), ctx = sheet.getContext('2d');
  ctx.fillStyle = '#0e1118'; ctx.fillRect(0, 0, sheet.width, sheet.height);
  ctx.font = `700 20px ${FAMILY}`; ctx.fillStyle = '#dce4f0'; ctx.textBaseline = 'top';
  tiles.forEach(({ id, img }, i) => {
    const x = pad + (i % cols)*(tw + pad), y = pad + Math.floor(i/cols)*(th + lab + pad);
    ctx.fillText(`${STYLES[id].name} · style=${id}`, x, y + 6);
    ctx.drawImage(img, x, y + lab, tw, th);
  });
  fs.writeFileSync(path.join(out, 'all-styles.jpg'), await sheet.encode('jpeg', 88));
  console.log(`Wrote ${tiles.length} previews and previews/all-styles.jpg`);
}
main().catch(e => { console.error(e); process.exit(1); });
