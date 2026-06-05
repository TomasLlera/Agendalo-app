"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock4,
  LayoutGrid,
  Menu,
  Scissors,
  TrendingUp,
  Users,
} from "lucide-react";
import { LogoMark } from "@/components/shared/logo-mark";
import { cn } from "@/lib/utils";

/**
 * Mock visual del producto dentro de un set de dispositivos: una tablet en
 * landscape (estilo iPad) y un teléfono (estilo iPhone) asomando en la
 * esquina. Cada dispositivo cicla automáticamente entre varias pantallas con
 * un fade-up (animejs), desfasados entre sí. Respeta prefers-reduced-motion
 * (queda estático en la primera pantalla) y el teléfono se oculta en mobile.
 */
export function DashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-[1000px] lg:pr-24">
      <Tablet />

      {/* Phone asomando en la esquina inferior derecha. Decorativo: oculto en
          mobile para no competir con el contenido. */}
      <div className="absolute -bottom-4 right-0 z-20 hidden w-[180px] rotate-2 lg:block">
        <Phone />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hook de ciclado                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Avanza un índice cada `interval` ms y, en cada cambio, anima el contenido
 * referenciado con un fade-up. Devuelve el índice activo y el `ref` que hay
 * que colgar del contenedor del screen. Con reduced-motion no cicla ni anima.
 */
function useCycle(length: number, interval: number) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      length <= 1
    ) {
      return;
    }
    const id = setInterval(
      () => setIdx((i) => (i + 1) % length),
      interval,
    );
    return () => clearInterval(id);
  }, [length, interval]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(el, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 480,
      ease: "outExpo",
    });
  }, [idx]);

  return { idx, ref };
}

/** Dots indicadores: el activo se expande como pill. */
function Dots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === active ? "w-5 bg-secondary" : "w-1.5 bg-border-strong",
          )}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tablet                                                                     */
/* -------------------------------------------------------------------------- */

const TABLET_SCREENS = [
  { url: "agendalo.app/dashboard", Screen: TabletDashboard },
  { url: "agendalo.app/agenda", Screen: TabletAgenda },
  { url: "agendalo.app/estadisticas", Screen: TabletStats },
] as const;

