"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarX2,
  CreditCard,
  Globe,
  Landmark,
  Phone,
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
    id: "publica",
    titulo: "Página pública",
    url: "agendalo.app/p/mara",
    bajada: "Tu link de reservas, listo para compartir. Sin que el cliente se registre.",
    icon: Globe,
    render: <MockPublica />,
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
    id: "cobros",
    titulo: "Cobros",
    url: "agendalo.app/configuracion/pagos",
    bajada: "Cobrá con Mercado Pago, transferencia o efectivo. Vos elegís.",
    icon: CreditCard,
    render: <MockPagos />,
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

type Carta = { uid: number; mock: number };

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SALIDA = 380; // ms que tarda la carta de arriba en volar

// Estilo de cada slot del mazo (de adelante hacia atrás). Concéntricas: sólo
// escalan desde el centro, así las de atrás asoman parejo por los 4 lados.
const SLOTS = [
  { transform: "scale(1)", opacity: 1, zIndex: 30 },
  { transform: "scale(0.96)", opacity: 1, zIndex: 20 },
  { transform: "scale(0.92)", opacity: 0.7, zIndex: 10 },
] as const;

// Estilo de la carta que vuela hacia la izquierda al avanzar.
const VUELA = {
  transform: "translateX(-115%) rotate(-14deg) scale(1)",
  opacity: 0,
  zIndex: 40,
} as const;

export function AppCarousel() {
  // Los uids 0,1,2 ya los usan las cartas iniciales; el contador sigue en 3.
  const uidRef = useRef(3);
  const proximoMockRef = useRef(3 % MOCKS.length);
  const animandoRef = useRef(false);
  const pausadoRef = useRef(false);

  // Stack actual (de arriba hacia atrás). Cada carta lleva un uid propio,
  // basado en un contador, NO en el índice del mock: así React conserva el
  // mismo nodo del DOM mientras la carta se anima.
  const [stack, setStack] = useState<Carta[]>(() => [
    { uid: 0, mock: 0 },
    { uid: 1, mock: 1 },
    { uid: 2, mock: 2 },
  ]);
  const stackRef = useRef(stack);
  const commitStack = (next: Carta[]) => {
    stackRef.current = next;
    setStack(next);
  };

  // Carta que está volando (se renderiza encima del mazo) y uid recién
  // agregado al fondo (para suprimir su transición durante el primer frame).
  const [volando, setVolando] = useState<Carta | null>(null);
  const [freshUid, setFreshUid] = useState<number | null>(null);

  const avanzar = useCallback(() => {
    if (animandoRef.current) return;
    const actual = stackRef.current;
    if (actual.length < 1) return;
    animandoRef.current = true;

    // La carta de arriba sale del stack y empieza a volar; las de atrás se
    // deslizan hacia adelante solas (cambian de slot con su CSS transition).
    const [arriba, ...resto] = actual;
    setVolando(arriba);
    commitStack(resto);

    window.setTimeout(() => {
      // Se quita del DOM la que voló y se agrega una nueva al fondo (slot 2).
      setVolando(null);
      const mock = proximoMockRef.current;
      proximoMockRef.current = (proximoMockRef.current + 1) % MOCKS.length;
      const nueva: Carta = { uid: uidRef.current++, mock };
      setFreshUid(nueva.uid); // entra sin transición (transition: none)
      commitStack([...stackRef.current, nueva]);
      // Tras el primer render, habilitamos su transición normal.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setFreshUid(null)),
      );
      animandoRef.current = false;
    }, SALIDA);
  }, []);

  // Autoplay cada 4s, pausado en hover/focus y desactivado con reduced-motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!pausadoRef.current) avanzar();
    }, 4000);
    return () => window.clearInterval(id);
  }, [avanzar]);

  // El mock que está arriba define la tab activa.
  const mockArriba = stack[0]?.mock ?? 0;

  const trans = `transform ${SALIDA}ms ${EASE}, opacity ${SALIDA}ms ${EASE}`;

  // Lista que se renderiza: la carta que vuela (si hay) + el stack. Todas
  // keyeadas por uid para que React no destruya/recree nodos en la animación.
  const cartas: { carta: Carta; estilo: React.CSSProperties }[] = [];
  if (volando) {
    cartas.push({ carta: volando, estilo: { ...VUELA, transition: trans } });
  }
  stack.forEach((carta, slot) => {
    const base = SLOTS[Math.min(slot, SLOTS.length - 1)];
    cartas.push({
      carta,
      estilo: {
        transform: base.transform,
        opacity: base.opacity,
        zIndex: base.zIndex,
        transition: carta.uid === freshUid ? "none" : trans,
      },
    });
  });

  return (
    <div
      className="mx-auto w-full max-w-[1100px]"
      onMouseEnter={() => (pausadoRef.current = true)}
      onMouseLeave={() => (pausadoRef.current = false)}
      onFocusCapture={() => (pausadoRef.current = true)}
      onBlurCapture={() => (pausadoRef.current = false)}
    >
      {/* Mazo de cartas. */}
      <div
        className="relative mx-auto min-h-[380px] max-w-[860px] cursor-pointer select-none [perspective:1200px]"
        onClick={avanzar}
        role="button"
        tabIndex={0}
        aria-label="Siguiente pantalla"
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            avanzar();
          }
        }}
      >
        {cartas.map(({ carta, estilo }) => (
          <div
            key={carta.uid}
            className="absolute inset-x-0 top-0 origin-center will-change-transform"
            style={estilo}
          >
            <DeckCard mock={MOCKS[carta.mock]} />
          </div>
        ))}
      </div>

      {/* Tabs indicadoras de qué pantalla está arriba. */}
      <div
        role="tablist"
        aria-label="Pantallas de Agendalo"
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        {MOCKS.map((m, i) => {
          const Icon = m.icon;
          const isActive = i === mockArriba;
          return (
            <div
              key={m.id}
              role="tab"
              aria-selected={isActive}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-surface/60 text-muted-foreground"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {m.titulo}
            </div>
          );
        })}
      </div>

      {/* Caption. */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {MOCKS[mockArriba].bajada}
      </p>
    </div>
  );
}

/** Una carta del mazo: marco de navegador + el mock, con alto acotado. */
function DeckCard({ mock }: { mock: Mock }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
        </div>
        <span className="ml-2 truncate text-xs text-subtle">{mock.url}</span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
          <mock.icon className="size-3" strokeWidth={1.75} />
          {mock.titulo}
        </span>
      </div>
      <div className="h-[320px] overflow-hidden p-4 sm:p-6">
        {mock.render}
      </div>
    </div>
  );
}

/* ------------------------------- Mocks --------------------------------- */

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
