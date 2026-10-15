import { get, set } from 'idb-keyval';

export type StoredPage =
  | { id: string; kind: 'image'; blob: Blob; createdAt: number }
  | { id: string; kind: 'demo'; variant: number; createdAt: number };

const KEY = 'stampbook:pages:v1';

export async function loadPages(): Promise<StoredPage[] | undefined> {
  try {
    return await get<StoredPage[]>(KEY);
  } catch {
    // IndexedDB kann z. B. im privaten Modus fehlen; dann bleibt das Heft nur im Speicher
    return undefined;
  }
}

export async function savePages(pages: StoredPage[]): Promise<void> {
  try {
    await set(KEY, pages);
  } catch {
    /* siehe loadPages */
  }
}

export function demoPages(): StoredPage[] {
  const now = Date.now();
  return [
    { id: 'demo-1', kind: 'demo', variant: 0, createdAt: now },
    { id: 'demo-2', kind: 'demo', variant: 1, createdAt: now }
  ];
}

/** Verkleinert ein hochgeladenes Foto auf max. 1600 px und speichert es als JPEG. */
export async function shrinkImage(file: File, maxSize = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Bild konnte nicht umgewandelt werden'))), 'image/jpeg', 0.85)
  );
}
