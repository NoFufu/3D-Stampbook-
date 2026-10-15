# Stanzheft 3D

Ein Online-3D-Heft für meine Ausstanz-Marken. Man kann durchblättern, eine Marke antippen und Details sehen
und neue Seiten als Foto einkleben.

**Live:** https://stanzheft.vercel.app

## Online stellen

[![Mit Vercel veröffentlichen](https://vercel.com/button)](https://vercel.com/new/import?s=https%3A%2F%2Fgithub.com%2FNoFufu%2F3D-Stampbook-&project-name=stanzheft)

Der Button importiert genau dieses Repo in Vercel (es wird kein neues Repo angelegt). Beim ersten Mal fragt Vercel nach Zugriff auf GitHub: dort „NoFufu/3D-Stampbook-“ freigeben. Danach auf „Deploy“ klicken, und Vercel gibt einen öffentlichen Link aus. Jeder Push auf den Standardbranch wird automatisch neu veröffentlicht.

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
| `src/lib/stamps.ts`, `public/stamps/` | die 24 Marken (Karo & Tierfell), ausgeschnitten aus Fotos der echten Heftseiten |
| `src/lib/pages.ts` | Seitenreihenfolge und lokale Ablage der eingeklebten Fotos |
| `src/components/StampbookApp.tsx` | Hauptseite: Schriftzug, Heft, Dock, Dialoge, Statistik |
| `src/components/LiquidLines.tsx` | Hintergrund mit fließenden Linien (eigener WebGL-Shader nach dem Vorbild von React Bits Pro „Liquid Lines“) |

Komponenten aus fremden Bibliotheken (per shadcn-Registry installiert, nicht von Hand geschrieben):

- **React Bits:** `Dock` (Steuerleiste)
- **Aceternity UI:** `FileUpload` (Seite einkleben)
- **Bklit UI:** `RingChart` (Sammlungs-Statistik) in `src/components/charts/`

Plan und nächste Schritte: [`docs/PLAN.md`](docs/PLAN.md). Die erste klickbare HTML-Skizze liegt in `preview/`.
