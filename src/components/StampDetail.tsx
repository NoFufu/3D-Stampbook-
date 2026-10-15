"use client";

import type { StampDef } from "@/lib/stamps";
import { Sheet } from "./Sheet";

export function StampDetail({ value, onClose }: { value: { stamp: StampDef; page: number } | null; onClose: () => void }) {
  const s = value?.stamp;
  return (
    <Sheet open={!!value} onClose={onClose} label={s?.name ?? "Marke"} className="max-w-xl">
      {s && (
        <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt={s.name}
            className="mx-auto w-40 -rotate-2 drop-shadow-[0_8px_14px_rgba(0,0,0,.45)] sm:w-full"
          />
          <div>
            <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--ink-soft)] uppercase">Nr. {s.id}</span>
            <h2 className="font-display text-3xl leading-tight font-extrabold">{s.name}</h2>
            <dl className="mt-4 mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm tabular-nums">
              <dt className="font-mono text-[11px] tracking-wider text-[var(--ink-soft)] uppercase">Thema</dt>
              <dd>{s.theme}</dd>
              <dt className="font-mono text-[11px] tracking-wider text-[var(--ink-soft)] uppercase">Seite</dt>
              <dd>{value.page}</dd>
              <dt className="font-mono text-[11px] tracking-wider text-[var(--ink-soft)] uppercase">Zähnung</dt>
              <dd>{String(s.perf).replace(".5", " ½")} (Zähne auf 2 cm)</dd>
              <dt className="font-mono text-[11px] tracking-wider text-[var(--ink-soft)] uppercase">Format</dt>
              <dd>18 × 22 mm</dd>
            </dl>
            <button onClick={onClose} className="rounded-xl border border-[var(--line)] bg-[var(--desk-2)] px-4 py-2 text-sm hover:brightness-125">
              Schließen
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
