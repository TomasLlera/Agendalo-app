"use client";

import { useEffect, useRef } from "react";
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
// Duplicamos el set para poder loopear de forma infinita y sin corte.
const LOOP = [...TODOS, ...TODOS];

const AUTO_SPEED = 0.5; // px por frame
const FRICTION = 0.88; // desaceleración de la inercia al soltar

/**
 * Carrusel horizontal infinito de funciones extra.
 *
 * - Auto-scroll lento de izquierda a derecha en un único loop de RAF.
 * - Loop sin corte: el array se duplica y, al pasar el ancho del primer set,
 *   el offset se resetea silenciosamente (el contenido es idéntico).
 * - Hover pausa el auto-scroll.
 * - Drag con pointer events (mouse o touch); al soltar, la velocidad del drag
 *   se transfiere como inercia y desacelera con FRICTION antes de retomar.
 *
 * El offset vive en refs (no estado) para evitar stale closures dentro del RAF.
 */
export function ExtrasDial() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0); // translateX actual del track (px)
  const setWidthRef = useRef(0); // ancho de un set (medido del DOM)
  const hoverRef = useRef(false);
  const draggingRef = useRef(false);
  const velocityRef = useRef(0); // último delta de drag por frame
  const inertiaRef = useRef(0); // velocidad residual tras soltar
  const lastXRef = useRef(0);
  const reducedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // El ancho del primer set = posición del primer ítem del set duplicado.
    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const marker = track.children[TODOS.length] as HTMLElement | undefined;
      if (first && marker) {
        setWidthRef.current = marker.offsetLeft - first.offsetLeft;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    let raf = 0;
    const tick = () => {
      const setW = setWidthRef.current;
      if (setW > 0) {
        if (draggingRef.current) {
          // El offset lo maneja onPointerMove; acá no tocamos nada.
        } else if (Math.abs(inertiaRef.current) > 0.1) {
          offsetRef.current += inertiaRef.current;
          inertiaRef.current *= FRICTION;
        } else if (!hoverRef.current && !reducedRef.current) {
          offsetRef.current += AUTO_SPEED;
        }

        // Wrap silencioso dentro de (-setW, 0].
        let tx = offsetRef.current;
        while (tx <= -setW) tx += setW;
        while (tx > 0) tx -= setW;
        offsetRef.current = tx;

        track.style.transform = `translate3d(${tx}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    inertiaRef.current = 0;
    velocityRef.current = 0;
    lastXRef.current = ev.clientX;
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };

  const onPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = ev.clientX - lastXRef.current;
    lastXRef.current = ev.clientX;
    offsetRef.current += dx;
    velocityRef.current = dx;
  };

  const endDrag = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    inertiaRef.current = velocityRef.current; // transferimos la velocidad
    try {
      ev.currentTarget.releasePointerCapture(ev.pointerId);
    } catch {
      // pointer ya liberado: ignoramos.
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-surface/50 p-4 backdrop-blur-md sm:p-6">
      <div
        className="cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          ref={trackRef}
          className="flex select-none gap-3 will-change-transform"
          style={{ transition: "none" }}
        >
          {LOOP.map((e, i) => (
            <ExtraCard key={i} e={e} aria-hidden={i >= TODOS.length} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExtraCard({
  e,
  ...rest
}: {
  e: Extra;
} & React.HTMLAttributes<HTMLDivElement>) {
  const Icon = e.icon;
  return (
    <div
      {...rest}
      className="flex shrink-0 flex-col rounded-2xl border border-border bg-surface-elevated/40 p-5"
      style={{ width: "calc(33.33% - 8px)" }}
    >
      <span className="bg-gradient-brand glow-violet inline-flex size-11 items-center justify-center rounded-xl">
        <Icon className="size-5 text-white" strokeWidth={1.5} />
      </span>
      <h3 className="mt-4 text-base font-semibold leading-tight">{e.titulo}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{e.cuerpo}</p>
    </div>
  );
}
