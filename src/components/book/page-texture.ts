import { loadStamp, type StampDef } from "@/lib/stamps";
import type { PageSpec } from "@/lib/pages";

export const TEX_W = 1024;
export const TEX_H = 1126; // Seitenverhältnis 1 : 1.1 wie das echte Heft

/** Klickbarer Bereich auf einer Seite, in Seitenkoordinaten 0..1 (v = 0 oben). */
export type HitRegion =
  | { kind: "stamp"; stamp: StampDef; u0: number; v0: number; u1: number; v1: number }
  | { kind: "add" | "photo"; u0: number; v0: number; u1: number; v1: number };

export type PageFonts = { display: string; mono: string; pencil: string; body: string };

const PAPER = "#f2ede3";

function paper(ctx: CanvasRenderingContext2D, side: "front" | "back") {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Wolkigkeit: große, weiche Flecken wie bei ungestrichenem Papier
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * TEX_W, y = Math.random() * TEX_H, r = 120 + Math.random() * 260;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() < 0.55;
    const c = dark ? "150,125,90" : "255,255,250";
    g.addColorStop(0, `rgba(${c},${dark ? 0.05 : 0.2})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Fasern
  ctx.lineCap = "round";
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * TEX_W, y = Math.random() * TEX_H;
    const a = Math.random() * Math.PI, l = 8 + Math.random() * 30;
    ctx.strokeStyle = Math.random() < 0.6 ? `rgba(120,95,60,${0.04 + Math.random() * 0.06})` : "rgba(255,255,255,.35)";
    ctx.lineWidth = 0.6 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (Math.random() - 0.5) * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  // feines Korn pro Pixel
  // Korn in zwei Größen: grob (3 px, bleibt auch verkleinert sichtbar) und fein
  const img = ctx.getImageData(0, 0, TEX_W, TEX_H);
  const d = img.data;
  const C = 3, cols = Math.ceil(TEX_W / C);
  const coarse = Array.from({ length: cols * Math.ceil(TEX_H / C) }, () => (Math.random() - 0.5) * 8);
  for (let y = 0; y < TEX_H; y++)
    for (let x = 0; x < TEX_W; x++) {
      const i = (y * TEX_W + x) * 4;
      const n = coarse[Math.floor(y / C) * cols + Math.floor(x / C)] + (Math.random() - 0.5) * 8;
      d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
    }
  ctx.putImageData(img, 0, 0);
  // vereinzelte Einschlüsse
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(90,70,45,${0.12 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(Math.random() * TEX_W, Math.random() * TEX_H, 0.6 + Math.random() * 1.2, 0, 7);
    ctx.fill();
  }
  // Schatten am Falz
  const spineLeft = side === "front";
  const g = ctx.createLinearGradient(spineLeft ? 0 : TEX_W, 0, spineLeft ? 110 : TEX_W - 110, 0);
  g.addColorStop(0, "rgba(60,45,30,.22)");
  g.addColorStop(1, "rgba(60,45,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
}

function pageNumber(ctx: CanvasRenderingContext2D, n: number, side: "front" | "back", f: PageFonts) {
  ctx.font = `400 26px ${f.mono}`;
  ctx.fillStyle = "#a49d92";
  ctx.textAlign = side === "front" ? "right" : "left";
  ctx.fillText(`S. ${n}`, side === "front" ? TEX_W - 70 : 70, TEX_H - 58);
}

function pencilNote(ctx: CanvasRenderingContext2D, text: string, side: "front" | "back", f: PageFonts) {
  ctx.save();
  ctx.font = `500 58px ${f.pencil}`;
  ctx.fillStyle = "#7b756d";
  ctx.textAlign = side === "front" ? "left" : "right";
  ctx.translate(side === "front" ? 92 : TEX_W - 92, TEX_H - 52);
  ctx.rotate(-0.025);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function cover(ctx: CanvasRenderingContext2D, f: PageFonts, back: boolean) {
  const g = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  g.addColorStop(0, "#39303f");
  g.addColorStop(0.5, "#29222f");
  g.addColorStop(1, "#342b38");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Woven bookcloth, with a slightly recessed spine.
  for (let x = 0; x < TEX_W; x += 3) {
    ctx.strokeStyle = x % 2 ? "#ffffff08" : "#00000016";
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, TEX_H); ctx.stroke();
  }
  for (let y = 0; y < TEX_H; y += 4) {
    ctx.strokeStyle = "#ffffff05";
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_W, y); ctx.stroke();
  }
  const spine = ctx.createLinearGradient(0, 0, 80, 0);
  spine.addColorStop(0, "#100d17a0"); spine.addColorStop(0.65, "#100d1750"); spine.addColorStop(1, "#100d1700");
  ctx.fillStyle = spine; ctx.fillRect(0, 0, 80, TEX_H);
  ctx.strokeStyle = "#c6ad7b55"; ctx.lineWidth = 2;
  ctx.strokeRect(48, 42, TEX_W - 90, TEX_H - 84);
  ctx.strokeStyle = "#c6ad7b22";
  ctx.strokeRect(58, 52, TEX_W - 110, TEX_H - 104);
  ctx.textAlign = "center";
  ctx.fillStyle = "#c6ad7b";
  if (back) {
    ctx.font = `italic 300 46px ${f.display}`;
    ctx.fillText("Fortsetzung folgt.", TEX_W / 2, TEX_H / 2);
    ctx.font = `400 17px ${f.mono}`;
    ctx.fillText("MIT LIEBE GESAMMELT", TEX_W / 2, TEX_H - 115);
    return;
  }
  ctx.font = `400 19px ${f.mono}`;
  ctx.fillText("P E R S Ö N L I C H E   S A M M L U N G", TEX_W / 2, 155);
  // A foil stamp and its fine cancellation arcs.
  ctx.save();
  ctx.translate(TEX_W / 2, 410); ctx.rotate(-0.07);
  ctx.strokeStyle = "#c6ad7b99"; ctx.lineWidth = 2;
  ctx.setLineDash([7, 8]); ctx.strokeRect(-100, -115, 200, 230); ctx.setLineDash([]);
  ctx.strokeRect(-85, -100, 170, 200);
  ctx.font = `italic 300 116px ${f.display}`;
  ctx.fillText("S", 0, 38);
  ctx.font = `400 14px ${f.mono}`; ctx.fillText("Nº 01", 0, 80);
  ctx.restore();
  ctx.font = `italic 300 133px ${f.display}`;
  ctx.fillStyle = "#ddcba7";
  ctx.shadowColor = "#0008"; ctx.shadowOffsetY = 2; ctx.shadowBlur = 2;
  ctx.fillText("Stanzheft", TEX_W / 2, 730);
  ctx.shadowColor = "transparent";
  ctx.font = `400 26px ${f.body}`;
  ctx.fillStyle = "#b6a491";
  ctx.fillText("Kleine Dinge, die bleiben.", TEX_W / 2, 795);
  ctx.fillStyle = "#c6ad7b88"; ctx.fillRect(TEX_W / 2 - 28, 885, 56, 1);
  ctx.font = `400 17px ${f.mono}`;
  ctx.fillText("V O L U M E   0 1", TEX_W / 2, TEX_H - 110);
}

/** Positionen der 12 Ausstanzungen (4 × 3), wie auf den echten Seiten. */
export function stampSlots(count = 12) {
  const gx0 = 0.1, gx1 = 0.92, gy0 = 0.1, gy1 = 0.865;
  const gridW = gx1 - gx0;
  const gap = gridW * 0.07;
  const cw = (gridW - gap * 3) / 4;
  const ch = (cw * TEX_W * (11 / 9)) / TEX_H; // in v-Einheiten
  const rowGap = (gy1 - gy0 - ch * 3) / 2;
  return Array.from({ length: count }, (_, i) => {
    const c = i % 4, r = Math.floor(i / 4);
    const u0 = gx0 + c * (cw + gap), v0 = gy0 + r * (ch + rowGap);
    return { u0, v0, u1: u0 + cw, v1: v0 + ch };
  });
}

export async function drawPage(
  spec: PageSpec,
  pageNo: number,
  side: "front" | "back",
  f: PageFonts,
): Promise<{ canvas: HTMLCanvasElement; hits: HitRegion[] }> {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const hits: HitRegion[] = [];

  if (spec.kind === "cover" || spec.kind === "backcover") {
    cover(ctx, f, spec.kind === "backcover");
    return { canvas, hits };
  }

  paper(ctx, side);

  switch (spec.kind) {
    case "contents":
      ctx.textAlign = "left";
      ctx.fillStyle = "#948578";
      ctx.font = `400 18px ${f.mono}`;
      ctx.fillText("D A S   S A M M E L A R C H I V", 105, 145);
      ctx.fillStyle = "#49403a";
      ctx.font = `italic 300 88px ${f.display}`;
      ctx.fillText("Für die kleinen", 100, 300);
      ctx.fillText("Besonderheiten.", 100, 395);
      ctx.font = `400 25px ${f.body}`;
      ctx.fillStyle = "#8d8074";
      ctx.fillText("Gefunden, gesammelt und hier bewahrt.", 105, 470);
      spec.entries.slice(0, 5).forEach((entry, i) => {
        const y = 640 + i * 67;
        ctx.strokeStyle = "#a4957b44"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(105, y - 40); ctx.lineTo(900, y - 40); ctx.stroke();
        ctx.font = `400 17px ${f.mono}`; ctx.fillStyle = "#a18b70";
        ctx.fillText(String(i + 1).padStart(2, "0"), 105, y);
        ctx.font = `400 30px ${f.display}`; ctx.fillStyle = "#60544a";
        const title = entry.length > 30 ? entry.slice(0, 29) + "…" : entry;
        ctx.fillText(title, 175, y);
      });
      break;
    case "stamps": {
      ctx.font = `400 17px ${f.mono}`;
      ctx.fillStyle = "#a08e78";
      ctx.textAlign = "left";
      ctx.fillText(`SAMMLUNG  /  ${spec.title.toLocaleUpperCase("de")}`, 105, 62);
      const slots = stampSlots(spec.stamps.length);
      const imgs = await Promise.all(spec.stamps.map(loadStamp));
      spec.stamps.forEach((stamp, i) => {
        const s = slots[i];
        const img = imgs[i];
        // Foto-Ausschnitt ins Feld einpassen, Seitenverhältnis behalten
        const bw = (s.u1 - s.u0) * TEX_W, bh = (s.v1 - s.v0) * TEX_H;
        const k = Math.min(bw / img.width, bh / img.height);
        const w = img.width * k, h = img.height * k;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.35)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1.5;
        ctx.drawImage(img, s.u0 * TEX_W + (bw - w) / 2, s.v0 * TEX_H + (bh - h) / 2, w, h);
        ctx.restore();
        hits.push({ kind: "stamp", stamp, ...s });
      });
      break;
    }
    case "photo": {
      const bmp = await createImageBitmap(spec.page.image);
      const x0 = 0.06, y0 = 0.05, x1 = 0.94, y1 = 0.88;
      const bw = (x1 - x0) * TEX_W, bh = (y1 - y0) * TEX_H;
      const s = Math.max(bw / bmp.width, bh / bmp.height);
      const sw = bw / s, sh = bh / s;
      ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, x0 * TEX_W, y0 * TEX_H, bw, bh);
      hits.push({ kind: "photo", u0: x0, v0: y0, u1: x1, v1: y1 });
      pencilNote(ctx, spec.page.title, side, f);
      break;
    }
    case "add": {
      const x0 = 0.1, y0 = 0.12, x1 = 0.9, y1 = 0.84;
      ctx.save();
      ctx.strokeStyle = "#bdb4a6";
      ctx.lineWidth = 5;
      ctx.setLineDash([18, 12]);
      ctx.beginPath();
      ctx.roundRect(x0 * TEX_W, y0 * TEX_H, (x1 - x0) * TEX_W, (y1 - y0) * TEX_H, 18);
      ctx.stroke();
      ctx.restore();
      const cx = TEX_W / 2, cy = TEX_H * 0.4;
      ctx.fillStyle = "#6b2fb3";
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(cx - 32, cy - 6, 64, 12);
      ctx.fillRect(cx - 6, cy - 32, 12, 64);
      ctx.textAlign = "center";
      ctx.fillStyle = "#3a3631";
      ctx.font = `800 64px ${f.display}`;
      ctx.fillText("Seite einkleben", cx, cy + 160);
      ctx.fillStyle = "#6f6961";
      ctx.font = `400 34px ${f.body}`;
      ctx.fillText("Foto deiner nächsten Heftseite", cx, cy + 220);
      hits.push({ kind: "add", u0: x0, v0: y0, u1: x1, v1: y1 });
      break;
    }
  }
  pageNumber(ctx, pageNo, side, f);
  return { canvas, hits };
}
