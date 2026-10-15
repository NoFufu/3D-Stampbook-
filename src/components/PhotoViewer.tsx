"use client";

import { useEffect, useState } from "react";
import type { UserPage } from "@/lib/pages";
import { Sheet } from "./Sheet";

export function PhotoViewer({
  page,
  onClose,
  onRemove,
}: {
  page: UserPage | null;
  onClose: () => void;
  onRemove: (p: UserPage) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setArmed(false);
    if (!page) return;
    const u = URL.createObjectURL(page.image);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [page]);

  return (
    <Sheet open={!!page} onClose={onClose} label={page?.title ?? "Seite"} className="max-w-2xl">
      {page && url && (
        <div className="grid gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={page.title} className="max-h-[62svh] w-full rounded-xl object-contain" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-extrabold">{page.title}</h2>
              <p className="text-sm text-[var(--ink-soft)]">
                Eingeklebt am {new Date(page.createdAt).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => (armed ? onRemove(page) : setArmed(true))}
                className={`rounded-xl border px-4 py-2 text-sm ${armed ? "border-transparent bg-[var(--danger)] text-white" : "border-[var(--line)] bg-[var(--desk-2)]"}`}
              >
                {armed ? "Wirklich entfernen?" : "Seite entfernen"}
              </button>
              <button onClick={onClose} className="rounded-xl border border-[var(--line)] bg-[var(--desk-2)] px-4 py-2 text-sm">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
