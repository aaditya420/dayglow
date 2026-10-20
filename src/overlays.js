'use strict';
// Everything drawn on top of the art: calendar views, legibility scrim, festival accents, caption.
const { TAU, rgba, glyph, rrect, glow } = require('./core');
const { FAMILY: FONT } = require('./fonts');
const { D } = require('./time');

// Calendar colours. Every text colour keeps at least 4.5:1 contrast on the scrim at any hour
// (test/overlays.test.js); past days are bold and brighter, days to come lighter in weight.
const C = Object.freeze({
  past: '#d2dbe8', future: '#7b9bb0', futureText: '#a3b7c8', today: '#f5cd70',
  text: '#f1f4f9', dim: '#aebbcc', band: 'rgba(170,186,210,0.12)', holiday: '#ff9e8b',
});
/** A soft dark halo behind calendar text so it stays readable over busy art. */
function halo(ctx, W){ ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = W*0.007; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = MONTHS.map(m => m.slice(0, 3));
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const LETTERS = 'MTWTFSS';
const spaced = s => s.split('').join(' '); // hair spaces for small caps tracking

/**
 * Where things sit on each screen, as fractions of the image height.
 * lock: below the big clock, footer between the flashlight and camera buttons.
 * home: below a row of widgets and above the page dots and dock, with no footer (the dock covers it).
 * horizon: where ground-line styles (arcade, city, garden, tide, sky) end, so their edge stays
 * clear of the calendar header: the bottom of the clock on the lock screen, the bottom of a
 * widget row on the home screen.
 */
const LAYOUTS = Object.freeze({
  lock: {
    month: { top: 0.592, labelH: 0.022, row: 0.029, row6: 0.027, holidayGap: 0.022, weekGap: 0.032, weekLetters: true },
    year: { top: 0.597, bottom: 0.845 },
    zones: { month: [0.545, 0.885], year: [0.555, 0.86], none: null },
    horizon: 0.535, diyaY: 0.555, footer: true, caption: true,
  },
  home: {
    month: { top: 0.566, labelH: 0.02, row: 0.0262, row6: 0.0235, holidayGap: 0.021, weekGap: 0.03, weekLetters: false },
    year: { top: 0.585, bottom: 0.79 },
    zones: { month: [0.525, 0.81], year: [0.53, 0.8], none: null },
    horizon: 0.512, diyaY: 0.533, footer: false, caption: false,
  },
});
const layoutFor = screen => LAYOUTS[screen] || LAYOUTS.lock;

function header(ctx, W, left, sub, right, x0, x1, y){
  ctx.save(); halo(ctx, W);
  const fs = Math.round(W*0.036);
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.font = `700 ${fs}px ${FONT}`; ctx.fillStyle = C.text; ctx.fillText(left, x0, y);
  const lw = ctx.measureText(left).width;
  ctx.font = `600 ${Math.round(fs*0.62)}px ${FONT}`; ctx.fillStyle = C.dim; ctx.fillText(spaced(sub), x0 + lw + fs*0.45, y);
  ctx.textAlign = 'right'; ctx.font = `700 ${fs}px ${FONT}`; ctx.fillStyle = C.text; ctx.fillText(right, x1, y);
  ctx.restore();
}
function footer(ctx, W, H, text){
  ctx.save(); halo(ctx, W);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${Math.round(W*0.028)}px ${FONT}`; ctx.fillStyle = C.dim;
  ctx.fillText(text, W/2, H*0.908); // sits between the flashlight and camera buttons
  ctx.restore();
}
function fit(ctx, text, maxW){
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 4 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

/** 365-day grid of geometric symbols; the symbol changes with the month. */
function drawYear(ctx, W, H, I, L = LAYOUTS.lock){
  const { y, doy: day, total, hol } = I;
  const cols = 23, rows = Math.ceil(total/cols);
  const gTop = H*L.year.top, cell = Math.min(W*0.78/cols, (H*L.year.bottom - gTop)/rows);
  const gW = cell*cols, gLeft = (W - gW)/2, r = cell*0.3;
  header(ctx, W, String(y), `DAY ${day} OF ${total}`, (day/total*100).toFixed(1) + '%', gLeft + cell*0.1, gLeft + gW - cell*0.1, gTop - cell*0.75);
  for (let i = 0; i < total; i++){
    const cx = gLeft + (i % cols)*cell + cell/2, cy = gTop + Math.floor(i/cols)*cell + cell/2;
    const type = D(y, 0, i + 1).getUTCMonth() % 4;
    if (i + 1 === day){
      ctx.save(); ctx.shadowColor = C.today; ctx.shadowBlur = cell*0.6; ctx.strokeStyle = C.today; ctx.lineWidth = cell*0.1;
      glyph(ctx, type, cx, cy, r*1.25); glyph(ctx, type, cx, cy, r*1.25); // twice for a stronger glow
      ctx.restore();
      continue;
    }
    const past = i + 1 < day, isHol = hol.isYearDay(y, i);
    ctx.globalAlpha = isHol ? (past ? 0.7 : 1) : past ? 0.95 : 0.85;
    ctx.strokeStyle = isHol ? C.holiday : past ? C.past : C.future;
    ctx.lineWidth = cell*(past || isHol ? 0.075 : 0.06);
    glyph(ctx, type, cx, cy, r);
  }
  ctx.globalAlpha = 1;
  const left = total - day;
  if (L.footer) footer(ctx, W, H, left === 1 ? '1 day left' : `${left} days left`);
}

/** Month calendar (Monday first), next-holiday line and a seven-segment week strip. */
function drawMonthWeek(ctx, W, H, I, L = LAYOUTS.lock){
  const { y, m, d, dim, week, weekday: wd, hol } = I;
  const offset = (D(y, m, 1).getUTCDay() + 6) % 7, rows = Math.ceil((offset + dim)/7);
  const gW = W*0.78, gLeft = (W - gW)/2, cw = gW/7, x0 = gLeft + cw*0.12, x1 = gLeft + gW - cw*0.12;
  const M = L.month, top = H*M.top, labelH = H*M.labelH, ch = H*(rows === 6 ? M.row6 : M.row);
  const gridTop = top + labelH, gridBottom = gridTop + rows*ch, type = m % 4;
  ctx.save(); halo(ctx, W);

  header(ctx, W, MONTHS[m], `DAY ${d} OF ${dim}`, (d/dim*100).toFixed(1) + '%', x0, x1, top - H*0.012);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(W*0.024)}px ${FONT}`; ctx.fillStyle = C.dim;
  for (let i = 0; i < 7; i++) ctx.fillText(LETTERS[i], gLeft + i*cw + cw/2, top + labelH*0.45);

  const curRow = Math.floor((offset + d - 1)/7);
  ctx.fillStyle = C.band; rrect(ctx, gLeft + cw*0.06, gridTop + curRow*ch + ch*0.06, gW - cw*0.12, ch*0.88, ch*0.44); ctx.fill();

  const nfs = Math.round(W*0.033);
  for (let i = 1; i <= dim; i++){
    const idx = offset + i - 1, cx = gLeft + (idx % 7)*cw + cw/2, cy = gridTop + Math.floor(idx/7)*ch + ch/2;
    const isHol = Boolean(hol.name(y, m, i));
    if (i === d){
      ctx.save(); ctx.shadowColor = C.today; ctx.shadowBlur = ch*0.5; ctx.strokeStyle = C.today; ctx.lineWidth = W*0.0045;
      glyph(ctx, type, cx, cy + (type === 0 ? -ch*0.04 : 0), ch*0.56); ctx.restore();
      ctx.font = `700 ${nfs}px ${FONT}`; ctx.fillStyle = C.today;
    } else if (isHol){
      ctx.font = `700 ${nfs}px ${FONT}`; ctx.fillStyle = C.holiday; ctx.globalAlpha = i < d ? 0.75 : 1;
    } else {
      ctx.font = `${i < d ? 700 : 500} ${nfs}px ${FONT}`; ctx.fillStyle = i < d ? C.past : C.futureText;
    }
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText(String(i), cx, cy + nfs*0.04);
    if (isHol){ ctx.beginPath(); ctx.arc(cx, cy + nfs*0.66, W*0.0042, 0, TAU); ctx.fillStyle = C.holiday; ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  let lineY = gridBottom;
  const nh = hol.next(y, m, d);
  if (nh){
    lineY = gridBottom + H*M.holidayGap;
    const fs2 = Math.round(W*0.026);
    ctx.textBaseline = 'alphabetic';
    ctx.beginPath(); ctx.arc(x0 + W*0.006, lineY - fs2*0.34, W*0.0058, 0, TAU); ctx.fillStyle = C.holiday; ctx.fill();
    const when = nh.days === 0 ? 'Today' : nh.days === 1 ? 'Tomorrow' : `in ${nh.days} days`;
    ctx.font = `600 ${fs2}px ${FONT}`;
    ctx.textAlign = 'right'; ctx.fillStyle = C.holiday; ctx.fillText(when, x1, lineY);
    const label = `${nh.name} · ${SHORT_DAYS[nh.date.getUTCDay()]} ${nh.date.getUTCDate()} ${SHORT_MONTHS[nh.date.getUTCMonth()]}`;
    const maxW = (x1 - ctx.measureText(when).width - fs2) - (x0 + W*0.022);
    ctx.textAlign = 'left'; ctx.fillStyle = C.text; ctx.fillText(fit(ctx, label, maxW), x0 + W*0.022, lineY);
  }

  const wTop = lineY + H*(nh ? M.weekGap : M.weekGap - 0.002);
  header(ctx, W, `Week ${week}`, DAYS[wd].toUpperCase(), Math.round((wd + 1)/7*100) + '%', x0, x1, wTop);
  const segGap = W*0.012, segW = (x1 - x0 - segGap*6)/7, segH = H*0.009, sy = wTop + H*0.014;
  for (let i = 0; i < 7; i++){
    rrect(ctx, x0 + i*(segW + segGap), sy, segW, segH, segH/2);
    if (i === wd){ ctx.save(); ctx.shadowColor = C.today; ctx.shadowBlur = segH*1.6; ctx.fillStyle = C.today; ctx.fill(); ctx.restore(); }
    else if (i < wd){ ctx.globalAlpha = 0.9; ctx.fillStyle = C.past; ctx.fill(); ctx.globalAlpha = 1; }
    else { ctx.strokeStyle = C.future; ctx.lineWidth = W*0.003; ctx.stroke(); }
  }
  if (M.weekLetters){
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = `700 ${Math.round(W*0.021)}px ${FONT}`;
    for (let i = 0; i < 7; i++){
      ctx.fillStyle = i === wd ? C.today : i < wd ? C.dim : C.futureText;
      ctx.fillText(LETTERS[i], x0 + i*(segW + segGap) + segW/2, sy + segH + H*0.016);
    }
  }
  ctx.restore();
  const leftM = dim - d;
  if (L.footer) footer(ctx, W, H, leftM === 0 ? 'Last day of the month' : `${leftM} ${leftM === 1 ? 'day' : 'days'} left in ${MONTHS[m]}`);
}

/** How far the scrim fades out above and below the calendar zone, as fractions of the height. */
const SCRIM_FEATHER = Object.freeze({ top: 0.2, bottom: 0.12 });
/** Darken the art behind the calendar so text stays readable on busy styles. */
function scrim(ctx, W, H, P, zone, s){
  if (!(s > 0)) return;
  ctx.fillStyle = `rgba(0,0,0,${0.16*s})`; ctx.fillRect(0, 0, W, H);
  if (!zone) return;
  // Full strength over the zone, fading out above and below along a smoothstep curve so the
  // band has no visible edge.
  const y0 = zone[0]*H, y1 = zone[1]*H, a = Math.max(0, y0 - H*SCRIM_FEATHER.top), b = Math.min(H, y1 + H*SCRIM_FEATHER.bottom);
  const g = ctx.createLinearGradient(0, a, 0, b), span = b - a, peak = 0.78*s;
  for (let k = 0; k <= 16; k++){
    const t = k/16, e = t*t*(3 - 2*t);
    g.addColorStop((t*(y0 - a))/span, rgba(P.bg1, peak*e));
    g.addColorStop((y1 - a + (1 - t)*(b - y1))/span, rgba(P.bg1, peak*e));
  }
  ctx.fillStyle = g; ctx.fillRect(0, a, W, span);
}
function vignette(ctx, W, H){
  const v = ctx.createRadialGradient(W/2, H/2, H*0.35, W/2, H/2, H*0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

/** Light-touch decorations for the day's holiday, matched by name. */
function festival(ctx, W, H, R, name, L = LAYOUTS.lock){
  if (!name) return;
  if (/Diwali|Deepavali/.test(name)){
    for (let i = 0; i < 46; i++) glow(ctx, R()*W, R()*H*0.55, W*(0.01 + R()*0.05), R() < 0.5 ? '#ffb347' : '#ffd88a', 0.25 + R()*0.35);
    for (let i = 0; i < 9; i++){ // a row of diyas just above the calendar
      const x = W*(0.08 + i*0.105), y = H*L.diyaY;
      glow(ctx, x, y - W*0.012, W*0.03, '#ffb347', 0.7);
      ctx.fillStyle = '#ffd88a'; ctx.beginPath(); ctx.ellipse(x, y - W*0.012, W*0.004, W*0.009, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9b4227'; ctx.beginPath(); ctx.ellipse(x, y, W*0.016, W*0.006, 0, 0, Math.PI); ctx.fill();
    }
  } else if (/Holi/.test(name)){
    const cols = ['#ff5fa2', '#ffd23f', '#3bd18f', '#4fa3ff', '#b46bff', '#ff8a3d'];
    for (let b = 0; b < 7; b++){
      const bx = R() < 0.5 ? R()*W*0.25 : W - R()*W*0.25, by = R()*H*0.55;
      ctx.fillStyle = cols[b % cols.length];
      for (let i = 0; i < 420; i++){
        const a = R()*TAU, dd = Math.pow(R(), 1.6)*W*0.22;
        ctx.globalAlpha = 0.05 + R()*0.18; ctx.beginPath(); ctx.arc(bx + Math.cos(a)*dd, by + Math.sin(a)*dd, W*(0.002 + R()*0.006), 0, TAU); ctx.fill();
      }
    }
  } else if (/Independence|Republic/.test(name)){
    ['#ff9933', '#f4f4f4', '#138808'].forEach((col, k) => {
      ctx.beginPath();
      for (let x = -10; x <= W + 10; x += W/60){ const yy = H*(0.3 + k*0.012) + Math.sin(x/W*4 + k*0.3)*H*0.05 - (x/W)*H*0.12; x < 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
      ctx.strokeStyle = col; ctx.globalAlpha = 0.22; ctx.lineWidth = H*0.008; ctx.stroke();
    });
  } else if (/Christmas/.test(name)){
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 260; i++){ ctx.globalAlpha = 0.2 + R()*0.6; ctx.beginPath(); ctx.arc(R()*W, R()*H, W*(0.001 + R()*0.004), 0, TAU); ctx.fill(); }
  } else if (/Id-|Eid|Bakrid|Muharram|Milad/.test(name)){
    const x = W*0.8, y = H*0.1, r = W*0.06;
    glow(ctx, x, y, r*3, '#f3d58c', 0.3);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.arc(x + r*0.42, y - r*0.18, r*0.86, 0, TAU, true); ctx.fillStyle = '#f3d58c'; ctx.fill('evenodd');
    for (let i = 0; i < 14; i++) glow(ctx, R()*W, R()*H*0.5, W*0.012, '#f3d58c', 0.5);
  } else {
    for (let i = 0; i < 70; i++) glow(ctx, R()*W, R()*H*0.6, W*(0.006 + R()*0.012), R() < 0.5 ? '#e8907f' : '#f3d58c', 0.5);
  }
  ctx.globalAlpha = 1;
}

/** Small caption above the home indicator. */
function caption(ctx, W, H, text){
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.font = `600 ${Math.round(W*0.02)}px ${FONT}`; ctx.fillStyle = 'rgba(225,232,242,0.72)';
  ctx.fillText(fit(ctx, text, W*0.86), W/2, H*0.958);
}

module.exports = { C, LAYOUTS, layoutFor, drawYear, drawMonthWeek, scrim, vignette, festival, caption };
