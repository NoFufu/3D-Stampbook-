# Plan: Online-3D-Stempelheft

Ein digitales Stempel- und Austauschheft, das im Browser als echtes 3D-Buch erscheint.
Man kann es drehen, aufschlagen und umblättern. Neue Seiten (Fotos oder Scans, z. B. die
erste Karo-Seite) lassen sich jederzeit nachträglich einfügen.

## Ziele

1. **Heft in 3D** mit glaubwürdigem Umblättern (Papier biegt sich beim Blättern).
2. **Seiten nachträglich einfügen**: Foto/Scan hochladen, wird als neue Seite an der aktuellen Stelle eingefügt.
3. **Speichern**, sodass das Heft beim nächsten Besuch (und später auf anderen Geräten) wieder da ist.
4. **Teilen**: Andere können das Heft per Link ansehen (Austauschheft-Gedanke).
5. UI mit Komponenten von [reactbits.dev](https://reactbits.dev).

## Tech-Stack

| Bereich | Wahl | Warum |
| --- | --- | --- |
| Build | Vite + TypeScript | schnell, einfache statische Ausgabe |
| UI | React 19 | Standard, passt zu React Bits und react-three-fiber |
| 3D | three.js + @react-three/fiber + @react-three/drei | deklaratives 3D in React, OrbitControls, Schatten, Umgebung |
| UI-Effekte | React Bits (Copy-Paste-Komponenten unter `src/reactbits/`) | Dock, Aurora, BlurText, StarBorder, ClickSpark |
| Speicherung (Preview) | IndexedDB über `idb-keyval` | Bilder bleiben lokal im Browser, kein Server nötig |
| Speicherung (Ausbau) | Supabase (Postgres + Storage + Auth) | Heft geräteübergreifend, Teilen per Link, kostenlos startbar |
| Hosting | GitHub Pages oder Vercel | statischer Vite-Build, `base: './'` ist schon gesetzt |

## Aufbau des 3D-Hefts

- Das Heft besteht aus **Blättern** (`Sheet`). Jedes Blatt hat eine Vorder- und Rückseite, also zwei Seiten.
- Jedes Blatt ist eine fein unterteilte Fläche (`PlaneGeometry` mit ~30 Segmenten), deren eine Kante am Buchrücken (x = 0) liegt.
- **Umblättern**: Pro Frame wird ein Fortschritt `t` (0 = rechts, 1 = links) weich animiert. Die Vertices werden entlang
  eines Bogens neu berechnet: Grundwinkel `t·π` plus eine Krümmung `sin(t·π)·k`, die zur Blattkante hin zunimmt.
  So wölbt sich das Papier in der Mitte der Bewegung und liegt am Ende wieder flach.
- Kleine z-Versätze pro Blatt verhindern Flimmern und lassen die Stapel links/rechts dicker wirken.
- Einband vorne und hinten ist ein eigenes, etwas steiferes Blatt mit Leinen-Farbe.
- Seitentexturen kommen aus Bildern (Upload) oder werden für leere Seiten per Canvas gezeichnet (Karo-Raster, Rand, Seitenzahl).

## Seiten einfügen

1. Klick auf „Seite einfügen“ (Dock oder StarBorder-Button) öffnet die Dateiauswahl, auch Kamera auf dem Handy.
2. Das Bild wird im Browser auf max. 1600 px verkleinert und als JPEG gespeichert (spart Platz).
3. Die Seite wird hinter der aktuell aufgeschlagenen rechten Seite eingefügt; das Heft blättert dorthin.
4. Seiten lassen sich löschen; Umsortieren per Drag & Drop kommt im Ausbau.

Später: automatisches Zuschneiden/Entzerren von Scans (Ecken erkennen, Perspektive korrigieren), z. B. mit OpenCV.js.

## Speicherung

**Preview (jetzt):** Seitenliste und Bilder liegen in IndexedDB des Browsers. Funktioniert offline, aber nur auf diesem Gerät.

**Ausbau:**
- Tabelle `books (id, owner, title, cover_color, created_at)`
- Tabelle `pages (id, book_id, position, image_path, created_at)`
- Bilder in Supabase Storage, öffentlich lesbar über unratbare Pfade oder per signierter URL.
- Login per Magic Link; Teilen über einen Lese-Link `/b/<book-id>`.
- Optional „Austausch“: andere dürfen per Einladungslink eine Seite beitragen.

## React-Bits-Komponenten

| Komponente | Einsatz |
| --- | --- |
| `Aurora` | ruhiger, animierter Hintergrund hinter der 3D-Szene |
| `BlurText` | Titel des Hefts blendet beim Laden ein |
| `Dock` | Werkzeugleiste unten: zurück, weiter, Seite einfügen, löschen, Ansicht zurücksetzen |
| `StarBorder` | hervorgehobener Button „Seite einfügen“ |
| `ClickSpark` | kleine Funken beim Klicken/Blättern |

Die Komponenten sind als Quelltext kopiert (so ist React Bits gedacht) und liegen unverändert in `src/reactbits/`.
Lizenz: MIT + Commons Clause (Nutzung in eigener App erlaubt, Weiterverkauf der Komponenten nicht).

## Meilensteine

1. **Preview** (dieser PR): 3D-Heft mit Umblättern, Bild-Upload, lokale Speicherung, React-Bits-UI.
2. **Feinschliff**: Seiten löschen/umsortieren, Zoom auf eine Seite, Ton beim Blättern, Mobile-Gesten (Wischen).
3. **Cloud**: Supabase-Anbindung, Login, Teilen per Link.
4. **Austausch**: Gäste können Seiten beitragen; Moderation durch den Besitzer.
5. **Scan-Hilfe**: Zuschneiden und Entzerren von Fotos direkt beim Upload.

## Lokal starten

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # statischer Build in dist/
```
