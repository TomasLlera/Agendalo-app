"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import {
  BadgeCheck,
  CalendarOff,
  CalendarPlus,
  CalendarX2,
  CircleUser,
  Clock,
  Globe,
  History,
  MonitorSmartphone,
  SlidersHorizontal,
  StickyNote,
  Wallet,
} from "lucide-react";

type Extra = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titulo: string;
  cuerpo: string;
};

const IZQUIERDA: Extra[] = [
  {
    icon: SlidersHorizontal,
    titulo: "Servicios a tu medida",
    cuerpo: "Definí duración, precio y descripción de cada servicio.",
  },
  {
    icon: Clock,
    titulo: "Horarios flexibles",
    cuerpo: "Configurá tus días y franjas de atención por separado.",
  },
  {
    icon: CalendarOff,
    titulo: "Vacaciones y francos",
    cuerpo: "Bloqueá fechas puntuales y dejá de recibir reservas.",
  },
  {
    icon: CalendarX2,
    titulo: "Cancelación en un clic",
    cuerpo: "El cliente cancela desde un link y se libera el turno.",
  },
  {
    icon: History,
    titulo: "Historial de cancelados",
    cuerpo: "Revisá los turnos cancelados con el contacto a mano.",
  },
  {
    icon: CalendarPlus,
    titulo: "Sumalo al calendario",
    cuerpo: "Cada turno se exporta a Google, Apple u Outlook (.ics).",
  },
];

const DERECHA: Extra[] = [
  {
    icon: MonitorSmartphone,
    titulo: "Desde cualquier dispositivo",
    cuerpo: "Gestioná tu agenda desde la compu o el celular.",
  },
  {
    icon: Wallet,
    titulo: "Transferencia y efectivo",
    cuerpo: "Mostrás tu CBU/Alias o cobrás en el lugar, sin Mercado Pago.",
  },
  {
    icon: BadgeCheck,
    titulo: "Estados a la vista",
    cuerpo: "Pagado, pendiente o confirmado: lo ves al instante.",
  },
  {
    icon: CircleUser,
    titulo: "Tu perfil público",
    cuerpo: "Foto, bio y tus servicios en una página propia.",
  },
  {
    icon: Globe,
    titulo: "Tu zona horaria",
    cuerpo: "Mostramos los horarios siempre en tu huso, sin confusiones.",
  },
  {
    icon: StickyNote,
    titulo: "Notas internas",
    cuerpo: "Anotá detalles privados en cada turno, solo para vos.",
  },
];

const TODOS = [...IZQUIERDA, ...DERECHA];

/**
 * "Dial" de funciones extra: 6 íconos a cada lado de un panel central que
 * muestra la info del ítem activo. El activo se cambia con hover (desktop),
 * tap (mobile) o foco con teclado. Arranca con el primero seleccionado.
 */
export function ExtrasDial() {
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Fade sutil del panel al cambiar de ítem (respeta reduced-motion).
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(el, {
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 300,
      ease: "outQuad",
    });
  }, [active]);

  const item = TODOS[active];
  const Icon = item.icon;

  return (
    <div className="rounded-3xl border border-border bg-surface/50 p-4 backdrop-blur-md sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(300px,380px)_1fr] lg:items-center lg:gap-6">
        {/* Íconos izquierda. */}
        <div className="order-2 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:order-1 lg:grid-cols-1">
          {IZQUIERDA.map((e) => (
            <IconBtn
              key={e.titulo}
              e={e}
              active={TODOS[active] === e}
              onSelect={() => setActive(TODOS.indexOf(e))}
            />
          ))}
        </div>

        {/* Panel central. */}
        <div className="order-1 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-border bg-surface-elevated/40 p-8 text-center lg:order-2">
          <div ref={panelRef} className="flex flex-col items-center">
            <span className="bg-gradient-brand glow-violet inline-flex size-14 items-center justify-center rounded-2xl">
              <Icon className="size-6 text-white" strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{item.titulo}</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {item.cuerpo}
            </p>
          </div>
        </div>

        {/* Íconos derecha. */}
        <div className="order-3 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-1">
          {DERECHA.map((e) => (
            <IconBtn
              key={e.titulo}
              e={e}
              active={TODOS[active] === e}
              onSelect={() => setActive(TODOS.indexOf(e))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  e,
  active,
  onSelect,
}: {
  e: Extra;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = e.icon;
  return (
    <button
      type="button"
      aria-pressed={active}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      onClick={onSelect}
      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
        active
          ? "border-secondary/50 bg-surface-elevated text-foreground"
          : "border-border bg-surface/40 text-muted-foreground hover:border-border-strong hover:text-foreground"
      }`}
    >
      <span
        className={`inline-flex size-9 items-center justify-center rounded-lg ring-1 transition-colors ${
          active
            ? "bg-secondary/15 ring-secondary/40"
            : "bg-surface-elevated ring-secondary/15"
        }`}
      >
        <Icon
          className={active ? "size-4 text-secondary" : "size-4"}
          strokeWidth={1.5}
        />
      </span>
      <span className="text-[11px] font-medium leading-tight">{e.titulo}</span>
    </button>
  );
}
