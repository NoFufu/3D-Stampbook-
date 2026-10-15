"use client";

import { useEffect, useState } from "react";
import FloatingLines from "@/components/FloatingLines";
import LineWaves from "@/components/LineWaves";
import { LiquidLines } from "@/components/LiquidLines";
import Silk from "@/components/Silk";
import Threads from "@/components/Threads";

/* Animierter Schreibtisch-Hintergrund (React Bits). Auswahl oben rechts auf der Seite,
 * wird im Browser gemerkt; per URL vorwählbar: ?bg=lines|threads|wellen|seide|eigen */

const VARIANTS = {
  lines: () => (
    <FloatingLines
      linesGradient={["#3b2a5c", "#7c4fc4", "#b9a3dc"]}
      enabledWaves={["top", "bottom"]}
      lineCount={[8, 6]}
      lineDistance={[7, 9]}
      animationSpeed={0.5}
      glow={0.6}
      brightness={0.55}
      bendStrength={-0.3}
      clickSwirl={false}
      intro={false}
      backgroundColor="#141317"
    />
  ),
  threads: () => (
    <Threads
      color="#7c4fc4"
      accentColor="#b9a3dc"
      lineCount={70}
      speed={0.35}
      brightness={0.6}
      opacity={0.55}
      enableMouseInteraction
    />
  ),
  wellen: () => (
    <LineWaves
      color1="#7c4fc4"
      color2="#b9a3dc"
      color3="#3b2a5c"
      speed={0.2}
      brightness={0.45}
      glow={0.4}
      clickRipple={false}
      intro={false}
      opacity={0.7}
    />
  ),
  seide: () => (
    <Silk
      color="#2a2433"
      sheenColor="#b9a3dc"
      speed={2.5}
      sheen={0.35}
      glow={0.2}
      clickRipple={false}
      intro={false}
    />
  ),
  eigen: () => <LiquidLines className="h-full w-full" />,
} as const;

type Variant = keyof typeof VARIANTS;

const LABELS: Record<Variant, string> = {
  lines: "Lichtbänder",
  threads: "Fäden",
  wellen: "Wellen",
  seide: "Seide",
  eigen: "Linien",
};

const isVariant = (v: string | null): v is Variant => !!v && v in VARIANTS;

export function Background() {
  const [variant, setVariant] = useState<Variant>("lines");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("stanzheft-bg");
    } catch {}
    const fromUrl = new URLSearchParams(window.location.search).get("bg");
    const pick = isVariant(fromUrl) ? fromUrl : isVariant(saved) ? saved : null;
    if (pick) setVariant(pick);
  }, []);

  const choose = (v: Variant) => {
    setVariant(v);
    try {
      localStorage.setItem("stanzheft-bg", v);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("bg", v);
    window.history.replaceState(null, "", url);
  };

  const Render = VARIANTS[variant];
  return (
    <>
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <Render key={variant} />
      </div>
      <div
        role="radiogroup"
        aria-label="Hintergrund"
        className="fixed top-3 right-3 z-30 flex gap-1 rounded-full border border-white/10 bg-[#1c1b21]/80 p-1 text-xs backdrop-blur-md sm:top-5 sm:right-5"
      >
        {(Object.keys(VARIANTS) as Variant[]).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={variant === v}
            onClick={() => choose(v)}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              variant === v ? "bg-[#7c4fc4] text-white" : "text-[var(--ink-soft)] hover:bg-white/10 hover:text-[var(--ink)]"
            }`}
          >
            {LABELS[v]}
          </button>
        ))}
      </div>
    </>
  );
}
