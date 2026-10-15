import { renderStamp, type StampDef } from "@/lib/stamps";
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
  // Papierkorn
  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(120,100,70,.05)" : "rgba(255,255,255,.25)";
    ctx.fillRect(Math.random() * TEX_W, Math.random() * TEX_H, 2, 2);
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
  g.addColorStop(0, "#3d3c42");
  g.addColorStop(0.6, "#232227");
  g.addColorStop(1, "#2c2b31");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.25)";
    ctx.fillRect(Math.random() * TEX_W, Math.random() * TEX_H, 2, 2);
  }
  // Kante des Hardcovers
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, TEX_W - 6, TEX_H - 6);
  ctx.textAlign = "center";
  if (back) {
    ctx.font = `400 24px ${f.mono}`;
    ctx.fillStyle = "#5e5a62";
    ctx.fillText("FORTSETZUNG FOLGT", TEX_W / 2, TEX_H / 2);
    return;
  }
  // geprägter Markenrahmen
  ctx.save();
  ctx.strokeStyle = "#45434b";
  ctx.lineWidth = 8;
  ctx.setLineDash([22, 14]);
  ctx.strokeRect(TEX_W / 2 - 140, TEX_H / 2 - 290, 280, 340);
  ctx.restore();
  // Prägung: heller Rand unten, dunkler oben
  ctx.font = `800 130px ${f.display}`;
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillText("Stanzheft", TEX_W / 2, TEX_H / 2 + 192);
  ctx.fillStyle = "#1b1a1e";
  ctx.fillText("Stanzheft", TEX_W / 2, TEX_H / 2 + 188);
  ctx.font = `400 30px ${f.mono}`;
  ctx.fillStyle = "#8a8590";
  ctx.fillText("BAND I · SAMMLUNG", TEX_W / 2, TEX_H / 2 + 260);
}

/** Positionen der 12 Ausstanzungen (4 × 3), wie auf den echten Seiten. */
export function stampSlots(count = 12) {
  const gx0 = 0.09, gx1 = 0.91, gy0 = 0.12, gy1 = 0.84;
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
    case "contents": {
      ctx.fillStyle = "#6f6961";
      ctx.font = `500 70px ${f.pencil}`;
      ctx.fillText("Mein Ausstanz-Heft", 130, 200);
      ctx.font = `400 26px ${f.mono}`;
      ctx.fillStyle = "#a49d92";
      ctx.fillText("INHALT", 130, 270);
      ctx.font = `500 54px ${f.pencil}`;
      ctx.fillStyle = "#6f6961";
      spec.entries.slice(0, 11).forEach((e, i) => ctx.fillText(`${i + 1} · ${e}`, 130, 350 + i * 62));
      break;
    }
    case "stamps": {
      const slots = stampSlots(spec.stamps.length);
      spec.stamps.forEach((stamp, i) => {
        const s = slots[i];
        const w = (s.u1 - s.u0) * TEX_W;
        const img = renderStamp(stamp, w / 180);
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.35)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1.5;
        ctx.drawImage(img, s.u0 * TEX_W, s.v0 * TEX_H, w, (s.v1 - s.v0) * TEX_H);
        ctx.restore();
        hits.push({ kind: "stamp", stamp, ...s });
      });
      pencilNote(ctx, spec.title, side, f);
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
