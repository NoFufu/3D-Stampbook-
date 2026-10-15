# Stanzheft 3D

Ein Online-3D-Heft für meine Ausstanz-Marken. Man kann durchblättern, eine Marke antippen und Details sehen
und neue Seiten als Foto einkleben.

## Starten

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Produktions-Build
npm run lint
```

## Bedienung

- **Umblättern:** Seite antippen (rechts = weiter, links = zurück), ein Blatt anfassen und ziehen, Pfeiltasten oder das Dock unten
- **Marke ansehen:** auf eine Marke tippen
- **Seite einkleben:** `+` im Dock oder die Seite „Seite einkleben“ hinten im Heft. Fotos werden vorerst lokal im Browser (IndexedDB) gespeichert.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/components/book/Book3D.tsx` | 3D-Heft mit React Three Fiber, gebogenes Papier beim Umblättern, Ziehen zum Blättern |
| `src/components/book/page-texture.ts` | zeichnet jede Heftseite als Textur (Umschlag, 4 × 3 Marken, Fotos) |
| `src/lib/stamps.ts` | prozedurale Marken mit Zähnung (Karo & Tierfell) |
| `src/lib/pages.ts` | Seitenreihenfolge und lokale Ablage der eingeklebten Fotos |
| `src/components/StampbookApp.tsx` | Hauptseite: Titel, Heft, Dock, Dialoge, Statistik |

Komponenten aus fremden Bibliotheken (per shadcn-Registry installiert, nicht von Hand geschrieben):

- **React Bits:** `SplitText` (Titel), `Dock` (Steuerleiste)
- **Aceternity UI:** `Spotlight` (Hintergrund-Licht), `FileUpload` (Seite einkleben)
- **Bklit UI:** `RingChart` (Sammlungs-Statistik) in `src/components/charts/`

Plan und nächste Schritte: [`docs/PLAN.md`](docs/PLAN.md). Die erste klickbare HTML-Skizze liegt in `preview/`.
