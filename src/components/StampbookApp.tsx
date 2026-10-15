"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, CircleDot, Plus, X } from "lucide-react";
import { Popover } from "radix-ui";
import Dock from "@/components/Dock";
import { Background } from "@/components/Background";
import { BUILTIN_SECTIONS, buildPages, deleteUserPage, listUserPages, type UserPage } from "@/lib/pages";
import type { StampDef } from "@/lib/stamps";
import { body, display, mono, pencil } from "@/lib/fonts";
import type { HitRegion } from "./book/page-texture";
import { UploadDialog } from "./UploadDialog";
import { StampDetail } from "./StampDetail";
import { PhotoViewer } from "./PhotoViewer";

// three.js nur im Browser laden
const Book3D = dynamic(() => import("./book/Book3D"), { ssr: false });
// Bklit-Charts messen ihre Größe erst im Browser
const CollectionStats = dynamic(() => import("./CollectionStats").then((m) => m.CollectionStats), {
  ssr: false,
  loading: () => <p className="p-5 text-sm text-[var(--ink-soft)]">Sammlung wird geöffnet …</p>,
});

const FONTS = {
  display: display.style.fontFamily,
  body: body.style.fontFamily,
  mono: mono.style.fontFamily,
  pencil: pencil.style.fontFamily,
};

export default function StampbookApp() {
  const [userPages, setUserPages] = useState<UserPage[]>([]);
  const [current, setCurrent] = useState(1);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [stamp, setStamp] = useState<{ stamp: StampDef; page: number } | null>(null);
  const [photo, setPhoto] = useState<UserPage | null>(null);

  useEffect(() => {
    listUserPages().then(setUserPages).catch(() => setUserPages([]));
  }, []);

  const pages = useMemo(() => buildPages(userPages), [userPages]);
  const leaves = pages.length / 2;
  const go = useCallback((n: number) => setCurrent(Math.max(0, Math.min(leaves, n))), [leaves]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (uploadOpen || stamp || photo || collectionOpen || (e.target instanceof HTMLElement && e.target.closest("button, input, textarea, [role=dialog]"))) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") e.preventDefault();
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [current, go, uploadOpen, stamp, photo, collectionOpen]);

  const onHit = useCallback(
    (hit: HitRegion | null, pageIndex: number) => {
      const spec = pages[pageIndex];
      if (hit?.kind === "stamp") return setStamp({ stamp: hit.stamp, page: pageIndex - 1 });
      if (hit?.kind === "add") return setUploadOpen(true);
      if (hit?.kind === "photo" && spec.kind === "photo") return setPhoto(spec.page);
      // sonst umblättern: rechte Seite → vor, linke Seite → zurück
      go(pageIndex % 2 === 0 ? current + 1 : current - 1);
    },
    [pages, current, go],
  );

  const onAdded = (page: UserPage) => {
    const next = [...userPages, page];
    setUserPages(next);
    setUploadOpen(false);
    // zur neuen Seite blättern
    const idx = buildPages(next).findIndex((p) => p.kind === "photo" && p.page.id === page.id);
    setCurrent(Math.ceil(idx / 2));
  };

  const onRemove = async (page: UserPage) => {
    await deleteUserPage(page.id);
    setUserPages((ps) => ps.filter((p) => p.id !== page.id));
    setPhoto(null);
  };

  const hint = current === 0 ? "Ein kleines Heft. Viele schöne Fundstücke." : current === leaves ? "Platz für neue Erinnerungen." : "Anfassen. Umblättern. Entdecken.";
  const stampCount = BUILTIN_SECTIONS.reduce((sum, section) => sum + section.stamps.length, 0);
  const pageLabel = current === 0 ? "Einband" : current === leaves ? "Rückseite" : `Doppelseite ${String(current).padStart(2, "0")}`;

  return (
    <main className="book-studio">
      <Background />
      <header className="studio-header">
        <div>
          <p className="studio-eyebrow">Eine persönliche Sammlung</p>
          <h1 className="studio-title">Stanzheft<span>.</span></h1>
        </div>
        <div className="studio-edition" aria-hidden="true"><span className="edition-dot" />Mit Liebe gesammelt<span className="edition-number">VOL. 01</span></div>
      </header>

      <section className="book-stage" aria-label="Interaktives 3D-Stanzheft" inert={collectionOpen || uploadOpen || !!stamp || !!photo}>
        <Book3D pages={pages} current={current} onCurrentChange={go} onHit={onHit} fonts={FONTS} />
      </section>

      <footer className="studio-footer">
        <p className="book-caption">{hint}</p>
        <div className="book-hud">
          <div className="hud-page" aria-live="polite"><span>{pageLabel}</span><span className="hud-page-index">{String(current).padStart(2, "0")} <i>/</i> {String(leaves).padStart(2, "0")}</span></div>
          <div className="hud-divider" />
          <Dock
            theme="dark"
            accentColor="#c3b09a"
            baseItemSize={36}
            magnification={42}
            panelHeight={44}
            gap={2}
            tiles={false}
            bounce={false}
            showIndicators={false}
            className="!static !transform-none"
            style={{ background: "transparent", boxShadow: "none", backdropFilter: "none" }}
            items={[
              { icon: <BookOpen size={17} strokeWidth={1.5} />, label: current === 0 ? "Buch aufschlagen" : "Buch zuklappen", onClick: () => go(current === 0 ? 1 : 0) },
              { icon: <ChevronLeft size={19} strokeWidth={1.5} />, label: "Zurück", onClick: () => go(current - 1), disabled: current === 0 },
              { icon: <ChevronRight size={19} strokeWidth={1.5} />, label: "Weiter", onClick: () => go(current + 1), disabled: current === leaves },
              { icon: <Plus size={18} strokeWidth={1.5} />, label: "Seite einkleben", onClick: () => setUploadOpen(true) },
            ]}
          />
          <div className="hud-divider" />
          <Popover.Root open={collectionOpen} onOpenChange={setCollectionOpen}>
            <Popover.Trigger className="collection-trigger" aria-label="Sammlungsübersicht öffnen">
              <CircleDot size={18} strokeWidth={1.4} />
              <span className="collection-trigger-label">Sammlung</span>
              <span className="collection-count">{stampCount}</span>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="collection-popover" side="top" align="end" sideOffset={18} collisionPadding={16} aria-label="Sammlungsübersicht">
                <div className="collection-heading"><div><p className="studio-eyebrow">Kleine Schätze</p><h2>Deine Sammlung</h2></div><Popover.Close className="collection-close" aria-label="Sammlung schließen"><X size={17} /></Popover.Close></div>
                <CollectionStats userPages={userPages} />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <p className="studio-footnote"><span>Digital gebunden. Persönlich gesammelt.</span><span>Blättern mit ← →</span></p>
      </footer>

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onAdded={onAdded} />
      <StampDetail value={stamp} onClose={() => setStamp(null)} />
      <PhotoViewer page={photo} onClose={() => setPhoto(null)} onRemove={onRemove} />
    </main>
  );
}
