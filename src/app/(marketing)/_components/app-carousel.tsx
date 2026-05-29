"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  LayoutDashboard,
  User2,
} from "lucide-react";

type Mock = {
  id: string;
  titulo: string;
  bajada: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  render: React.ReactNode;
};

const MOCKS: Mock[] = [
  {
    id: "dashboard",
    titulo: "Dashboard",
    bajada: "Visualizá tus métricas y agenda al instante.",
    icon: LayoutDashboard,
    render: <MockDashboard />,
  },
  {
    id: "agenda",
    titulo: "Agenda del día",
    bajada: "Filtrá, organizá y gestioná cada turno en segundos.",
    icon: CalendarDays,
    render: <MockAgenda />,
  },
  {
    id: "publica",
    titulo: "Tu página pública",
    bajada: "Tu link de reservas, listo para compartir.",
    icon: Globe,
    render: <MockPublica />,
  },
  {
    id: "perfil",
    titulo: "Perfil y servicios",
    bajada: "Personalizá tu perfil, tu link y tus servicios.",
    icon: User2,
    render: <MockPerfil />,
  },
  {
    id: "pagos",
    titulo: "Cobros con Mercado Pago",
    bajada: "Conectá tu cuenta y empezá a cobrar al instante.",
    icon: CreditCard,
    render: <MockPagos />,
  },
];

