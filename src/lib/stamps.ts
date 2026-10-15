/* Die Marken der ersten zwei Heftseiten (Karo & Tierfell), ausgeschnitten aus Fotos der echten Seiten.
 * Reihenfolge = Lesereihenfolge auf der Seite (4 × 3, zeilenweise). Bilder liegen in public/stamps/. */

const KARO = [
  'Kamelkaro', 'Blauer Tartan', 'Vichy Braun', 'Senfkaro',
  'Rotes Diagonal', 'Madras', 'Nachtblau', 'Patchwork',
  'Black Watch', 'Hahnentritt', 'Bordeaux-Karo', 'Royal Stewart',
];
const TIER = [
  'Leopard', 'Python', 'Krokodil', 'Leguan',
  'Zebra', 'Fischschuppe', 'Pfauenauge', 'Schildpatt',
  'Ara', 'Reh', 'Tiger', 'Schneeleopard',
];

export type StampDef = { id: string; name: string; theme: string; perf: number; image: string };

const toDefs = (list: string[], theme: string, prefix: string): StampDef[] =>
  list.map((name, i) => {
    const id = prefix + String(i + 1).padStart(2, "0");
    return { id, name, theme, perf: 11 + (i % 3) * 0.5, image: `/stamps/${id}.webp` };
  });

export const KARO_STAMPS = toDefs(KARO, "Karo", "K-");
export const TIER_STAMPS = toDefs(TIER, "Tierfell", "T-");
export const ALL_STAMPS = [...KARO_STAMPS, ...TIER_STAMPS];

const cache = new Map<string, Promise<HTMLImageElement>>();
/** Lädt das Markenbild (einmal pro Marke). */
export function loadStamp(def: StampDef): Promise<HTMLImageElement> {
  let p = cache.get(def.id);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = def.image;
    });
    cache.set(def.id, p);
  }
  return p;
}
