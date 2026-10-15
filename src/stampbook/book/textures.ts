import * as THREE from 'three';

export type Leaf = {
  key: string;
  kind: 'cover' | 'backcover' | 'inside' | 'blank' | 'demo' | 'image';
  pageNo?: number;
  url?: string;
  variant?: number;
};

export const PAGE_W = 1.4;
export const PAGE_H = 2;
const PX_W = 1024;
const PX_H = Math.round((PX_W * PAGE_H) / PAGE_W);

const PAPER = '#f7f3ea';
const GRID = 'rgba(70, 110, 160, 0.28)';
const COVER = '#2f4a3f';

function grid(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, PX_W, PX_H);
  const step = PX_W / 30;
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = step; x < PX_W; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PX_H);
  }
  for (let y = step; y < PX_H; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(PX_W, y);
  }
  ctx.stroke();
}

function pageNumber(ctx: CanvasRenderingContext2D, n: number | undefined, mirrored: boolean) {
  if (!n) return;
  ctx.fillStyle = 'rgba(40, 40, 40, 0.55)';
  ctx.font = '500 34px Georgia, serif';
  ctx.textAlign = mirrored ? 'left' : 'right';
  ctx.fillText(String(n), mirrored ? 48 : PX_W - 48, PX_H - 44);
}

function stamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  top: string,
  middle: string,
  rot: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r - 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${r * 0.34}px "Courier New", monospace`;
  ctx.fillText(middle, 0, 0);
  ctx.font = `600 ${r * 0.16}px "Courier New", monospace`;
  ctx.fillText(top, 0, -r * 0.5);
  ctx.fillText('★ ★ ★', 0, r * 0.5);
  ctx.restore();
}

function demo(ctx: CanvasRenderingContext2D, variant: number) {
  grid(ctx);
  ctx.fillStyle = '#2b2b2b';
  ctx.font = 'italic 56px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
  ctx.textAlign = 'left';
  if (variant === 0) {
    ctx.fillText('Meine erste Seite', 90, 150);
    stamp(ctx, 320, 520, 170, '#b8323a', 'HAMBURG', '2026', -0.2);
    stamp(ctx, 700, 900, 140, '#2b5aa6', 'POST', 'OK', 0.25);
    ctx.font = 'italic 40px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
    ctx.fillText('Beispielseite: lade ein Foto', 90, 1220);
    ctx.fillText('oder einen Scan hoch.', 90, 1280);
  } else {
    ctx.fillText('Austausch', 90, 150);
    stamp(ctx, 640, 480, 190, '#3a7d44', 'FREUNDE', '♥', 0.15);
    stamp(ctx, 300, 960, 150, '#7a3fa0', 'TOKYO', '東京', -0.3);
    stamp(ctx, 760, 1180, 110, '#c77b16', 'MUSEUM', 'MOMA', 0.4);
  }
}

function cover(ctx: CanvasRenderingContext2D, back: boolean) {
  ctx.fillStyle = COVER;
  ctx.fillRect(0, 0, PX_W, PX_H);
  // Leinenstruktur
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * PX_W, Math.random() * PX_H, 2 + Math.random() * 6, 1);
  }
  if (back) return;
  ctx.strokeStyle = 'rgba(232, 205, 140, 0.9)';
  ctx.lineWidth = 6;
  ctx.strokeRect(70, 70, PX_W - 140, PX_H - 140);
  ctx.fillStyle = '#e8cd8c';
  ctx.textAlign = 'center';
  ctx.font = '700 104px Georgia, serif';
  ctx.fillText('Stempelheft', PX_W / 2, PX_H * 0.36);
  ctx.font = 'italic 44px Georgia, serif';
  ctx.fillText('Seiten, Stempel & Erinnerungen', PX_W / 2, PX_H * 0.36 + 80);
  stamp(ctx, PX_W / 2, PX_H * 0.62, 150, '#e8cd8c', 'NO. 1', '3D', 0);
}

function inside(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#e9e1cf';
  ctx.fillRect(0, 0, PX_W, PX_H);
  ctx.fillStyle = 'rgba(60, 50, 30, 0.6)';
  ctx.textAlign = 'center';
  ctx.font = 'italic 46px Georgia, serif';
  ctx.fillText('Dieses Heft gehört', PX_W / 2, PX_H * 0.42);
  ctx.strokeStyle = 'rgba(60, 50, 30, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PX_W * 0.25, PX_H * 0.5);
  ctx.lineTo(PX_W * 0.75, PX_H * 0.5);
  ctx.stroke();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function drawLeaf(ctx: CanvasRenderingContext2D, leaf: Leaf, mirrored: boolean) {
  switch (leaf.kind) {
    case 'cover':
      return cover(ctx, false);
    case 'backcover':
      return cover(ctx, true);
    case 'inside':
      return inside(ctx);
    case 'demo':
      demo(ctx, leaf.variant ?? 0);
      return pageNumber(ctx, leaf.pageNo, mirrored);
    case 'blank':
      grid(ctx);
      return pageNumber(ctx, leaf.pageNo, mirrored);
    case 'image': {
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, PX_W, PX_H);
      const img = await loadImage(leaf.url!);
      // "cover"-Einpassung: das Foto füllt die ganze Seite
      const s = Math.max(PX_W / img.width, PX_H / img.height);
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, (PX_W - w) / 2, (PX_H - h) / 2, w, h);
      return pageNumber(ctx, leaf.pageNo, mirrored);
    }
  }
}

/**
 * Erzeugt die Textur für eine Seite. Rückseiten (mirrored) werden horizontal gespiegelt,
 * weil sie von hinten auf dieselbe Fläche gemappt werden.
 */
export async function makeLeafTexture(leaf: Leaf, mirrored: boolean): Promise<THREE.Texture> {
  const canvas = document.createElement('canvas');
  canvas.width = PX_W;
  canvas.height = PX_H;
  const ctx = canvas.getContext('2d')!;
  await drawLeaf(ctx, leaf, mirrored);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (mirrored) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1;
    tex.offset.x = 1;
  }
  return tex;
}
