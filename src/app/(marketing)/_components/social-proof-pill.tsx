"use client";

import { useState } from "react";

type Profesion = {
  gradient: string;
  nombre: string;
  /** Label que aparece al lado al hacer hover/focus en este avatar. */
  label: string;
};

const PROFESIONES: Profesion[] = [
  {
    gradient: "from-rose-400 to-rose-700",
    nombre: "Peluquería",
    label: "Peluqueros y Barberos",
  },
  {
    gradient: "from-emerald-400 to-emerald-700",
    nombre: "Kinesiología",
    label: "Kinesiólogos y Fisioterapeutas",
  },
  {
    gradient: "from-amber-400 to-amber-700",
    nombre: "Tatuajes",
    label: "Tatuadores",
  },
  {
    gradient: "from-sky-400 to-sky-700",
    nombre: "Psicología",
    label: "Psiquiatras y Psicologos",
  },
  {
    gradient: "from-violet-400 to-violet-700",
    nombre: "Educación",
    label: "Y muchos profesionales más..",
  },
];

const DEFAULT_LABEL = "Profesionales independientes en toda LATAM";

/**
 * Pill de social proof con avatares interactivos. Cada color representa una
 * profesión: al hover/focus en un avatar, los otros se opacan y el label
 * cambia al rubro correspondiente. Accesible vía teclado (botones con
 * aria-label).
 */
export function SocialProofPill() {
  const [active, setActive] = useState<number | null>(null);

  const label = active === null ? DEFAULT_LABEL : PROFESIONES[active].label;

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-surface/60 px-4 py-2 backdrop-blur">
      <div
        className="flex -space-x-2"
        onMouseLeave={() => setActive(null)}
      >
        {PROFESIONES.map((p, i) => {
          const isActive = active === i;
          const isDimmed = active !== null && !isActive;
          return (
            <button
              key={p.nombre}
              type="button"
              aria-label={p.label}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={`relative inline-block size-6 cursor-pointer rounded-full border-2 border-surface bg-gradient-to-br transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 ${
                p.gradient
              } ${
                isActive ? "z-10 scale-125 shadow-lg" : ""
              } ${isDimmed ? "scale-90 opacity-40" : ""}`}
            />
          );
        })}
      </div>
      <span
        // `min-w` evita que el texto al cambiar de largo desplace la layout
        // de la pill (jitter horizontal).
        className="min-w-[210px] text-left text-xs text-muted-foreground transition-colors duration-200 sm:min-w-[230px]"
      >
        {label}
      </span>
    </div>
  );
}