function Tablet() {
  const { idx, ref } = useCycle(TABLET_SCREENS.length, 4000);
  const { url, Screen } = TABLET_SCREENS[idx];

  return (
    <div className="relative">
      {/* Botón lateral físico decorativo. */}
      <div className="absolute -right-1 top-20 h-12 w-1 rounded-r-sm bg-gradient-to-b from-[#2a2a32] to-[#0f0f14]" />

      {/* Marco de la tablet. */}
      <div className="rounded-[26px] bg-gradient-to-b from-[#26262e] to-[#141419] p-2.5 shadow-2xl ring-1 ring-black/50">
        <div className="flex aspect-[16/10] flex-col overflow-hidden rounded-[18px] border border-border bg-surface">
          {/* Barra superior. */}
          <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
            </div>
            <span className="ml-2 text-xs text-subtle">{url}</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-success/70" />
                <span className="relative size-1.5 rounded-full bg-success" />
              </span>
              Live
            </span>
          </div>

          {/* Screen activo. */}
          <div ref={ref} className="min-h-0 flex-1 overflow-hidden p-4">
            <Screen />
          </div>

          {/* Dots al pie. */}
          <div className="py-3">
            <Dots count={TABLET_SCREENS.length} active={idx} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabletDashboard() {
  return (
    <div className="grid h-full grid-cols-6 grid-rows-2 gap-3">
      {/* Próximo turno. */}
      <article className="col-span-3 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Próximo turno
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2 py-0.5 text-[9px] text-muted-foreground">
            <Clock4 className="size-3" strokeWidth={1.5} />
            en 2 h
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold">Camila Rojas</p>
        <p className="text-[10px] text-muted-foreground">
          Corte y color · 60 min · Hoy 15:30
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] text-success">
            <CheckCircle2 className="size-3" strokeWidth={1.75} />
            Pagado
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">
            Recordatorio enviado
          </span>
        </div>
      </article>

      {/* Ingresos del mes con sparkline. */}
      <article className="col-span-3 flex flex-col rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Ingresos del mes
          </p>
          <span className="inline-flex items-center gap-1 text-[9px] text-success">
            <TrendingUp className="size-3" strokeWidth={1.75} />
            +24,6%
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold">$ 184.500</p>
        <p className="text-[9px] text-muted-foreground">vs mes anterior</p>
        <svg
          className="mt-auto h-8 w-full"
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
            d="M0,30 L20,26 L40,28 L60,20 L80,22 L100,16 L120,18 L140,10 L160,14 L180,6 L200,8"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </article>

      {/* Próximos turnos. */}
      <article className="col-span-4 rounded-xl border border-border bg-background p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Próximos turnos
          </p>
          <span className="text-[9px] text-subtle">7 días por delante</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {[
            { dia: "Hoy", hora: "15:30", c: "Camila Rojas", s: "Corte y color · 60 min", e: "pago" },
            { dia: "Mañana", hora: "10:00", c: "Pedro García", s: "Corte · 30 min", e: "ok" },
          ].map((t) => (
            <div
              key={t.hora}
              className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface px-2.5 py-1.5"
            >
              <span className="flex w-12 shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                {t.dia}
              </span>
              <span className="w-9 shrink-0 text-[10px] text-subtle">
                {t.hora}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium">{t.c}</p>
                <p className="truncate text-[9px] text-muted-foreground">
                  {t.s}
                </p>
              </div>
              <MockEstado estado={t.e} />
            </div>
          ))}
        </div>
      </article>

      {/* Semana. */}
      <article className="col-span-2 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Semana
          </p>
          <CalendarDays
            className="size-3.5 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {[1, 4, 0, 3, 2, 0, 2].map((n, i) => {
            const intensity = n === 0 ? 0 : n / 4;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[8px] text-muted-foreground">
                  {["L", "M", "M", "J", "V", "S", "D"][i]}
                </span>
                <span
                  className="block h-5 w-full rounded-sm"
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
        <p className="mt-2 text-[9px] text-muted-foreground">
          12 turnos · 3 esperan confirmación
        </p>
      </article>
    </div>
  );
}

function TabletAgenda() {
  const turnos = [
    { hora: "09:00", c: "Lucía Fernández", s: "Corte · 30 min", e: "ok" },
    { hora: "10:30", c: "Martín Sosa", s: "Barba · 20 min", e: "pago" },
    { hora: "12:00", c: "Valentina Díaz", s: "Color · 90 min", e: "pendiente" },
    { hora: "15:30", c: "Camila Rojas", s: "Corte y color · 60 min", e: "pago" },
    { hora: "17:00", c: "Pedro García", s: "Corte · 30 min", e: "ok" },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Agenda de hoy</h3>
        <span className="text-[10px] text-muted-foreground">
          Martes 4 de junio · 5 turnos
        </span>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1.5">
        {turnos.map((t) => (
          <div
            key={t.hora}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="w-10 shrink-0 text-xs font-medium tabular-nums">
              {t.hora}
            </span>
            <span className="h-7 w-px shrink-0 bg-border" />
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
    </div>
  );
}

function TabletStats() {
  const barras = [40, 65, 50, 80, 55, 90, 70, 100, 60, 85, 75, 95];
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 gap-3">
        {[
          { t: "Ingresos del mes", v: "$ 184.500", d: "+24,6%" },
          { t: "Turnos del mes", v: "76", d: "+12,0%" },
          { t: "Ticket promedio", v: "$ 2.428", d: null },
        ].map((k) => (
          <div
            key={k.t}
            className="rounded-xl border border-border bg-background p-3"
          >
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
              {k.t}
            </p>
            <p className="mt-1 text-base font-semibold">{k.v}</p>
            {k.d ? (
              <p className="mt-0.5 flex items-center gap-1 text-[9px] text-success">
                <TrendingUp className="size-3" strokeWidth={1.75} />
                {k.d}
              </p>
            ) : (
              <p className="mt-0.5 text-[9px] text-subtle">vs mes anterior</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-background p-4">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Ingresos por mes
        </p>
        <div className="mt-auto flex h-full items-end gap-1.5 pt-3">
          {barras.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-secondary/60"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Phone                                                                      */
/* -------------------------------------------------------------------------- */

const PHONE_SCREENS = [PhoneToday, PhoneDetalle, PhonePerfil] as const;

function Phone() {
  const { idx, ref } = useCycle(PHONE_SCREENS.length, 3200);
  const Screen = PHONE_SCREENS[idx];

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

        {/* Header con logo. */}
        <div className="flex items-center gap-1.5 px-3 pt-1">
          <LogoMark className="size-4" />
          <span className="text-[10px] font-semibold">Agendalo</span>
          <span className="ml-auto inline-flex size-4 items-center justify-center rounded-full bg-surface-elevated text-[7px] font-medium">
            M
          </span>
        </div>

        {/* Screen activo. */}
        <div ref={ref} className="min-h-0 flex-1 overflow-hidden px-3 pt-2">
          <Screen />
        </div>

        {/* Dots antes del nav. */}
        <div className="py-2">
          <Dots count={PHONE_SCREENS.length} active={idx} />
        </div>

        {/* Nav inferior. */}
        <div className="flex items-center justify-around border-t border-border bg-surface-elevated/60 px-2 py-2">
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

function PhoneToday() {
  const turnos = [
    { hora: "15:30", c: "Camila Rojas", e: "pago" },
    { hora: "16:00", c: "Pedro García", e: "ok" },
    { hora: "17:30", c: "Sofía Aguirre", e: "pendiente" },
  ];
  return (
    <>
      <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        Hoy
      </p>
      <div className="mt-1.5 flex flex-col gap-1.5">
        {turnos.map((t) => (
          <div
            key={t.hora}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
          >
            <span className="text-[8px] tabular-nums text-subtle">{t.hora}</span>
            <span className="truncate text-[9px] font-medium">{t.c}</span>
            <span
              className={cn(
                "ml-auto size-1.5 shrink-0 rounded-full",
                t.e === "pago"
                  ? "bg-success"
                  : t.e === "pendiente"
                    ? "bg-warning"
                    : "bg-border-strong",
              )}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function PhoneDetalle() {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-9 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
        <CheckCircle2 className="size-5" strokeWidth={1.75} />
      </span>
      <p className="mt-2 text-[10px] font-semibold">Reserva confirmada</p>
      <p className="text-[8px] text-muted-foreground">
        Te avisamos a Camila por WhatsApp
      </p>
      <div className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-left">
        <p className="text-[9px] font-medium">Corte y color</p>
        <p className="mt-0.5 text-[8px] text-muted-foreground">
          Hoy · 15:30–16:30 h
        </p>
        <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
          <span className="text-[8px] text-muted-foreground">Total</span>
          <span className="text-[9px] font-semibold">$ 12.000</span>
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 text-[7px] text-success">
          <CheckCircle2 className="size-2.5" strokeWidth={1.75} />
          Pagado con Mercado Pago
        </span>
      </div>
    </div>
  );
}

function PhonePerfil() {
  const servicios = [
    { n: "Corte", d: "30 min", p: "$ 6.000" },
    { n: "Color", d: "90 min", p: "$ 14.000" },
    { n: "Barba", d: "20 min", p: "$ 4.000" },
  ];
  return (
    <div className="flex flex-col items-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-gradient-brand text-white">
        <Scissors className="size-4" strokeWidth={1.75} />
      </span>
      <p className="mt-1.5 text-[10px] font-semibold">Estudio Reborn</p>
      <p className="text-[8px] text-muted-foreground">Reservá tu turno online</p>
      <div className="mt-2 flex w-full flex-col gap-1.5">
        {servicios.map((s) => (
          <div
            key={s.n}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-medium">{s.n}</p>
              <p className="text-[8px] text-muted-foreground">{s.d}</p>
            </div>
            <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[8px] font-semibold text-secondary">
              {s.p}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockEstado({ estado }: { estado: string }) {
  if (estado === "pago") {
    return (
      <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] text-success">
        Pagado
      </span>
    );
  }
  if (estado === "pendiente") {
    return (
      <span className="shrink-0 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[9px] text-warning">
        Pendiente
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[9px] text-muted-foreground">
      Confirmado
    </span>
  );
}
