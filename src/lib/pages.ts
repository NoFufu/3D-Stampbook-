import { KARO_STAMPS, TIER_STAMPS, type StampDef } from "./stamps";

/** Eine Seite, die du als Foto ins Heft eingeklebt hast. */
export type UserPage = { id: string; title: string; image: Blob; createdAt: number };

export type PageSpec =
  | { kind: "cover" }
  | { kind: "contents"; entries: string[] }
  | { kind: "stamps"; title: string; stamps: StampDef[] }
  | { kind: "photo"; page: UserPage }
  | { kind: "add" }
  | { kind: "blank" }
  | { kind: "backcover" };

export const BUILTIN_SECTIONS = [
  { title: "Karo", stamps: KARO_STAMPS },
  { title: "Tierfell", stamps: TIER_STAMPS },
];

/**
 * Reihenfolge im Heft: Umschlag, Inhalt, feste Seiten, eingeklebte Fotos,
 * „Seite einkleben“, Rückseite. Jedes Blatt hat Vorder- und Rückseite,
 * deshalb ist die Anzahl immer gerade.
 */
export function buildPages(userPages: UserPage[]): PageSpec[] {
  const entries = [...BUILTIN_SECTIONS.map((s) => s.title), ...userPages.map((p) => p.title)];
  const pages: PageSpec[] = [
    { kind: "cover" },
    { kind: "contents", entries },
    ...BUILTIN_SECTIONS.map((s) => ({ kind: "stamps" as const, ...s })),
    ...userPages.map((page) => ({ kind: "photo" as const, page })),
    { kind: "add" },
  ];
  if (pages.length % 2 === 0) pages.push({ kind: "blank" });
  pages.push({ kind: "backcover" });
  return pages;
}

/* ---------- Lokale Ablage (IndexedDB) ----------
 * Fotos können mehrere MB groß sein, deshalb nicht localStorage.
 * Später ersetzt durch Supabase Storage. */
const DB = "stanzheft";
const STORE = "pages";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listUserPages(): Promise<UserPage[]> {
  const all = await tx<UserPage[]>("readonly", (s) => s.getAll() as IDBRequest<UserPage[]>);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export const saveUserPage = (p: UserPage) => tx("readwrite", (s) => s.put(p));
export const deleteUserPage = (id: string) => tx("readwrite", (s) => s.delete(id));

/** Verkleinert ein Foto auf max. 1600 px Kantenlänge, damit Texturen schnell laden. */
export async function prepareImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s);
  c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Foto konnte nicht gelesen werden"))), "image/jpeg", 0.85),
  );
}
