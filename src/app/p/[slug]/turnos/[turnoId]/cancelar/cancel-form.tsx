"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  slug: string;
  turnoId: string;
  token: string;
};

type Estado =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; mensaje: string };

export function CancelForm({ slug, turnoId, token }: Props) {
  const [estado, setEstado] = useState<Estado>({ kind: "idle" });

  async function onConfirmar() {
    setEstado({ kind: "submitting" });
    try {
      const res = await fetch(`/api/turnos/${turnoId}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setEstado({ kind: "done" });
        return;
      }
      const body = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setEstado({
        kind: "error",
        mensaje: body?.error ?? "No pudimos cancelar el turno. Intentá de nuevo.",
      });
    } catch {
      setEstado({
        kind: "error",
        mensaje: "Error de conexión. Intentá de nuevo.",
      });
    }
  }

  if (estado.kind === "done") {
    return (
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CalendarCheck className="size-7" strokeWidth={1.5} />
        </span>
        <h2 className="mt-4 text-base font-semibold tracking-tight">
          Turno cancelado
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Te enviamos un email con la confirmación de la cancelación.
        </p>
        <Button
          className="mt-6 w-full"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/p/${slug}`} />}
        >
          Volver al perfil
        </Button>
      </div>
    );
  }

  const enviando = estado.kind === "submitting";

  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button
        className="w-full"
        variant="destructive"
        size="lg"
        onClick={onConfirmar}
        disabled={enviando}
      >
        {enviando ? "Cancelando…" : "Confirmar cancelación"}
      </Button>
      <Button
        className="w-full"
        variant="ghost"
        size="lg"
        nativeButton={false}
        render={<Link href={`/p/${slug}`} />}
      >
        No, mantener el turno
      </Button>
      {estado.kind === "error" ? (
        <p className="text-center text-sm text-destructive">
          {estado.mensaje}
        </p>
      ) : null}
    </div>
  );
}
