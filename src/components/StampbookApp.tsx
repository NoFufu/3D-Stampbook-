"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, ChevronsRight, Plus } from "lucide-react";
import Dock from "@/components/Dock";
import { Background } from "@/components/Background";
import { buildPages, deleteUserPage, listUserPages, type UserPage } from "@/lib/pages";
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
  loading: () => <div className="h-[268px] rounded-3xl border border-[var(--line)] bg-[var(--card)]" />,
});

const FONTS = {
  display: display.style.fontFamily,
  body: body.style.fontFamily,
  mono: mono.style.fontFamily,
  pencil: pencil.style.fontFamily,
};

export default function StampbookApp() {
  const [userPages, setUserPages] = useState<UserPage[]>([]);
  const [current, setCurrent] = useState(0);
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
      if (uploadOpen || stamp || photo) return;
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [current, go, uploadOpen, stamp, photo]);

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

  const hint =
    current === 0 ? "Tippen oder nach links ziehen zum Aufschlagen" : current === leaves ? "Ende des Hefts" : "Blatt anfassen und ziehen · oder tippen";

  return (
    <main className="relative min-h-svh overflow-x-clip bg-[var(--desk)] text-[var(--ink)]">
      <Background />

      <section className="relative mt-14 h-[clamp(440px,68svh,600px)] sm:h-[min(80svh,780px)]" aria-label="3D-Heft">
        <Book3D pages={pages} current={current} onCurrentChange={go} onHit={onHit} fonts={FONTS} />
        <p className="pointer-events-none absolute inset-x-0 bottom-[92px] text-center text-xs text-[var(--ink-soft)]">{hint}</p>
        <Dock
          theme="dark"
          accentColor="#a77be0"
          baseItemSize={46}
          magnification={66}
          panelHeight={62}
          showIndicators={false}
          items={[
            { icon: <BookOpen size={20} />, label: "Zuklappen", onClick: () => go(0) },
            { icon: <ChevronLeft size={22} />, label: "Zurück", onClick: () => go(current - 1) },
            { icon: <Plus size={22} />, label: "Seite einkleben", onClick: () => setUploadOpen(true), active: true },
            { icon: <ChevronRight size={22} />, label: "Weiter", onClick: () => go(current + 1) },
            { icon: <ChevronsRight size={22} />, label: "Letzte Seite", onClick: () => go(leaves - 1) },
          ]}
        />
      </section>

      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-8">
        <CollectionStats userPages={userPages} />
      </div>

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onAdded={onAdded} />
      <StampDetail value={stamp} onClose={() => setStamp(null)} />
      <PhotoViewer page={photo} onClose={() => setPhoto(null)} onRemove={onRemove} />
    </main>
  );
}
