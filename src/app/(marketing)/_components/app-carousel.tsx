"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  BarChart3,
  CalendarDays,
  CalendarX2,
  Clock,
  CreditCard,
  Globe,
  Landmark,
  Phone,
  TrendingUp,
  User2,
  Wallet,
} from "lucide-react";

type Mock = {
  id: string;
  titulo: string;
  /** URL ilustrativa que se muestra en el chrome del navegador. */
  url: string;
  bajada: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  render: React.ReactNode;
};

const MOCKS: Mock[] = [
  {
    id: "agenda",
    titulo: "Agenda",
    url: "agendalo.app/dashboard",
    bajada: "Tus próximos turnos agrupados por día, con su estado de pago.",
    icon: CalendarDays,
    render: <MockAgenda />,
  },
  {
    id: "publica",
    titulo: "Página pública",
    url: "agendalo.app/p/mara",
    bajada: "Tu link de reservas, listo para compartir. Sin que el cliente se registre.",
    icon: Globe,
    render: <MockPublica />,
  },
  {
    id: "estadisticas",
    titulo: "Estadísticas",
    url: "agendalo.app/estadisticas",
    bajada: "Tu panel contable: ingresos por mes, por servicio y por día.",
    icon: BarChart3,
    render: <MockEstadisticas />,
  },
  {
    id: "cobros",
    titulo: "Cobros",
    url: "agendalo.app/configuracion/pagos",
    bajada: "Cobrá con Mercado Pago, transferencia o efectivo. Vos elegís.",
    icon: CreditCard,
    render: <MockPagos />,
  },
  {
    id: "perfil",
    titulo: "Perfil",
    url: "agendalo.app/perfil",
    bajada: "Personalizá tu perfil, tu link y tus servicios.",
    icon: User2,
    render: <MockPerfil />,
  },
  {
    id: "cancelados",
    titulo: "Cancelados",
    url: "agendalo.app/cancelados",
    bajada: "El historial de turnos cancelados, con el contacto a mano.",
    icon: CalendarX2,
    render: <MockCancelados />,
  },
];

export function AppCarousel() {
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  // Autoplay: avanza cada 5s. Se pausa al hover/focus (pausedRef) y se
  // desactiva si el usuario prefiere menos movimiento.
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current) {
        setIndex((i) => (i + 1) % MOCKS.length);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Animar el slide actual al cambiar de tab.
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
      duration: 450,
      ease: "outExpo",
    });
  }, [index]);

  const activo = MOCKS[index];

  return (
    <div
      className="mx-auto w-full max-w-[1100px]"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocusCapture={() => (pausedRef.current = true)}
      onBlurCapture={() => (pausedRef.current = false)}
    >
      {/* Tabs. */}
      <div
        role="tablist"
        aria-label="Pantallas de Agendalo"
        className="-mx-6 mb-4 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
      >
        {MOCKS.map((m, i) => {
          const Icon = m.icon;
          const isActive = i === index;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setIndex(i)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-surface/60 text-muted-foreground hover:border-border-strong hover:text-foreground"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {m.titulo}
            </button>
          );
        })}
      </div>

      {/* Marco de navegador. */}
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
            <span className="size-2.5 rounded-full bg-border-strong" />
          </div>
          <span className="ml-2 truncate text-xs text-subtle">{activo.url}</span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
            <activo.icon className="size-3" strokeWidth={1.75} />
            {activo.titulo}
          </span>
        </div>

        {/* Stage — sólo se monta el slide activo. */}
        <div
          role="tabpanel"
          className="relative min-h-[420px] p-4 sm:p-6"
        >
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
      </div>

      {/* Caption. */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {activo.bajada}
      </p>
    </div>
  );
}

/* ------------------------------- Mocks --------------------------------- */

