"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Selector dentro del wrapper a animar. Default: `[data-reveal]`. */
  selector?: string;
  /** Delay base en ms antes de arrancar. */
  delay?: number;
  /** Distancia inicial del translateY en px. */
  offset?: number;
  /** Duración de cada item en ms. */
  duration?: number;
  /** Stagger entre items en ms. */
  stagger?: number;
  /** Animar al montar (true) o al entrar en viewport (false). */
  immediate?: boolean;
};

/**
 * Anima los hijos marcados con `data-reveal` (o el selector custom) con un
 * fade + translateY al montar o cuando entran al viewport. Respeta
 * `prefers-reduced-motion`: si el usuario lo prefiere, los hijos quedan
 * visibles sin animación.
 */
export function MotionReveal({
  children,
  className,
  selector = "[data-reveal]",
  delay = 0,
  offset = 16,
  duration = 600,
  stagger: staggerMs = 60,
  immediate = true,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(selector),
    );
    if (targets.length === 0) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      for (const el of targets) {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
      return;
    }

    // Estado inicial antes de animar (evita FOUC).
    for (const el of targets) {
      el.style.opacity = "0";
      el.style.transform = `translateY(${offset}px)`;
      el.style.willChange = "transform, opacity";
    }

    const run = () => {
      animate(targets, {
        opacity: [0, 1],
        translateY: [offset, 0],
        duration,
        delay: stagger(staggerMs, { start: delay }),
        ease: "outExpo",
      });
    };

    if (immediate) {
      run();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [selector, delay, offset, duration, staggerMs, immediate]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
