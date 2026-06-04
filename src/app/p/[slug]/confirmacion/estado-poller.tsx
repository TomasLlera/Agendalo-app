"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Cada cuánto consultamos el estado mientras está pendiente (ms). */
const INTERVALO = 4000;

/**
 * Mientras el turno está pendiente de pago, consulta su estado cada pocos
 * segundos. Cuando el webhook de Mercado Pago lo confirma, refresca la página
 * para que el server component muestre la pantalla de "¡Reserva confirmada!".
 */
export function EstadoPoller({ turnoId }: { turnoId: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    let activo = true;

    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/turnos/${turnoId}/estado`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { estado?: string };
        if (activo && data.estado && data.estado !== "PENDIENTE_PAGO") {
          setConfirmando(true);
          window.clearInterval(id);
          router.refresh();
        }
      } catch {
        // Error transitorio de red: reintentamos en el próximo intervalo.
      }
    }, INTERVALO);

    return () => {
      activo = false;
      window.clearInterval(id);
    };
  }, [turnoId, router]);

  return (
    <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      {confirmando
        ? "Confirmando tu pago…"
        : "Esperando la confirmación del pago…"}
    </p>
  );
}
