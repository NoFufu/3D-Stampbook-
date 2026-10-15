/* Prozedurale Marken (Karo & Tierfell), nachgezeichnet nach den ersten zwei Heftseiten.
 * Läuft nur im Browser (Canvas 2D). */
type Ctx = CanvasRenderingContext2D;
type Rng = () => number;
type Draw = (ctx: Ctx, r: Rng) => void;
const W = 180, H = 220;
const mulberry = (a: number): Rng => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const frac = (x: number) => x - Math.floor(x);

/* ---------- Zähnung: Kontur mit eckigen Zähnen wie beim Ausstanzen ---------- */
function perfPath(ctx: Ctx, w: number, h: number) {
  const d = w * 0.055;
  const edge = (px: number, py: number, qx: number, qy: number, nx: number, ny: number, first = false) => {
    const len = Math.hypot(qx - px, qy - py);
    let n = Math.round(len / (w / 9)); if (n % 2 === 0) n++;
    const dx = (qx - px) / n, dy = (qy - py) / n;
    for (let i = 0; i < n; i++) {
      const o = i % 2 ? d : 0;
      const ax = px + dx * i + nx * o, ay = py + dy * i + ny * o;
      if (first && i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
      ctx.lineTo(ax + dx, ay + dy);
    }
  };
  ctx.beginPath();
  edge(0, 0, w, 0, 0, 1, true);
  edge(w, 0, w, h, -1, 0);
  edge(w, h, 0, h, 0, -1);
  edge(0, h, 0, 0, 1, 0);
  ctx.closePath();
}

function noise(ctx: Ctx, r: Rng, n: number, a: number) {
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = a * r();
    ctx.fillStyle = r() < .5 ? '#000' : '#fff';
    ctx.fillRect(r() * W, r() * H, 1, 1);
  }
  ctx.globalAlpha = 1;
}
function fur(ctx: Ctx, r: Rng, n: number, ang: number, light: string, dark: string, alpha = .3, len = 7) {
  ctx.lineWidth = .9; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, a = ang + (r() - .5) * .6, l = len * (.5 + r());
    ctx.globalAlpha = alpha * (.4 + r() * .6);
    ctx.strokeStyle = r() < .5 ? light : dark;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- Karo ---------- */
type Sett = [string, number][];
function sett(ctx: Ctx, s: Sett, alpha: number, vertical: boolean) {
  const full = s.concat(s.slice().reverse());
  let pos = -W * 1.2, i = 0;
  ctx.globalAlpha = alpha;
  while (pos < W * 2.2) {
    const [c, w] = full[i % full.length];
    ctx.fillStyle = c;
    if (vertical) ctx.fillRect(pos, -H, w, H * 3); else ctx.fillRect(-W, pos, W * 3, w);
    pos += w; i++;
  }
  ctx.globalAlpha = 1;
}
function twill(ctx: Ctx) {
  ctx.lineWidth = 1;
  for (let k = -H; k < W + H; k += 3) {
    ctx.strokeStyle = 'rgba(0,0,0,.13)'; ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + H, H); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(k + 1.5, 0); ctx.lineTo(k + 1.5 + H, H); ctx.stroke();
  }
}
function plaid(o: { bg: string; s: Sett; diag?: boolean; gingham?: boolean; scale?: number }): Draw {
  return (ctx, r) => {
    ctx.fillStyle = o.bg; ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (o.diag) { ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 4); ctx.translate(-W / 2, -H / 2); }
    const sc = o.scale || 1; ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
    sett(ctx, o.s, o.gingham ? .55 : 1, true);
    sett(ctx, o.s, o.gingham ? .55 : .55, false);
    ctx.restore();
    twill(ctx);
    noise(ctx, r, 2500, .12);
  };
}
function houndstooth(dark: string, light: string): Draw {
  return (ctx, r) => {
    const c = 6, bmp: number[] = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      let v;
      if (x < 4 && y < 4) v = 1; else if (x >= 4 && y >= 4) v = 0;
      else v = ((x + y) % 4) < 2 ? 1 : 0;
      bmp.push(v);
    }
    ctx.fillStyle = light; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.05); ctx.translate(-W / 2, -H / 2);
    ctx.fillStyle = dark;
    for (let ty = -2; ty < H / (8 * c) + 2; ty++) for (let tx = -2; tx < W / (8 * c) + 2; tx++)
      for (let i = 0; i < 64; i++) if (bmp[i]) ctx.fillRect(tx * 8 * c + (i % 8) * c, ty * 8 * c + Math.floor(i / 8) * c, c + .3, c + .3);
    ctx.restore();
    twill(ctx); noise(ctx, r, 3000, .18);
  };
}
function patchwork(ctx: Ctx, r: Rng) {
  const q: [string, string][] = [['#e0b22c', '#2a2416'], ['#1c1d3a', '#35406a'], ['#e8e4dc', '#6b7a8a'], ['#e0472a', '#c91f5a']];
  q.forEach(([a, b], k) => {
    const x0 = (k % 2) * W / 2, y0 = Math.floor(k / 2) * H / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, W / 2, H / 2); ctx.clip();
    ctx.fillStyle = a; ctx.fillRect(x0, y0, W / 2, H / 2);
    for (let y = y0; y < y0 + H / 2; y += 4) for (let x = x0 + ((y / 4) % 2) * 2; x < x0 + W / 2; x += 4) {
      ctx.fillStyle = b; ctx.globalAlpha = .55; ctx.fillRect(x, y, 2, 3);
    }
    ctx.globalAlpha = 1; ctx.restore();
  });
  ctx.fillStyle = '#2a5a3a'; ctx.globalAlpha = .7; ctx.fillRect(W * .6, 0, 6, H); ctx.fillRect(0, H * .48, W, 5); ctx.globalAlpha = 1;
  noise(ctx, r, 3500, .25);
}

