"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { PageSpec } from "@/lib/pages";
import { drawPage, type HitRegion, type PageFonts } from "./page-texture";

const PW = 1; // Seitenbreite in Welt-Einheiten
const PH = 1.1;
const SEG = 32; // Unterteilung für die Papierbiegung
const STACK = 0.0016; // Abstand zwischen den Blättern
const CURL = 0.55; // wie stark sich das Blatt beim Umblättern biegt

type Face = { tex: THREE.CanvasTexture; hits: HitRegion[] };
type Drag = { leaf: number; p: number } | null;

export type Book3DProps = {
  pages: PageSpec[];
  current: number; // Anzahl umgeblätterter Blätter
  onCurrentChange: (n: number) => void;
  onHit: (hit: HitRegion | null, pageIndex: number) => void;
  fonts: PageFonts;
};

function useFaces(pages: PageSpec[], fonts: PageFonts) {
  const [faces, setFaces] = useState<Face[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const made: Face[] = [];
    (async () => {
      await Promise.all(
        [`800 64px ${fonts.display}`, `500 58px ${fonts.pencil}`, `400 26px ${fonts.mono}`, `400 34px ${fonts.body}`].map(
          (f) => document.fonts.load(f).catch(() => undefined),
        ),
      );
      for (let i = 0; i < pages.length; i++) {
        const { canvas, hits } = await drawPage(pages[i], i - 1, i % 2 === 0 ? "front" : "back", fonts);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        if (i % 2 === 1) {
          // Rückseite wird von hinten gesehen → horizontal spiegeln
          tex.wrapS = THREE.RepeatWrapping;
          tex.repeat.x = -1;
        }
        made.push({ tex, hits });
        if (cancelled) break;
      }
      if (!cancelled) setFaces(made);
    })();
    return () => {
      cancelled = true;
    };
  }, [pages, fonts]);
  useEffect(() => () => faces?.forEach((f) => f.tex.dispose()), [faces]);
  return faces;
}

