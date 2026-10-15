# Stanzheft 3D – Grober Plan

Ziel: Ein Online-3D-Heft, das wie das echte Ausstanz-Heft aussieht und sich so anfühlt.
Neue Seiten kommen nachträglich digital dazu: Foto der Seite hochladen, Marken werden erkannt
und einzeln anklickbar.

Preview (klickbar, ohne Build): [`preview/index.html`](../preview/index.html)

## 1. Tech-Stack

| Bereich | Wahl | Warum |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Aceternity & React Bits sind für React/Next gebaut |
| Styling | Tailwind CSS v4 + shadcn/ui | Alle drei Libraries installieren per shadcn-CLI |
| 3D | React Three Fiber + drei | Echtes 3D-Heft mit Licht, Schatten, Papierbiegung |
| Animation | Motion (Framer Motion) | Von Aceternity und React Bits ohnehin genutzt |
| Daten | Supabase (Postgres + Storage + Auth) | Fotos speichern, Login nur für dich als Besitzer |
| Bildverarbeitung | OpenCV.js im Browser | Seite gerade ziehen, Marken ausschneiden |
| Hosting | Vercel | Passt zu Next.js, kostenloser Start |

## 2. Komponenten aus den drei Libraries

**React Bits** (reactbits.dev)
- `SplitText` / `BlurText` – Titel-Animation („Stanzheft“, Seitentitel)
- `Dock` – Steuerleiste unten (Zurück, Weiter, Seite einkleben, Zuklappen)
- `Silk` oder `Grainient` – ruhiger Hintergrund wie ein Schreibtisch
- `Stack` – Marken eines Themas als Kartenstapel durchwischen (Handy)
- `Masonry` – Galerie-Ansicht aller Marken

**Aceternity UI** (ui.aceternity.com)
- `3D Card Effect` – Heft neigt sich mit der Maus
- `Spotlight` – Lichtkegel auf dem Heft
- `Expandable Card` – Marke antippen → Detailkarte
- `File Upload` – Drag & Drop für neue Seitenfotos
- `Floating Dock` (Alternative zum React-Bits-Dock auf Mobile)

**Bklit UI** (bklit.com – Chart-Library)
- `Ring Chart` – Marken pro Thema
- `Heatmap Chart` – wann du Seiten hinzugefügt hast (Sammel-Kalender)
- `Bar Chart` – Farben/Themen im Vergleich
- `Radar Chart` (optional) – Farbprofil einer Seite

## 3. Datenmodell (Supabase)

```
books   (id, title, cover_color, created_at)
pages   (id, book_id, position, title, theme, photo_url, created_at)
stamps  (id, page_id, slot, name, image_url, crop_box, dominant_colors, perf_gauge)
```

Eine Seite = 4 × 3 Slots (wie im echten Heft). Jede Marke kennt ihren Slot.

## 4. Upload-Flow „Seite einkleben“

1. Foto aufnehmen oder hochladen (Aceternity File Upload)
2. Seite automatisch erkennen und gerade ziehen (Perspektive entzerren)
3. Raster 4 × 3 auflegen, du kannst die Kästchen verschieben
4. Marken werden ausgeschnitten und mit gezahnter Kontur maskiert
5. Titel + Thema vergeben (z. B. „Karo“, „Tierfell“) → speichern
6. Heft blättert automatisch zur neuen Seite

## 5. Seiten / Routen

- `/` – das 3D-Heft (Startansicht, zugeklappt)
- `/seite/[n]` – direkt aufgeschlagen auf Seite n (teilbarer Link)
- `/einkleben` – Upload-Assistent (nur eingeloggt)
- `/sammlung` – alle Marken als Galerie + Bklit-Statistiken

## 6. Meilensteine

1. **Preview** (fertig): klickbares CSS-3D-Heft, generierte Marken, Foto-Upload lokal
2. **Grundgerüst**: Next.js + Tailwind + shadcn, Komponenten aus den drei Libraries installieren
3. **3D-Heft**: React Three Fiber, Umblättern mit Drag, Lesebändchen, Schatten
4. **Upload & Ausschneiden**: Foto → entzerrte Seite → 12 Marken
5. **Backend**: Supabase, Login, Speichern
6. **Sammlung & Statistik**: Galerie, Bklit-Charts
7. **Feinschliff**: Handy-Gesten, Ladezeiten, Teilen-Link

## Offene Fragen

- Soll das Heft öffentlich sein (Link teilen) oder nur für dich?
- Nur Foto der ganzen Seite, oder auch einzelne Marken nachträglich tauschen?
- Mehrere Hefte (Band I, II …) oder erstmal eins?
