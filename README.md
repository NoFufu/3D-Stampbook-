# 3D-Stempelheft

Next.js-App für das digitale 3D-Stempelheft. Plan: [`docs/PLAN.md`](docs/PLAN.md), statische Vorschau ohne Build: [`preview/index.html`](preview/index.html).

## Starten

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Production-Build (inkl. Lint und Typecheck)
```

## React-Version

`react` und `react-dom` sind exakt auf dieselbe Version gepinnt (aktuell 19.2.9) und per
`overrides` in `package.json` festgehalten. Hintergrund: `react-dom` verlangt exakt die
gleiche `react`-Version (`peer react@^<eigene Version>`). Komponenten-Registries wie React Bits
(`shadcn add …`) installieren `react-dom@^19.0.0` nach, was ohne Pin auf die neueste Version
springt und dann nicht mehr zu `react` passt. Zum Aktualisieren beide Versionen in
`dependencies` gemeinsam ändern; die `overrides` folgen automatisch (`$react`, `$react-dom`).

## Aufbau

- `src/app/` – Next.js App Router (Seite rendert das Heft nur im Browser)
- `src/stampbook/` – 3D-Heft (React Three Fiber), Speicherung in IndexedDB
- `src/stampbook/reactbits/` – kopierte React-Bits-Komponenten (Aurora, BlurText, ClickSpark, Dock, StarBorder)