/* ---------- Tierfell & Co ---------- */
function rosettes(bg1: string, bg2: string, inner: string, spot: string, light: string): Draw {
  return (ctx, r) => {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, bg1); g.addColorStop(1, bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    fur(ctx, r, 1800, 1.2, light, '#3a2a1a', .25);
    for (let k = 0; k < 7; k++) {
      const cx = r() * W, cy = r() * H, R = 20 + r() * 14;
      ctx.fillStyle = inner; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.ellipse(cx, cy, R * .8, R * .65, r() * 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      const m = 4 + Math.floor(r() * 3);
      ctx.fillStyle = spot;
      for (let j = 0; j < m; j++) {
        if (r() < .15) continue;
        const a = j / m * Math.PI * 2 + r() * .4;
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * R, cy + Math.sin(a) * R * .85, 7 + r() * 7, 5 + r() * 5, a, 0, 7); ctx.fill();
      }
    }
    fur(ctx, r, 2600, 1.2, light, '#000', .3);
  };
}
function zebra(ctx: Ctx, r: Rng) {
  ctx.fillStyle = '#ebe8e2'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#131313';
  for (let i = -12; i < 20; i++) {
    const top: number[][] = [], bot: number[][] = [];
    for (let x = -10; x <= W + 10; x += 6) {
      const y = i * 26 - x * .75 + Math.sin(x * .025 + i) * 7 + 60;
      const th = 10 + Math.sin(i * 1.7) * 3 + x * .02;
      top.push([x, y]); bot.push([x, y + th]);
    }
    ctx.beginPath(); top.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    bot.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.fill();
  }
  fur(ctx, r, 3500, -.65, '#fff', '#000', .28);
}
function tiger(ctx: Ctx, r: Rng) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e3791c'); g.addColorStop(1, '#f2a446');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  fur(ctx, r, 2000, .25, '#ffd9a0', '#8a3a0a', .3);
  ctx.fillStyle = '#16100c';
  for (let i = 0; i < 7; i++) {
    const y0 = i * 34 + r() * 14, fromLeft = r() < .5, len = 110 + r() * 110, T = 12 + r() * 10;
    const x0 = fromLeft ? -10 : W + 10 - len;
    const top: number[][] = [], bot: number[][] = [];
    for (let s = 0; s <= 1.0001; s += .05) {
      const x = x0 + s * len, y = y0 + Math.sin(s * 3 + i) * 8 + s * 18;
      const t = T * Math.sin(Math.PI * (fromLeft ? (s * .5 + .5) : s * .5 + .0)) ** .6;
      top.push([x, y - t / 2]); bot.push([x, y + t / 2]);
    }
    ctx.beginPath(); top.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    bot.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.fill();
  }
  fur(ctx, r, 3000, .25, '#ffe2b0', '#000', .3);
}
function deer(ctx: Ctx, r: Rng) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#7a3e1c'); g.addColorStop(1, '#a5592a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  fur(ctx, r, 3500, 1.9, '#d89060', '#3a1a08', .35, 10);
  for (let k = 0; k < 5; k++) {
    const x = 20 + r() * (W - 40), y = 15 + r() * (H - 30), R = 9 + r() * 7;
    const rg = ctx.createRadialGradient(x, y, 1, x, y, R);
    rg.addColorStop(0, 'rgba(250,246,240,1)'); rg.addColorStop(.6, 'rgba(240,230,220,.85)'); rg.addColorStop(1, 'rgba(240,230,220,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(x, y, R, R * 1.15, .3, 0, 7); ctx.fill();
  }
  fur(ctx, r, 1500, 1.9, '#e0a070', '#2a1206', .3, 10);
}
function python(ctx: Ctx, r: Rng) {
  const s = 8;
  ctx.fillStyle = '#1a1410'; ctx.fillRect(0, 0, W, H);
  for (let gy = 0; gy * s * .8 < H + s; gy++) for (let gx = -1; gx * s < W + s; gx++) {
    const cx = gx * s + (gy % 2 ? s / 2 : 0), cy = gy * s * .8;
    const u = cx / 62, v = cy / 62;
    const d = Math.abs(frac(u + v) - .5) + Math.abs(frac(u - v) - .5);
    let c;
    if (d < .16) c = '#e2c39a'; else if (d < .3) c = '#b56b2c'; else if (d < .37) c = '#17120e';
    else if (d < .52) c = cy > H * .65 ? '#3a64b0' : '#d49352'; else c = cy > H * .6 ? '#2a4a8e' : '#7a4a22';
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.roundRect(cx - s / 2 + .7, cy - s / 2 + .7, s - 1.4, s - 1.4, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(cx - s / 2 + 1.5, cy - s / 2 + 1.5, s - 4, 1.4);
  }
}
function croc(ctx: Ctx, r: Rng) {
  ctx.fillStyle = '#2a2612'; ctx.fillRect(0, 0, W, H);
  const cols: [number, number][] = [[-8, 52], [48, 86], [138, 60]];
  cols.forEach(([x, w], ci) => {
    let y = -20 + ci * 18;
    while (y < H) {
      const h = 60 + r() * 26;
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#7a6a2a'); g.addColorStop(.5, '#4a4018'); g.addColorStop(1, '#221e0c');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, w - 6, h - 6, 10); ctx.fill();
      ctx.strokeStyle = '#0e0c06'; ctx.lineWidth = 3; ctx.stroke();
      y += h;
    }
  });
  for (let i = 0; i < 2500; i++) { ctx.globalAlpha = r() * .35; ctx.fillStyle = r() < .6 ? '#d4b04a' : '#0c0a04'; ctx.fillRect(r() * W, r() * H, 1.5, 1.5); }
  ctx.globalAlpha = 1;
}
function iguana(ctx: Ctx, r: Rng) {
  const pts: number[][] = [], sp = 28;
  for (let y = -1; y * sp < H + sp; y++) for (let x = -1; x * sp < W + sp; x++)
    pts.push([x * sp + (y % 2) * sp / 2 + (r() - .5) * 10, y * sp * .9 + (r() - .5) * 10, .75 + r() * .45]);
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let d1 = 1e9, d2 = 1e9, p1: number[] = pts[0];
    for (const p of pts) { const d = Math.hypot(x - p[0], y - p[1]); if (d < d1) { d2 = d1; d1 = d; p1 = p; } else if (d < d2) d2 = d; }
    const e = d2 - d1, k = (y * W + x) * 4;
    let R: number, G: number, B: number;
    if (e < 2.4) { R = 12; G = 52; B = 16; }
    else {
      const hl = Math.max(0, 1 - Math.hypot(x - p1[0] + 5, y - p1[1] + 5) / 16) * 70;
      R = (40 + hl * .8) * p1[2]; G = (130 + hl) * p1[2]; B = (42 + hl * .5) * p1[2];
    }
    img.data[k] = R; img.data[k + 1] = G; img.data[k + 2] = B; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noise(ctx, r, 2000, .2);
}
function fish(ctx: Ctx, r: Rng) {
  ctx.fillStyle = '#0d3a5a'; ctx.fillRect(0, 0, W, H);
  const R = 17;
  for (let row = 0; row * 12 < H + R * 2; row++) for (let i = -1; i * R * 1.6 < W + R; i++) {
    const cx = i * R * 1.6 + (row % 2 ? R * .8 : 0), cy = row * 12 - R;
    const hue = 190 + (cx / W) * 25 - (cy / H) * 10 + (r() - .5) * 10;
    const g = ctx.createLinearGradient(cx, cy, cx, cy + R);
    g.addColorStop(0, `hsl(${hue},65%,${30 + r() * 8}%)`); g.addColorStop(.75, `hsl(${hue},75%,${55 + r() * 10}%)`); g.addColorStop(1, `hsl(${hue - 10},80%,88%)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI); ctx.lineTo(cx - R, cy); ctx.fill();
    ctx.strokeStyle = 'rgba(5,30,50,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'soft-light';
  const ir = ctx.createLinearGradient(0, 0, W, H);
  ['#ff80c0', '#ffe080', '#80ffc0', '#80c0ff', '#e080ff'].forEach((c, k) => ir.addColorStop(k / 4, c));
  ctx.fillStyle = ir; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const sh = ctx.createRadialGradient(W * .55, H * .35, 5, W * .55, H * .35, 90);
  sh.addColorStop(0, 'rgba(255,255,255,.45)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
}
function peacock(ctx: Ctx, r: Rng) {
  ctx.fillStyle = '#25402a'; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = .9;
  for (let i = 0; i < 260; i++) {
    const a = -1.2 + r() * 1.1, x = r() * W * 1.2 - 20, y = H + 10;
    ctx.strokeStyle = ['#5a7a3a', '#8a7a3a', '#2f5a3a', '#a08a4a'][Math.floor(r() * 4)]; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 60, y - 120, x + Math.cos(a) * 260, y + Math.sin(a) * 260); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const cx = W * .66, cy = H * .38;
  ([[66, 76, '#4e6a2c'], [56, 64, '#b07a4a'], [40, 48, '#1f7a6e'], [32, 40, '#1d3fa8'], [20, 26, '#0f1838']] as [number, number, string][]).forEach(([a, b, c], k) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx + k * 2, cy + k * 3, a, b, -.35, 0, 7); ctx.fill();
  });
  ctx.lineWidth = .6; ctx.globalAlpha = .22;
  for (let i = 0; i < 300; i++) {
    const a = r() * 7, d = r() * 80; ctx.strokeStyle = r() < .5 ? '#000' : '#cde';
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); ctx.lineTo(cx + Math.cos(a) * (d + 8), cy + Math.sin(a) * (d + 8)); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function shell(ctx: Ctx, r: Rng) {
  ctx.fillStyle = '#24160b'; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 9; k++) {
    const x = r() * W, y = r() * H, R = 20 + r() * 30;
    const g = ctx.createRadialGradient(x, y, 2, x, y, R);
    g.addColorStop(0, 'rgba(214,150,70,.9)'); g.addColorStop(1, 'rgba(214,150,70,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 3) {
    ctx.strokeStyle = r() < .5 ? 'rgba(140,80,30,.35)' : 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H * .5, H * .55); ctx.lineTo(i, H); ctx.stroke();
  }
  ctx.strokeStyle = '#0d0703'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(W * .5, 0); ctx.lineTo(W * .62, H * .58); ctx.lineTo(W, H * .5); ctx.moveTo(W * .62, H * .58); ctx.lineTo(W * .45, H); ctx.stroke();
}
function macaw(ctx: Ctx, r: Rng) {
  ctx.fillStyle = '#d8201a'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-.6); ctx.translate(-W / 2, -H / 2);
  const pal = (u: number) => u < .18 ? ['#1a5ab0', '#2a9a4a'][Math.floor(r() * 2)] : u < .5 ? ['#f0b818', '#f4a414', '#e8701a'][Math.floor(r() * 3)] : ['#d8201a', '#c41a14', '#e2321c'][Math.floor(r() * 3)];
  for (let y = -80; y < H + 120; y += 22) for (let x = -80; x < W + 80; x += 24) {
    const u = (x + 80) / (W + 160);
    const c = pal(u + (r() - .5) * .08);
    const g = ctx.createLinearGradient(x - 12, 0, x + 12, 0);
    g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(.5, c); g.addColorStop(1, 'rgba(0,0,0,.25)');
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, 13, 46, 0, 0, 7); ctx.fill();
    ctx.fillStyle = g; ctx.globalAlpha = .55; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x, y + 40); ctx.stroke();
  }
  ctx.restore();
  noise(ctx, r, 2000, .2);
}

/* ---------- Katalog ---------- */
const KARO: [string, Draw][] = [
  ['Kamelkaro', plaid({ diag: true, bg: '#d6bd9c', s: [['#111', 14], ['#d6bd9c', 10], ['#f6f2ea', 8], ['#d6bd9c', 10], ['#111', 4], ['#d6bd9c', 14], ['#b3322b', 2]] })],
  ['Blauer Tartan', plaid({ bg: '#1b2f8a', s: [['#1b2f8a', 30], ['#c8202f', 3], ['#1b2f8a', 10], ['#e8c53a', 2], ['#1b2f8a', 14], ['#1d6b3a', 8]] })],
  ['Vichy Braun', plaid({ gingham: true, bg: '#efe6da', s: [['#5a1f14', 12], ['#efe6da', 12]] })],
  ['Senfkaro', plaid({ bg: '#e9b34a', s: [['#1d1d18', 36], ['#e9b34a', 16], ['#c4381c', 2], ['#e9b34a', 16], ['#1d1d18', 4]] })],
  ['Rotes Diagonal', plaid({ diag: true, bg: '#e2463a', s: [['#e2463a', 20], ['#1a1a2a', 3], ['#e2463a', 6], ['#fff', 2], ['#e2463a', 14], ['#152040', 24], ['#6b7480', 8]] })],
  ['Madras', plaid({ bg: '#f1d77a', s: [['#d23a5a', 3], ['#f1d77a', 6], ['#5a2a7a', 2], ['#f1d77a', 8], ['#e06a3a', 4], ['#f1d77a', 5]] })],
  ['Nachtblau', plaid({ bg: '#14182a', s: [['#14182a', 28], ['#fff', 4], ['#14182a', 6], ['#fff', 2], ['#14182a', 20], ['#b8202a', 3]] })],
  ['Patchwork', patchwork],
  ['Black Watch', plaid({ diag: true, bg: '#0f2a1e', s: [['#0f2a1e', 24], ['#0b1230', 18], ['#0f2a1e', 6], ['#c9c9a0', 1], ['#0f2a1e', 6], ['#7a1a2a', 2]] })],
  ['Hahnentritt', houndstooth('#1b1410', '#c9a77c')],
  ['Bordeaux-Karo', plaid({ bg: '#6a1a1a', s: [['#6a1a1a', 16], ['#111', 8], ['#fff', 2], ['#111', 8], ['#6a1a1a', 10], ['#e8e2d0', 3]] })],
  ['Royal Stewart', plaid({ bg: '#d42a26', s: [['#d42a26', 18], ['#121a3a', 10], ['#d42a26', 4], ['#fff', 1], ['#d42a26', 4], ['#121a3a', 2], ['#d42a26', 8], ['#e6c34a', 1], ['#2a5a2a', 10]] })],
];
const TIER: [string, Draw][] = [
  ['Leopard', rosettes('#c46e24', '#e2a052', '#9b4f1c', '#1a120c', '#f0c080')],
  ['Python', python], ['Krokodil', croc], ['Leguan', iguana],
  ['Zebra', zebra], ['Fischschuppe', fish], ['Pfauenauge', peacock], ['Schildpatt', shell],
  ['Ara', macaw], ['Reh', deer], ['Tiger', tiger],
  ['Schneeleopard', rosettes('#bdb8b2', '#dcd8d2', '#a8a29a', '#29262a', '#f4f2ee')],
];


export type StampDef = { id: string; name: string; theme: string; perf: number; draw: Draw; seed: number };

const toDefs = (list: [string, Draw][], theme: string, prefix: string, base: number): StampDef[] =>
  list.map(([name, draw], i) => ({
    id: prefix + String(i + 1).padStart(2, "0"),
    name,
    theme,
    perf: 11 + (i % 3) * 0.5,
    draw,
    seed: base + i * 97,
  }));

export const KARO_STAMPS = toDefs(KARO, "Karo", "K-", 11);
export const TIER_STAMPS = toDefs(TIER, "Tierfell", "T-", 503);
export const ALL_STAMPS = [...KARO_STAMPS, ...TIER_STAMPS];
export const STAMP_W = W;
export const STAMP_H = H;

/** Zeichnet eine Marke (mit Zähnung) auf ein neues Canvas. */
export function renderStamp(def: StampDef, scale = 1): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W * scale;
  c.height = H * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  perfPath(ctx, W, H);
  ctx.save();
  ctx.clip();
  def.draw(ctx, mulberry(def.seed));
  ctx.restore();
  return c;
}

const cache = new Map<string, string>();
export function stampDataUrl(def: StampDef): string {
  let u = cache.get(def.id);
  if (!u) {
    u = renderStamp(def, 2).toDataURL("image/png");
    cache.set(def.id, u);
  }
  return u;
}
