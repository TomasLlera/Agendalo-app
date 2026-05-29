"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import {
  CalendarDays,
  CheckCircle2,
  Clock4,
  TrendingUp,
} from "lucide-react";

/**
 * Mock visual del dashboard, layout estilo "bento" — densidad alta de info
 * en tarjetas de distinto tamaño, sparkline SVG, indicador "live" pulsante.
 * Anima en mount con stagger respetando prefers-reduced-motion.
 */
export function DashboardMock() {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = Array.from(
      el.querySelectorAll<HTMLElement>("[data-tile]"),
    );
    if (targets.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      for (const t of targets) {
        t.style.opacity = "1";
        t.style.transform = "none";
      }
      return;
    }

    for (const t of targets) {
      t.style.opacity = "0";
      t.style.transform = "translateY(12px) scale(0.985)";
      t.style.willChange = "transform, opacity";
    }
    animate(targets, {
      opacity: [0, 1],
      translateY: [12, 0],
      scale: [0.985, 1],
      duration: 700,
      delay: stagger(70, { start: 120 }),
      ease: "outExpo",
    });

    // Sparkline draw-on-mount.
    const path = el.querySelector<SVGPathElement>("[data-sparkline]");
    if (path) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      animate(path, {
        strokeDashoffset: [length, 0],
        duration: 1400,
        delay: 350,
        ease: "outExpo",
      });
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div
        ref={root}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Chrome de navegador fake. */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
          </div>
          <span className="ml-2 text-xs text-subtle">
            agendalo.app/dashboard
          </span>
          <span
            data-tile
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-success/70" />
              <span className="relative size-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>

        {/* Bento grid. */}
        <div className="grid gap-3 p-4 sm:p-6 md:grid-cols-6 md:grid-rows-2">
          {/* Próximo turno — ancho doble. */}
          <article
            data-tile
            className="rounded-xl border border-border bg-background p-5 md:col-span-3 md:row-span-1"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Próximo turno
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock4 className="size-3" strokeWidth={1.5} />
                en 2 h
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold">Camila Rojas</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Corte y color · 60 min · Hoy 15:30
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] text-success">
                <CheckCircle2 className="size-3" strokeWidth={1.75} />
                Pagado
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                Recordatorio enviado
              </span>
            </div>
          </article>

          {/* Ingresos del mes — con sparkline. */}
          <article
            data-tile
            className="flex flex-col rounded-xl border border-border bg-background p-5 md:col-span-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ingresos del mes
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-success">
                <TrendingUp className="size-3" strokeWidth={1.75} />
                +24,6%
              </span>
            </div>
            <p className="mt-3 text-xl font-semibold">$ 184.500</p>
            <p className="text-[10px] text-muted-foreground">vs mes anterior</p>
            <svg
              className="mt-3 h-10 w-full"
              viewBox="0 0 200 40"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,30 L20,26 L40,28 L60,20 L80,22 L100,16 L120,18 L140,10 L160,14 L180,6 L200,8 L200,40 L0,40 Z"
                fill="url(#spark-grad)"
              />
              <path
                data-sparkline
                d="M0,30 L20,26 L40,28 L60,20 L80,22 L100,16 L120,18 L140,10 L160,14 L180,6 L200,8"
                stroke="#10B981"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </article>

          {/* Reservas semana. */}
          <article
            data-tile
            className="rounded-xl border border-border bg-background p-5 md:col-span-2"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Esta semana
            </p>
            <p className="mt-3 text-xl font-semibold">12 turnos</p>
            <p className="text-[10px] text-muted-foreground">
              3 esperan confirmación
            </p>
          </article>

          {/* No-shows. */}
          <article
            data-tile
            className="rounded-xl border border-border bg-background p-5 md:col-span-2"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              No-shows
            </p>
            <p className="mt-3 text-xl font-semibold">−32%</p>
            <p className="text-[10px] text-muted-foreground">
              con recordatorios WhatsApp
            </p>
          </article>

          {/* Mini agenda semanal. */}
          <article
            data-tile
            className="rounded-xl border border-border bg-background p-5 md:col-span-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Semana
              </p>
              <CalendarDays
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.5}
              />
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {[1, 4, 0, 3, 2, 0, 2].map((n, i) => {
                const max = 4;
                const intensity = n === 0 ? 0 : n / max;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1"
                    title={`${n} turnos`}
                  >
                    <span className="text-[9px] text-muted-foreground">
                      {["L", "M", "M", "J", "V", "S", "D"][i]}
                    </span>
                    <span
                      className="block h-6 w-full rounded-sm"
                      style={{
                        background:
                          intensity === 0
                            ? "var(--color-surface-elevated)"
                            : `rgba(16, 185, 129, ${0.18 + intensity * 0.6})`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
