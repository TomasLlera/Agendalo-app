"use client";

import { useEffect, useState } from "react";
import { Brain, Dumbbell, PenTool, Plus, Scissors } from "lucide-react";

type Profesion = {
  gradient: string;
  nombre: string;
  /** Ícono del rubro que va dentro del círculo. */
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Label que aparece al lado al hacer hover/focus en este avatar. */
  label: string;
  /** Color del label, a juego con el ícono. Legible en claro y oscuro. */
  texto: string;
};

const PROFESIONES: Profesion[] = [
  {
    gradient: "from-rose-400 to-rose-700",
    nombre: "Peluquería",
    icon: Scissors,
    label: "Peluqueros & Barberos",
    texto: "text-rose-600 dark:text-rose-400",
  },
  {
    gradient: "from-emerald-400 to-emerald-700",
    nombre: "Kinesiología",
    icon: Dumbbell,
    label: "Kinesiólogos & Fisio",
    texto: "text-emerald-600 dark:text-emerald-400",
  },
  {
    gradient: "from-amber-400 to-amber-700",
    nombre: "Tatuajes",
    icon: PenTool,
    label: "Tatuadores",
    texto: "text-amber-600 dark:text-amber-400",
  },
  {
    gradient: "from-sky-400 to-sky-700",
    nombre: "Psicología",
    icon: Brain,
    label: "Psicólogos & Psiquiatras",
    texto: "text-sky-600 dark:text-sky-400",
  },
  {
    gradient: "from-violet-400 to-violet-700",
    nombre: "Educación",
    icon: Plus,
    label: "Y muchos más",
    texto: "text-violet-600 dark:text-violet-400",
  },
];

const DEFAULT_LABEL = "La agenda de los profesionales independientes";

/**
 * Pill de social proof con avatares interactivos. Cada color representa una
 * profesión: al hover/focus en un avatar, los otros se opacan y el label
 * cambia al rubro correspondiente. Accesible vía teclado (botones con
 * aria-label).
 */
export function SocialProofPill() {
  const [active, setActive] = useState<number | null>(null);
  // Mientras el usuario interactúa (hover/focus) pausamos la auto-rotación
  // para no pelear con su intención.
  const [paused, setPaused] = useState(false);

  // Auto-rotación: cada ~5s resalta el siguiente avatar y, tras recorrer
  // todos, vuelve al label por defecto antes de reiniciar el ciclo.
  useEffect(() => {
    if (paused) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setActive((prev) => {
        if (prev === null) return 0;
        if (prev >= PROFESIONES.length - 1) return null;
        return prev + 1;
      });
    }, 5000);

    return () => window.clearInterval(id);
  }, [paused]);

  const esDefault = active === null;
  const label = esDefault ? DEFAULT_LABEL : PROFESIONES[active].label;

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-surface/60 px-4 py-2 backdrop-blur">
      <div
        className="flex -space-x-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          setActive(null);
        }}
      >
        {PROFESIONES.map((p, i) => {
          const isActive = active === i;
          const isDimmed = active !== null && !isActive;
          const Icon = p.icon;
          return (
            <button
              key={p.nombre}
              type="button"
              aria-label={p.label}
              onMouseEnter={() => setActive(i)}
              onFocus={() => {
                setPaused(true);
                setActive(i);
              }}
              onBlur={() => {
                setPaused(false);
                setActive(null);
              }}
              className={`relative inline-flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-surface bg-gradient-to-br transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 ${
                p.gradient
              } ${
                isActive ? "z-10 scale-125 shadow-lg" : ""
              } ${isDimmed ? "scale-90 opacity-40" : ""}`}
            >
              <Icon className="size-3.5 text-white" strokeWidth={2} />
            </button>
          );
        })}
      </div>
      <span
        // `min-w` evita que el texto al cambiar de largo desplace la layout
        // de la pill (jitter horizontal). Los rubros van en mayúsculas tipo
        // "eyebrow"; el label por defecto (una frase) queda en caja normal.
        className={`min-w-[210px] text-center text-xs transition-colors duration-200 sm:min-w-[230px] ${
          esDefault
            ? "text-muted-foreground"
            : `font-medium uppercase tracking-wide ${PROFESIONES[active].texto}`
        }`}
      >
        {label}
      </span>
    </div>
  );
}
