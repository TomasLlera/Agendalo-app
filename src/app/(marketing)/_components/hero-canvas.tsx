"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";

/**
 * Animated mesh background + cursor-following glow for the hero.
 * Pure CSS gradients + a single pointer-tracked blob — no canvas, no
 * heavy listeners on scroll.
 */
export function HeroCanvas() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        el.style.transform = `translate3d(${clientX - 300}px, ${clientY - 300}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Animated gradient blobs */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="animate-gradient-drift absolute -top-32 left-1/4 size-[600px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.35)_0%,transparent_60%)] blur-3xl"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="animate-gradient-drift absolute right-[10%] top-40 size-[500px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.28)_0%,transparent_60%)] blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.4 }}
        className="animate-gradient-drift absolute bottom-0 left-[15%] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.22)_0%,transparent_60%)] blur-3xl"
        style={{ animationDelay: "-12s" }}
      />

      {/* Grid overlay */}
      <div className="mesh-grid absolute inset-0 opacity-60" />

      {/* Cursor-following spotlight (hidden on touch) */}
      <div
        ref={glowRef}
        aria-hidden
        className="absolute hidden size-[600px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.18)_0%,transparent_55%)] blur-2xl will-change-transform md:block"
      />
    </div>
  );
}