function MockAgenda() {
  const grupos = [
    {
      dia: "Hoy",
      items: [
        { hora: "09:00", cliente: "Pedro García", svc: "Corte · 30 min", estado: "ok" },
        { hora: "10:30", cliente: "Sofía Aguirre", svc: "Color · 90 min", estado: "pago" },
        { hora: "12:00", cliente: "Tomás Ríos", svc: "Corte + barba · 45 min", estado: "ok" },
      ],
    },
    {
      dia: "Mañana",
      items: [
        { hora: "15:00", cliente: "Camila Rojas", svc: "Color · 60 min", estado: "pendiente" },
        { hora: "16:30", cliente: "Mariano D.", svc: "Brushing · 45 min", estado: "ok" },
      ],
    },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium">Próximos turnos</span>
        <span className="text-[11px] text-muted-foreground">5 turnos</span>
        <span className="ml-auto rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
          Todos los servicios ▾
        </span>
      </div>
      {grupos.map((g) => (
        <div key={g.dia} className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {g.dia}
          </p>
          {g.items.map((t) => (
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
      ))}
    </div>
  );
}

function EstadoPill({ estado }: { estado: string }) {
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
        Pendiente pago
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
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
        <p className="text-[10px] text-muted-foreground">agendalo.app/p/mara</p>
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

function MockEstadisticas() {
  const kpis = [
    { icon: Wallet, t: "Ingresos del mes", v: "$ 248.500", d: "+18,2%", up: true },
    { icon: CalendarDays, t: "Turnos del mes", v: "32", d: "+12,5%", up: true },
    { icon: TrendingUp, t: "Ticket promedio", v: "$ 7.765", d: null, up: true },
  ];
  const barras = [40, 55, 48, 70, 60, 82, 68, 90, 72, 100, 84, 95];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map(({ icon: Icon, t, v, d, up }) => (
          <div key={t} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3" strokeWidth={1.5} />
              {t}
            </div>
            <p className="mt-2 text-lg font-semibold tracking-tight">{v}</p>
            {d ? (
              <p
                className={`mt-1 text-[10px] ${up ? "text-success" : "text-destructive"}`}
              >
                {d} vs mes anterior
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-subtle">Promedio por turno</p>
            )}
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium">Ingresos por mes</p>
          <span className="text-[10px] text-muted-foreground">12 meses</span>
        </div>
        <div className="mt-4 flex h-24 items-end gap-1.5">
          {barras.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-secondary/60"
              style={{ height: `${h}%` }}
              title={`${h}%`}
            />
          ))}
        </div>
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
          {["Corte · 30 min", "Color · 90 min", "Brushing · 45 min"].map((s) => (
            <div
              key={s}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span className="text-xs">{s}</span>
              <span className="text-[10px] text-muted-foreground">Activo</span>
            </div>
          ))}
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
  const metodos = [
    {
      icon: CreditCard,
      color: "#00B1EA",
      nombre: "Mercado Pago",
      detalle: "Cuenta conectada · cae directo en tu cuenta",
      activo: true,
    },
    {
      icon: Landmark,
      color: "#10B981",
      nombre: "Transferencia",
      detalle: "Mostrás tu CBU/Alias al reservar",
      activo: true,
    },
    {
      icon: Wallet,
      color: "#A78BFA",
      nombre: "Efectivo",
      detalle: "El cliente paga en el lugar",
      activo: true,
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-background p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Cómo cobrás
        </p>
        <div className="mt-3 space-y-2">
          {metodos.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.nombre}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
              >
                <span
                  className="inline-flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${m.color}26` }}
                >
                  <Icon className="size-4" strokeWidth={1.5} style={{ color: m.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{m.nombre}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {m.detalle}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] text-success">
                  Activo
                </span>
              </div>
            );
          })}
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

function MockCancelados() {
  const turnos = [
    { fecha: "Vie 23 de may", hora: "11:00", cliente: "Lucía Méndez", svc: "Corte", tel: "+54 11 5555 1234", futuro: false },
    { fecha: "Lun 26 de may", hora: "16:30", cliente: "Tomás Ríos", svc: "Color · 90 min", tel: "+54 11 5555 8090", futuro: false },
    { fecha: "Jue 29 de may", hora: "09:30", cliente: "Sofía Aguirre", svc: "Brushing", tel: "+54 11 5555 4477", futuro: true },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Mayo 2026
      </p>
      <ul className="overflow-hidden rounded-xl border border-border bg-background">
        {turnos.map((t, i) => (
          <li
            key={t.cliente}
            className={`flex items-center gap-4 px-4 py-3 ${i !== 0 ? "border-t border-border" : ""}`}
          >
            <div className="flex w-24 shrink-0 flex-col">
              <span className="text-xs font-medium text-muted-foreground line-through">
                {t.fecha}
              </span>
              <span className="text-[10px] text-subtle">{t.hora} h</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <User2 className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="truncate">{t.cliente}</span>
              </span>
              <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="truncate">{t.svc}</span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3" strokeWidth={1.5} />
                  {t.tel}
                </span>
              </div>
            </div>
            {t.futuro ? (
              <span className="ml-auto shrink-0 rounded-md border border-amber-500/40 px-2 py-0.5 text-[10px] text-amber-500">
                Era a futuro
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
