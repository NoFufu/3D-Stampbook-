import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';

import Aurora from './reactbits/Aurora';
import BlurText from './reactbits/BlurText';
import ClickSpark, { type ClickSparkHandle } from './reactbits/ClickSpark';
import Dock, { type DockItemData } from './reactbits/Dock';
import StarBorder from './reactbits/StarBorder';

import Book from './book/Book';
import type { Leaf } from './book/textures';
import { demoPages, loadPages, savePages, shrinkImage, type StoredPage } from './storage';
import { IconBack, IconBook, IconForward, IconPlus, IconTrash, IconView } from './icons';

const MIN_PAGES = 8;

// Auf schmalen Bildschirmen herauszoomen, damit die aufgeschlagene Doppelseite ganz sichtbar bleibt
function FitCamera() {
  const camera = useThree(s => s.camera);
  const aspect = useThree(s => s.size.width / s.size.height);
  useEffect(() => {
    camera.zoom = Math.min(1, (aspect * 3.2) / 3.4);
    camera.updateProjectionMatrix();
  }, [camera, aspect]);
  return null;
}

export default function App() {
  const [pages, setPages] = useState<StoredPage[] | null>(null);
  const [flipped, setFlipped] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const spark = useRef<ClickSparkHandle>(null);

  useEffect(() => {
    loadPages().then(p => setPages(p ?? demoPages()));
  }, []);

  useEffect(() => {
    if (pages) savePages(pages);
  }, [pages]);

  // Object-URLs für hochgeladene Bilder; werden beim Entfernen wieder freigegeben
  const urls = useMemo(() => {
    const map = new Map<string, string>();
    pages?.forEach(p => p.kind === 'image' && map.set(p.id, URL.createObjectURL(p.blob)));
    return map;
  }, [pages]);
  useEffect(() => () => urls.forEach(u => URL.revokeObjectURL(u)), [urls]);

  // Heft = Umschlag, Innendeckel, Seiten (mit leeren Karo-Seiten aufgefüllt), Innendeckel, Rückseite
  const leaves = useMemo<Leaf[]>(() => {
    const list = pages ?? [];
    const content: Leaf[] = list.map((p, i) =>
      p.kind === 'image'
        ? { key: p.id, kind: 'image', url: urls.get(p.id), pageNo: i + 1 }
        : { key: p.id, kind: 'demo', variant: p.variant, pageNo: i + 1 }
    );
    let n = Math.max(MIN_PAGES, content.length);
    if (n % 2) n++;
    for (let i = content.length; i < n; i++) content.push({ key: `blank-${i}`, kind: 'blank', pageNo: i + 1 });
    return [
      { key: 'cover', kind: 'cover' },
      { key: 'inside-front', kind: 'inside' },
      ...content,
      { key: 'inside-back', kind: 'blank' },
      { key: 'backcover', kind: 'backcover' }
    ];
  }, [pages, urls]);

  const sheetCount = leaves.length / 2;
  const clampFlip = useCallback((f: number) => Math.max(0, Math.min(sheetCount, f)), [sheetCount]);

  const flipTo = useCallback(
    (f: number, point?: { x: number; y: number }) => {
      setFlipped(clampFlip(f));
      if (point) spark.current?.spark(point.x, point.y);
    },
    [clampFlip]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setFlipped(f => clampFlip(f + 1));
      if (e.key === 'ArrowLeft') setFlipped(f => clampFlip(f - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clampFlip]);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(t => (t === msg ? null : t)), 2600);
  };

  // Seitenindex (0-basiert in `pages`) der rechten bzw. linken aufgeschlagenen Seite.
  // Leaf-Index 2f ist die rechte Seite, 2f-1 die linke; Inhaltsseiten beginnen bei Leaf 2.
  const rightPage = flipped * 2 - 2;
  const leftPage = flipped * 2 - 3;

  const insertPages = async (files: FileList | null) => {
    if (!files?.length || !pages) return;
    const blobs = await Promise.all([...files].map(f => shrinkImage(f)));
    const added: StoredPage[] = blobs.map(blob => ({
      id: crypto.randomUUID(),
      kind: 'image',
      blob,
      createdAt: Date.now()
    }));
    const at = Math.max(0, Math.min(pages.length, rightPage));
    setPages([...pages.slice(0, at), ...added, ...pages.slice(at)]);
    // dorthin blättern, wo die neue Seite liegt
    setFlipped(Math.ceil((at + 2) / 2));
    notify(added.length === 1 ? `Seite ${at + 1} eingefügt` : `${added.length} Seiten eingefügt`);
  };

  const deletePage = (index: number) => {
    if (!pages || index < 0 || index >= pages.length) return notify('Hier ist keine Seite zum Löschen');
    setPages(pages.filter((_, i) => i !== index));
    notify(`Seite ${index + 1} gelöscht`);
  };

  const resetView = () => controls.current?.reset();

  const dockItems: DockItemData[] = [
    { icon: <IconBook />, label: 'Zuklappen', onClick: () => flipTo(0) },
    { separator: true },
    { icon: <IconBack />, label: 'Zurück', onClick: () => flipTo(flipped - 1) },
    { icon: <IconForward />, label: 'Weiter', onClick: () => flipTo(flipped + 1) },
    { separator: true },
    { icon: <IconPlus />, label: 'Seite einfügen', onClick: () => fileInput.current?.click(), active: true },
    {
      icon: <IconTrash />,
      label: 'Seite löschen',
      menu: [
        { label: 'Linke Seite löschen', onClick: () => deletePage(leftPage), disabled: !pages || leftPage < 0 || leftPage >= pages.length },
        { label: 'Rechte Seite löschen', onClick: () => deletePage(rightPage), disabled: !pages || rightPage < 0 || rightPage >= pages.length },
        { separator: true },
        { label: 'Beispielseiten wiederherstellen', onClick: () => { setPages(demoPages()); flipTo(1); } }
      ]
    },
    { icon: <IconView />, label: 'Ansicht zurücksetzen', onClick: resetView }
  ];

  const contentCount = leaves.length - 4;
  const visible = [leftPage, rightPage].filter(i => i >= 0 && i < contentCount).map(i => i + 1);
  const spreadLabel =
    flipped === 0
      ? 'Umschlag'
      : flipped >= sheetCount
        ? 'Rückseite'
        : visible.length === 0
          ? 'Innendeckel'
          : `Seite ${visible.join('–')}`;

  return (
    <div className="app">
      <div className="bg">
        <Aurora colorStops={['#3a2b6b', '#1f6f6b', '#c77b4a']} amplitude={0.9} blend={0.6} speed={0.5} />
      </div>

      <header className="top">
        <BlurText text="Mein 3D-Stempelheft" className="title" delay={120} animateBy="words" direction="top" />
        <p className="subtitle">Klick auf eine Seite zum Blättern, ziehen zum Drehen, Pfeiltasten gehen auch.</p>
      </header>

      <div className="stage">
        <Canvas shadows camera={{ position: [0, 0.6, 4.4], fov: 40 }} dpr={[1, 2]}>
          <FitCamera />
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[2.5, 3, 4]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0004}
          />
          <directionalLight position={[-3, 1, 2]} intensity={0.4} />
          <group rotation={[-0.32, 0, 0]}>
            {pages && <Book leaves={leaves} flipped={flipped} onFlipTo={flipTo} />}
          </group>
          <ContactShadows position={[0, -1.25, 0]} opacity={0.45} scale={8} blur={2.6} far={3} />
          <OrbitControls
            ref={controls}
            enablePan={false}
            minDistance={2.5}
            maxDistance={7}
            minPolarAngle={Math.PI * 0.2}
            maxPolarAngle={Math.PI * 0.62}
            minAzimuthAngle={-Math.PI / 3}
            maxAzimuthAngle={Math.PI / 3}
          />
        </Canvas>
      </div>

      <ClickSpark
        ref={spark}
        sparkColor={['#e8cd8c', '#ffffff', '#f2a65a']}
        sparkCount={10}
        sparkRadius={28}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}
      />

      <aside className="side">
        <span className="spread">{spreadLabel}</span>
        <StarBorder as="button" color="#e8cd8c" onClick={() => fileInput.current?.click()}>
          + Foto oder Scan einfügen
        </StarBorder>
        <span className="hint">Neue Seiten landen rechts auf der aufgeschlagenen Doppelseite.</span>
      </aside>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={e => {
          insertPages(e.target.files).catch(() => notify('Das Bild konnte nicht gelesen werden'));
          e.target.value = '';
        }}
      />

      {toast && <div className="toast">{toast}</div>}

      <Dock items={dockItems} position="bottom" theme="dark" accentColor="#e8cd8c" baseItemSize={48} magnification={66} />
    </div>
  );
}
