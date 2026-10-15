"use client";

import { useEffect, useRef } from "react";

/* Hintergrund: feine, langsam fließende Linien (Höhenlinien eines Rauschfelds).
 * Eigener WebGL2-Shader, angelehnt an „Liquid Lines“ von React Bits Pro. */

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBg;
uniform vec3 uLine;
uniform vec3 uGlow;
out vec4 o;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
             mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.035;
  // Feld leicht verwirbeln, damit die Linien wie Flüssigkeit fließen
  vec2 q = uv * 1.35;
  q += 0.45 * vec2(fbm(q + vec2(t, -t * 0.7)), fbm(q + vec2(-t * 0.6, t) + 3.1));
  float f = fbm(q + vec2(0.0, t * 0.4)) * 4.0 + uv.y * 16.0;

  float d = abs(fract(f) - 0.5);
  float w = fwidth(f);
  float line = 1.0 - smoothstep(0.0, w * 1.1, d);

  // Linien zur Mitte hin dunkler, damit das Heft ruhig bleibt
  float vign = smoothstep(0.15, 0.95, length(uv * vec2(0.85, 1.15)));
  float glow = exp(-2.2 * length(uv - vec2(0.35, 0.42)));
  vec3 col = uBg + uGlow * glow * 0.10;
  col = mix(col, uLine, line * (0.06 + 0.22 * vign));
  o = vec4(col, 1.0);
}`;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

export function LiquidLines({
  background = "#141317",
  line = "#b9a3dc",
  glow = "#7c4fc4",
  className,
}: {
  background?: string;
  line?: string;
  glow?: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, alpha: false });
    if (!canvas || !gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    gl.uniform3fv(gl.getUniformLocation(prog, "uBg"), hex(background));
    gl.uniform3fv(gl.getUniformLocation(prog, "uLine"), hex(line));
    gl.uniform3fv(gl.getUniformLocation(prog, "uGlow"), hex(glow));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    const frame = () => {
      gl.uniform1f(uTime, still ? 20 : 20 + (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!still) raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [background, line, glow]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
