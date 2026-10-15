"use client";

import { useEffect, useState } from "react";
import FloatingLines from "@/components/FloatingLines";
import LineWaves from "@/components/LineWaves";
import { LiquidLines } from "@/components/LiquidLines";
import Silk from "@/components/Silk";
import Threads from "@/components/Threads";

/* Animierter Schreibtisch-Hintergrund (React Bits). Zum Vergleichen per URL umschaltbar:
 * ?bg=lines (Standard) · threads · wellen · seide · eigen */

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

export function Background() {
  const [variant, setVariant] = useState<Variant>("lines");

  useEffect(() => {
    const bg = new URLSearchParams(window.location.search).get("bg");
    if (bg && bg in VARIANTS) setVariant(bg as Variant);
  }, []);

  const Render = VARIANTS[variant];
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden>
      <Render />
    </div>
  );
}