export function AppCarousel() {
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  const goTo = useCallback((i: number) => {
    setIndex(((i % MOCKS.length) + MOCKS.length) % MOCKS.length);
  }, []);
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  // Autoplay con pausa al hover.
  useEffect(() => {
    if (pausedRef.current) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current) {
        setIndex((i) => (i + 1) % MOCKS.length);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Animar el slide actual al cambiar.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const active = stage.querySelector<HTMLElement>("[data-active='true']");
    if (!active) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      active.style.opacity = "1";
      active.style.transform = "none";
      return;
    }
    animate(active, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 500,
      ease: "outExpo",
    });
  }, [index]);

  return (
    <div
      className="mx-auto w-full max-w-[1100px]"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Chrome con nombre del slide. */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
          </div>
          <span className="ml-2 text-xs text-subtle">
            agendalo.app/{MOCKS[index].id}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {(() => {
              const Icon = MOCKS[index].icon;
              return <Icon className="size-3" strokeWidth={1.75} />;
            })()}
            {MOCKS[index].titulo}
          </span>
        </div>

        {/* Stage — sólo se monta el slide activo. */}
        <div className="relative min-h-[420px] p-4 sm:p-6">
          {MOCKS.map((m, i) => (
            <div
              key={m.id}
              data-active={i === index}
              className={i === index ? "block" : "hidden"}
            >
              {m.render}
            </div>
          ))}
        </div>

        {/* Controles. */}
        <button
          type="button"
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface/80 backdrop-blur transition-colors hover:bg-surface-elevated"
        >
          <ChevronLeft className="size-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface/80 backdrop-blur transition-colors hover:bg-surface-elevated"
        >
          <ChevronRight className="size-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Indicators + caption. */}
      <div className="mt-5 flex flex-col items-center gap-3">
        <p className="text-center text-sm text-muted-foreground">
          {MOCKS[index].bajada}
        </p>
        <div className="flex items-center gap-2">
          {MOCKS.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver ${m.titulo}`}
              aria-current={i === index ? "true" : undefined}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-foreground"
                  : "w-2 bg-border-strong hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Mocks --------------------------------- */

function MockDashboard() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-background p-5 md:col-span-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Próximo turno
        </p>
        <p className="mt-3 text-xl font-semibold">Lucía Méndez</p>
        <p className="text-xs text-muted-foreground">
          Masaje descontracturante · 50 min · Hoy 17:00
        </p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] text-success">
            Pagado
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
            Recordatorio enviado
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Ingresos
        </p>
        <p className="mt-3 text-xl font-semibold">$ 184.500</p>
        <p className="text-[10px] text-success">+24,6% mes anterior</p>
      </div>
      <div className="rounded-xl border border-border bg-background p-5 md:col-span-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Semana
        </p>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {[1, 4, 0, 3, 2, 0, 2].map((n, i) => (
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
                    n === 0
                      ? "var(--color-surface-elevated)"
                      : `rgba(16, 185, 129, ${0.18 + (n / 4) * 0.6})`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockAgenda() {
  const items = [
    { hora: "09:00", cliente: "Pedro García", svc: "Corte", estado: "ok" },
    {
      hora: "10:30",
      cliente: "Sofía Aguirre",
      svc: "Color · 90 min",
      estado: "pago",
    },
    { hora: "12:00", cliente: "Tomás Ríos", svc: "Corte + barba", estado: "ok" },
    {
      hora: "15:00",
      cliente: "Camila Rojas",
      svc: "Color · 60 min",
      estado: "pendiente",
    },
    { hora: "16:30", cliente: "Mariano D.", svc: "Brushing", estado: "ok" },
  ];
  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium text-background">
          Hoy · Lun 26 May
        </span>
        <span className="text-xs text-muted-foreground">5 turnos</span>
        <span className="ml-auto rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
          Todos los servicios ▾
        </span>
      </div>
      {items.map((t) => (
        <div
          key={t.hora}
          className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
        >
          <div className="flex w-14 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" strokeWidth={1.75} />
            {t.hora}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{t.cliente}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {t.svc}
            </p>
          </div>
          <EstadoPill estado={t.estado} />
        </div>
      ))}
    </div>
  );
}

function EstadoPill({ estado }: { estado: string }) {
  if (estado === "pago") {
    return (
      <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] text-success">
        Pagado
      </span>
    );
  }
  if (estado === "pendiente") {
    return (
      <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
        Pendiente pago
      </span>
    );
  }
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
      Confirmado
    </span>
  );
}

function MockPublica() {
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="inline-flex size-20 items-center justify-center rounded-full bg-surface-elevated text-2xl font-semibold">
          M
        </span>
        <p className="text-sm font-medium">Estudio Mara</p>
        <p className="text-[10px] text-muted-foreground">
          agendalo.app/p/mara
        </p>
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Elegí un servicio
        </p>
        {[
          { n: "Corte", d: "30 min", p: "$ 8.000" },
          { n: "Color completo", d: "90 min", p: "$ 22.000" },
          { n: "Brushing", d: "45 min", p: "$ 6.500" },
        ].map((s) => (
          <div
            key={s.n}
            className="flex items-center justify-between rounded-xl border border-border bg-background p-4"
          >
            <div>
              <p className="text-sm font-medium">{s.n}</p>
              <p className="text-[11px] text-muted-foreground">{s.d}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">{s.p}</span>
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium text-background">
                Elegir →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPerfil() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-background p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Tu perfil
        </p>
        <div className="mt-3 space-y-3 text-sm">
          <Field label="Nombre" value="Mara López" />
          <Field label="Slug" value="agendalo.app/p/mara" />
          <Field label="Zona horaria" value="Argentina / Buenos Aires" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Servicios
          </p>
          <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
            + Nuevo
          </span>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {["Corte · 30 min", "Color · 90 min", "Brushing · 45 min"].map(
            (s) => (
              <div
                key={s}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="text-xs">{s}</span>
                <span className="text-[10px] text-muted-foreground">
                  Activo
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs">
        {value}
      </span>
    </div>
  );
}

function MockPagos() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[#00B1EA]/15">
            <CreditCard className="size-4 text-[#00B1EA]" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-medium">Mercado Pago</p>
            <p className="text-[11px] text-muted-foreground">
              Cuenta conectada
            </p>
          </div>
          <span className="ml-auto rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] text-success">
            Activo
          </span>
        </div>
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <p>· La plata cae directo en tu cuenta de MP.</p>
          <p>· Agendalo no toca tu dinero.</p>
          <p>· Pedí seña o cobrá el 100% por servicio.</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Últimos cobros
        </p>
        <div className="mt-3 space-y-2 text-sm">
          {[
            { c: "Lucía Méndez", m: "$ 12.000", d: "Hoy" },
            { c: "Pedro García", m: "$ 8.000", d: "Ayer" },
            { c: "Sofía Aguirre", m: "$ 22.000", d: "Hace 2d" },
          ].map((p) => (
            <div
              key={p.c}
              className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-xs font-medium">{p.c}</p>
                <p className="text-[10px] text-muted-foreground">{p.d}</p>
              </div>
              <span className="text-xs text-success">{p.m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
