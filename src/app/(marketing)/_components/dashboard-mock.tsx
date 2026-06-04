"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock4,
  LayoutGrid,
  Menu,
  TrendingUp,
  Users,
} from "lucide-react";
import { LogoMark } from "@/components/shared/logo-mark";

/**
 * Mock visual del dashboard dentro de un set de dispositivos: una pantalla
 * tipo MacBook (plana, con base/bisagra) y un iPhone asomando a la izquierda.
 * El bento mantiene la animación de tiles con stagger + sparkline y respeta
 * prefers-reduced-motion. El teléfono se oculta en mobile (es decorativo).
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
    <div
      ref={root}
      className="relative mx-auto w-full max-w-[1100px] lg:pl-28 xl:pl-36"
    >
      {/* ---------------------------- MacBook ---------------------------- */}
      <div className="relative mx-auto">
        {/* Pantalla con bisel. */}
        <div className="rounded-[16px] bg-gradient-to-b from-[#26262e] to-[#141419] p-1.5 shadow-2xl ring-1 ring-black/50 sm:rounded-[22px] sm:p-2.5">
          {/* Cámara. */}
          <div className="mx-auto mb-1 hidden size-1 rounded-full bg-white/20 sm:block" />
          {/* Screen interna = navegador fake + bento. */}
          <div className="overflow-hidden rounded-[9px] border border-border bg-surface sm:rounded-[13px]">
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
            <div className="grid gap-3 p-3 sm:p-5 md:grid-cols-6 md:grid-rows-2">
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
                <p className="text-[10px] text-muted-foreground">
                  vs mes anterior
                </p>
                <svg
                  className="mt-2 h-9 w-full"
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

              {/* Próximos turnos — lo que protagoniza el dashboard real. */}
              <article
                data-tile
                className="rounded-xl border border-border bg-background p-5 md:col-span-4"
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Próximos turnos
                  </p>
                  <span className="text-[10px] text-subtle">
                    7 días por delante
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { dia: "Hoy", hora: "15:30", c: "Camila Rojas", s: "Corte y color · 60 min", e: "pago" },
                    { dia: "Mañana", hora: "10:00", c: "Pedro García", s: "Corte · 30 min", e: "ok" },
                    { dia: "Mañana", hora: "11:30", c: "Sofía Aguirre", s: "Color · 90 min", e: "pendiente" },
                  ].slice(0, 2).map((t) => (
                    <div
                      key={t.hora}
                      className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface px-3 py-2"
                    >
                      <span className="flex w-16 shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock4 className="size-3" strokeWidth={1.5} />
                        {t.dia}
                      </span>
                      <span className="w-10 shrink-0 text-[11px] text-subtle">
                        {t.hora}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{t.c}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {t.s}
                        </p>
                      </div>
                      <MockEstado estado={t.e} />
                    </div>
                  ))}
                </div>
              </article>

              {/* Calendario semanal — réplica del WeekCalendar real. */}
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
                <p className="mt-3 text-[10px] text-muted-foreground">
                  12 turnos · 3 esperan confirmación
                </p>
              </article>
            </div>
          </div>
        </div>

        {/* Base / bisagra del MacBook. */}
        <div className="relative -ml-[1.5%] h-2.5 w-[103%] rounded-b-lg bg-gradient-to-b from-[#2a2a32] to-[#0f0f14] shadow-lg sm:h-3.5 sm:rounded-b-xl">
          <div className="absolute left-1/2 top-0 h-1 w-20 -translate-x-1/2 rounded-b-md bg-black/50 sm:w-28" />
        </div>
      </div>

      {/* ----------------------------- iPhone ---------------------------- */}
      <div className="absolute -bottom-4 left-0 z-20 hidden w-[168px] origin-bottom-left -rotate-2 lg:block">
        <PhoneMock />
      </div>
    </div>
  );
}

function PhoneMock() {
  const turnos = [
    { hora: "15:30", c: "Camila Rojas", e: "pago" },
    { hora: "16:00", c: "Pedro García", e: "ok" },
    { hora: "17:30", c: "Sofía Aguirre", e: "pendiente" },
  ];
  return (
    <div className="rounded-[2rem] bg-gradient-to-b from-[#26262e] to-[#141419] p-1.5 shadow-2xl ring-1 ring-black/50">
      <div className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-[1.7rem] bg-surface">
        {/* Dynamic island. */}
        <div className="absolute left-1/2 top-2 z-10 h-4 w-14 -translate-x-1/2 rounded-full bg-black" />

        {/* Status bar. */}
        <div className="flex items-center justify-between px-4 pb-1 pt-2.5 text-[8px] text-muted-foreground">
          <span>14:06</span>
          <span className="text-success">●</span>
        </div>

        {/* App header. */}
        <div className="flex items-center gap-1.5 px-3 pt-1">
          <LogoMark className="size-4" />
          <span className="text-[10px] font-semibold">Hola, Mara</span>
          <span className="ml-auto inline-flex size-4 items-center justify-center rounded-full bg-surface-elevated text-[7px] font-medium">
            M
          </span>
        </div>

        {/* Lista de turnos. */}
        <p className="mt-3 px-3 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
          Hoy
        </p>
        <div className="mt-1.5 flex flex-col gap-1.5 px-3">
          {turnos.map((t) => (
            <div
              key={t.hora}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
            >
              <span className="text-[8px] tabular-nums text-subtle">
                {t.hora}
              </span>
              <span className="truncate text-[9px] font-medium">{t.c}</span>
              <span
                className={`ml-auto size-1.5 shrink-0 rounded-full ${
                  t.e === "pago"
                    ? "bg-success"
                    : t.e === "pendiente"
                      ? "bg-warning"
                      : "bg-border-strong"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Nav inferior. */}
        <div className="mt-auto flex items-center justify-around border-t border-border bg-surface-elevated/60 px-2 py-2">
          {[
            { icon: LayoutGrid, active: true },
            { icon: CalendarDays, active: false },
            { icon: BarChart3, active: false },
            { icon: Users, active: false },
            { icon: Menu, active: false },
          ].map(({ icon: Icon, active }, i) => (
            <Icon
              key={i}
              className={active ? "size-3 text-secondary" : "size-3 text-subtle"}
              strokeWidth={1.75}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MockEstado({ estado }: { estado: string }) {
  if (estado === "pago") {
    return (
      <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] text-success">
        Pagado
      </span>
    );
  }
  if (estado === "pendiente") {
    return (
      <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
        Pendiente
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
      Confirmado
    </span>
  );
}
