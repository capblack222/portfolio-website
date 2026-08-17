"use client";

import { useEffect, useRef } from "react";
import { canRunTrail, useTrailEnabled } from "@/lib/trail-preference";

const GRID = 8;
const POOL_SIZE = 180;
const DECAY = 0.02;
const IDLE_MS = 1000;
const COLORS = ["#7c5cff", "#a78bfa", "#35e0a1", "#ffb86b"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

/**
 * Pixel cursor trail.
 *
 * Design notes that matter if you change this:
 *
 * - Particles are spawned inside the rAF loop, never in the pointermove
 *   handler. Spawning per event ties particle count to the browser's event
 *   rate, which is what makes these effects stutter on high-polling mice.
 * - Positions snap to an 8px grid, the same grid the layout uses. That
 *   alignment is what makes it read as pixel art rather than smoke.
 * - The pool is preallocated and recycled oldest-first, so the loop never
 *   allocates and never triggers GC mid-animation.
 * - The loop stops entirely when the tab is hidden or the pointer has been
 *   idle, rather than burning a frame budget on an empty canvas.
 */
export function PixelCursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = useTrailEnabled();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!enabled || !canRunTrail()) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    const pool: Particle[] = Array.from({ length: POOL_SIZE }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      size: GRID,
      color: COLORS[0],
    }));

    let head = 0;
    let mouseX = -999;
    let mouseY = -999;
    let prevX = -999;
    let prevY = -999;
    let lastMove = 0;
    let frame = 0;

    function onPointerMove(event: PointerEvent) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      lastMove = performance.now();
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function spawn(x: number, y: number) {
      const p = pool[head];
      head = (head + 1) % POOL_SIZE;
      p.x = Math.floor(x / GRID) * GRID;
      p.y = Math.floor(y / GRID) * GRID;
      p.vx = (Math.random() - 0.5) * 0.9;
      p.vy = Math.random() * 0.7 + 0.15;
      p.life = 1;
      p.size = Math.random() < 0.25 ? GRID * 2 : GRID;
      p.color = COLORS[(Math.random() * COLORS.length) | 0];
    }

    function tick(now: number) {
      ctx!.clearRect(0, 0, width, height);

      const idle = now - lastMove > IDLE_MS;

      if (!idle) {
        const travelled = Math.hypot(mouseX - prevX, mouseY - prevY);
        const count = Math.min(4, 1 + Math.floor(travelled / 10));
        for (let i = 0; i < count; i++) {
          spawn(mouseX + (Math.random() - 0.5) * 10, mouseY + (Math.random() - 0.5) * 10);
        }
      }

      prevX = mouseX;
      prevY = mouseY;

      let alive = 0;

      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (p.life <= 0) continue;

        p.life -= DECAY;
        p.x += p.vx;
        p.y += p.vy;

        const alpha = p.life * p.life;
        if (alpha <= 0) continue;

        alive++;
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.fillRect(
          Math.floor(p.x / GRID) * GRID,
          Math.floor(p.y / GRID) * GRID,
          p.life > 0.5 ? p.size : GRID,
          p.life > 0.5 ? p.size : GRID,
        );
      }

      ctx!.globalAlpha = 1;

      // Nothing moving and nothing left to fade: stop until the next move.
      if (idle && alive === 0) {
        frame = 0;
        return;
      }

      frame = requestAnimationFrame(tick);
    }

    function onVisibility() {
      if (document.hidden) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else {
        lastMove = performance.now();
        if (!frame) frame = requestAnimationFrame(tick);
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      if (frame) cancelAnimationFrame(frame);
      // Wipe on teardown, otherwise switching the trail off leaves the last
      // frame of particles frozen on screen.
      ctx.clearRect(0, 0, width, height);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
