import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { makeLeafTexture, PAGE_H, PAGE_W, type Leaf } from './textures';

const SEGMENTS = 30;
const SHEET_GAP = 0.004;
const FLIP_SPEED = 3.2;
const CURL = 0.9;

function useLeafTexture(leaf: Leaf, mirrored: boolean) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const id = `${leaf.key}:${leaf.pageNo ?? ''}:${leaf.url ?? ''}`;
  useEffect(() => {
    let alive = true;
    let made: THREE.Texture | null = null;
    makeLeafTexture(leaf, mirrored).then(t => {
      made = t;
      if (alive) setTex(t);
      else t.dispose();
    });
    return () => {
      alive = false;
      made?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mirrored]);
  return tex;
}

type SheetProps = {
  index: number;
  total: number;
  front: Leaf;
  back: Leaf;
  flipped: boolean;
  isCover: boolean;
  onFlip: (index: number, forward: boolean, e: ThreeEvent<MouseEvent>) => void;
};

function Sheet({ index, total, front, back, flipped, isCover, onFlip }: SheetProps) {
  const frontTex = useLeafTexture(front, false);
  const backTex = useLeafTexture(back, true);
  const progress = useRef(flipped ? 1 : 0);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(PAGE_W, PAGE_H, SEGMENTS, 1);
    g.translate(PAGE_W / 2, 0, 0);
    g.userData.restX = Float32Array.from(
      { length: g.attributes.position.count },
      (_, i) => g.attributes.position.getX(i)
    );
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Spalten-Positionen werden pro Frame entlang eines Bogens neu berechnet (Papier wölbt sich beim Blättern)
  const columns = useMemo(() => new Float32Array((SEGMENTS + 1) * 2), []);

  useFrame((_, dt) => {
    const target = flipped ? 1 : 0;
    const p = progress.current;
    if (Math.abs(target - p) < 0.0005 && geometry.userData.settled === target) return;
    const next = p + Math.sign(target - p) * Math.min(Math.abs(target - p), dt * FLIP_SPEED * (0.35 + Math.sin(p * Math.PI) * 0.9));
    progress.current = Math.abs(target - next) < 0.0005 ? target : next;
    geometry.userData.settled = progress.current === target ? target : -1;

    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    const theta = eased * Math.PI;
    const curl = (isCover ? 0.15 : CURL) * Math.sin(t * Math.PI) * (flipped ? 1 : -1);
    const seg = PAGE_W / SEGMENTS;
    let x = 0;
    let z = 0;
    columns[0] = 0;
    columns[1] = 0;
    for (let c = 1; c <= SEGMENTS; c++) {
      const s = (c - 0.5) / SEGMENTS;
      const a = Math.min(Math.PI, Math.max(0, theta - curl * s * s));
      x += Math.cos(a) * seg;
      z += Math.sin(a) * seg;
      columns[c * 2] = x;
      columns[c * 2 + 1] = z;
    }

    // Stapelhöhe: rechts liegt Blatt 0 oben, links das zuletzt umgeblätterte
    const zRight = (total - index) * SHEET_GAP;
    const zLeft = (index + 1) * SHEET_GAP;
    const zBase = zRight + (zLeft - zRight) * eased + Math.sin(t * Math.PI) * 0.02;

    const pos = geometry.attributes.position;
    const restX: Float32Array = geometry.userData.restX;
    for (let i = 0; i < pos.count; i++) {
      const c = Math.round((restX[i] / PAGE_W) * SEGMENTS);
      pos.setX(i, columns[c * 2]);
      pos.setZ(i, columns[c * 2 + 1] + zBase);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onFlip(index, !flipped, e);
  };

  return (
    <group>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <meshStandardMaterial
          key={frontTex?.uuid ?? 'none'}
          map={frontTex}
          color={frontTex ? '#ffffff' : '#f7f3ea'}
          side={THREE.FrontSide}
          roughness={isCover ? 0.75 : 0.92}
        />
      </mesh>
      <mesh geometry={geometry} castShadow receiveShadow onClick={handleClick}>
        <meshStandardMaterial
          key={backTex?.uuid ?? 'none'}
          map={backTex}
          color={backTex ? '#ffffff' : '#f7f3ea'}
          side={THREE.BackSide}
          roughness={isCover ? 0.75 : 0.92}
        />
      </mesh>
    </group>
  );
}

export type BookProps = {
  leaves: Leaf[];
  flipped: number;
  onFlipTo: (flipped: number, point: { x: number; y: number }) => void;
};

export default function Book({ leaves, flipped, onFlipTo }: BookProps) {
  const group = useRef<THREE.Group>(null);
  const sheets = useMemo(() => {
    const out: { front: Leaf; back: Leaf }[] = [];
    for (let i = 0; i < leaves.length; i += 2) out.push({ front: leaves[i], back: leaves[i + 1] });
    return out;
  }, [leaves]);

  // Geschlossenes Heft mittig ausrichten, aufgeschlagenes am Rücken zentrieren
  const targetX = flipped === 0 ? -PAGE_W / 2 : flipped >= sheets.length ? PAGE_W / 2 : 0;
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.position.x += (targetX - group.current.position.x) * Math.min(1, dt * 4);
  });

  return (
    <group ref={group} position={[targetX, 0, 0]}>
      {sheets.map((s, i) => (
        <Sheet
          key={i}
          index={i}
          total={sheets.length}
          front={s.front}
          back={s.back}
          flipped={i < flipped}
          isCover={i === 0 || i === sheets.length - 1}
          onFlip={(idx, forward, e) =>
            onFlipTo(forward ? idx + 1 : idx, { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY })
          }
        />
      ))}
    </group>
  );
}
