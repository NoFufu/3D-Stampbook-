# 3D-Stempelheft

Ein Online-Stempel- und Austauschheft in 3D. Seiten (Fotos oder Scans) lassen sich jederzeit nachträglich einfügen.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # statischer Build in dist/
```

Bedienung: Klick auf eine Seite blättert um, Ziehen dreht das Heft, Pfeiltasten blättern.
„Foto oder Scan einfügen“ legt neue Seiten rechts auf der aufgeschlagenen Doppelseite an.
Die Seiten werden vorerst lokal im Browser (IndexedDB) gespeichert.

Der Plan und die nächsten Schritte stehen in [PLAN.md](PLAN.md).

UI-Komponenten von [React Bits](https://reactbits.dev) liegen in `src/reactbits/` (Lizenz: `src/reactbits/LICENSE.md`).