function Leaf({
  index,
  front,
  back,
  currentRef,
  dragRef,
  onDown,
  onClick,
}: {
  index: number;
  front: Face;
  back: Face;
  currentRef: RefObject<number>;
  dragRef: RefObject<Drag>;
  onDown: (e: ThreeEvent<PointerEvent>, pageIndex: number) => void;
  onClick: (e: ThreeEvent<MouseEvent>, pageIndex: number) => void;
}) {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(PW, PH, SEG, 1);
    g.translate(PW / 2, 0, 0);
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  const p = useRef(index < currentRef.current ? 1 : 0);
  const last = useRef(-1);

  useFrame((_, dt) => {
    const drag = dragRef.current;
    const dragging = drag && drag.leaf === index;
    const target = dragging ? drag.p : index < currentRef.current ? 1 : 0;
    p.current += (target - p.current) * (1 - Math.exp(-(dragging ? 20 : 5) * Math.min(dt, 0.05)));
    if (Math.abs(p.current - last.current) < 1e-5) return;
    last.current = p.current;

    const t = p.current;
    const lift = Math.sin(t * Math.PI);
    const zOff = (-index + 2 * index * t) * STACK;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const dx = PW / SEG;
    let x = 0, z = 0;
    const xs = [0], zs = [0];
    for (let i = 1; i <= SEG; i++) {
      const phi = t * Math.PI - CURL * lift * ((i - 0.5) / SEG) ** 1.4;
      x += Math.cos(phi) * dx;
      z += Math.sin(phi) * dx;
      xs.push(x);
      zs.push(z);
    }
    for (let v = 0; v < pos.count; v++) {
      const ix = v % (SEG + 1);
      pos.setX(v, xs[ix]);
      pos.setZ(v, zs[ix] + zOff);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
  });

  return (
    <group>
      <mesh
        geometry={geom}
        castShadow
        receiveShadow
        onPointerDown={(e) => onDown(e, index * 2)}
        onClick={(e) => onClick(e, index * 2)}
      >
        <meshStandardMaterial map={front.tex} roughness={0.92} side={THREE.FrontSide} />
      </mesh>
      <mesh
        geometry={geom}
        castShadow
        receiveShadow
        onPointerDown={(e) => onDown(e, index * 2 + 1)}
        onClick={(e) => onClick(e, index * 2 + 1)}
      >
        <meshStandardMaterial map={back.tex} roughness={0.92} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const half = THREE.MathUtils.degToRad(cam.fov / 2);
    const aspect = size.width / size.height;
    const byW = 2.25 / 2 / (Math.tan(half) * aspect);
    const byH = 1.45 / 2 / Math.tan(half);
    cam.position.set(0, 0, Math.max(byW, byH) + 0.35);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Scene({ faces, current, onCurrentChange, onHit }: Omit<Book3DProps, "pages" | "fonts"> & { faces: Face[] }) {
  const leaves = faces.length / 2;
  const currentRef = useRef(current);
  currentRef.current = current;
  const dragRef = useRef<Drag>(null);
  const start = useRef<{ x: number; pageIndex: number } | null>(null);
  const tilt = useRef<THREE.Group>(null);
  const shift = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const reduce = useMemo(() => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // Ziehen zum Umblättern
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.x;
      const w = gl.domElement.clientWidth * 0.45;
      const cur = currentRef.current;
      const rightPage = s.pageIndex === cur * 2;
      if (rightPage && dx < -8 && cur < leaves) dragRef.current = { leaf: cur, p: THREE.MathUtils.clamp(-dx / w, 0, 1) };
      else if (!rightPage && dx > 8 && cur > 0) dragRef.current = { leaf: cur - 1, p: 1 - THREE.MathUtils.clamp(dx / w, 0, 1) };
    };
    const up = () => {
      const d = dragRef.current;
      const cur = currentRef.current;
      if (d) {
        if (d.leaf === cur && d.p > 0.3) onCurrentChange(cur + 1);
        else if (d.leaf === cur - 1 && d.p < 0.7) onCurrentChange(cur - 1);
      }
      dragRef.current = null;
      start.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl, leaves, onCurrentChange]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-4 * Math.min(dt, 0.05));
    if (shift.current) {
      const target = current === 0 ? -PW / 2 : current === leaves ? PW / 2 : 0;
      shift.current.position.x += (target - shift.current.position.x) * k;
    }
    if (tilt.current) {
      const px = reduce ? 0 : state.pointer.x, py = reduce ? 0 : state.pointer.y;
      tilt.current.rotation.x += (-0.5 + py * 0.06 - tilt.current.rotation.x) * k;
      tilt.current.rotation.y += (px * 0.12 - tilt.current.rotation.y) * k;
    }
  });

  const onDown = (e: ThreeEvent<PointerEvent>, pageIndex: number) => {
    e.stopPropagation();
    start.current = { x: e.nativeEvent.clientX, pageIndex };
  };
  const onClick = (e: ThreeEvent<MouseEvent>, pageIndex: number) => {
    e.stopPropagation();
    if (e.delta > 6 || !e.uv) return;
    const u = pageIndex % 2 === 1 ? 1 - e.uv.x : e.uv.x;
    const v = 1 - e.uv.y;
    const hit = faces[pageIndex].hits.find((h) => u >= h.u0 && u <= h.u1 && v >= h.v0 && v <= h.v1) ?? null;
    onHit(hit, pageIndex);
  };

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[-1.6, 2.2, 3.2]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />
      <pointLight position={[1.5, -1, 1.5]} intensity={0.6} color="#b48cff" />
      <group ref={tilt} rotation={[-0.5, 0, 0]}>
        <mesh position={[0, 0, -0.04]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          {/* nur der Schatten des Hefts; der Schreibtisch selbst ist der Hintergrund */}
          <shadowMaterial opacity={0.55} />
        </mesh>
        <group ref={shift} position={[-PW / 2, 0, 0]}>
          {Array.from({ length: leaves }, (_, i) => (
            <Leaf
              key={i}
              index={i}
              front={faces[i * 2]}
              back={faces[i * 2 + 1]}
              currentRef={currentRef}
              dragRef={dragRef}
              onDown={onDown}
              onClick={onClick}
            />
          ))}
          {/* Lesebändchen */}
          <mesh position={[0.01, -PH / 2 - 0.06, -0.03]} rotation={[0, 0, 0.08]} castShadow>
            <planeGeometry args={[0.028, 0.2]} />
            <meshStandardMaterial color="#5b26a0" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <FitCamera />
    </>
  );
}

export default function Book3D({ pages, fonts, ...rest }: Book3DProps) {
  const faces = useFaces(pages, fonts);
  return (
    <div className="relative h-full w-full touch-pan-y">
      {!faces && (
        <div className="absolute inset-0 grid place-items-center font-mono text-xs tracking-widest text-[var(--ink-soft)] uppercase">
          Heft wird gebunden …
        </div>
      )}
      {faces && (
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 30, position: [0, 0, 3] }} gl={{ antialias: true }}>
          <Scene faces={faces} {...rest} />
        </Canvas>
      )}
    </div>
  );
}
