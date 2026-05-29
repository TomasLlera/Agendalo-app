"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { bloqueoSchema, type BloqueoFormValues } from "./schema";
import { createBloqueo, deleteBloqueo } from "./actions";

export type BloqueoItem = {
  id: string;
  rango: string;
  motivo: string | null;
};

function BloqueoRow({ bloqueo }: { bloqueo: BloqueoItem }) {
  const [isPending, startTransition] = useTransition();

  function onEliminar() {
    startTransition(async () => {
      const res = await deleteBloqueo(bloqueo.id);
      if (res.ok) toast.success("Bloqueo eliminado.");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm">{bloqueo.rango}</p>
        {bloqueo.motivo ? (
          <p className="truncate text-xs text-muted-foreground">
            {bloqueo.motivo}
          </p>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Eliminar bloqueo"
        onClick={onEliminar}
        disabled={isPending}
      >
        <Trash2 strokeWidth={1.5} />
      </Button>
    </div>
  );
}

export function BloqueosSection({ bloqueos }: { bloqueos: BloqueoItem[] }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BloqueoFormValues>({
    resolver: zodResolver(bloqueoSchema),
    defaultValues: { fechaInicio: "", fechaFin: "", motivo: "" },
  });

  function onSubmit(values: BloqueoFormValues) {
    startTransition(async () => {
      const res = await createBloqueo(values);
      if (res.ok) {
        toast.success("Bloqueo agregado.");
        reset();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fechaInicio">Desde</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  {...register("fechaInicio")}
                  aria-invalid={!!errors.fechaInicio}
                />
                {errors.fechaInicio ? (
                  <p className="text-sm text-destructive">
                    {errors.fechaInicio.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fechaFin">Hasta</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  {...register("fechaFin")}
                  aria-invalid={!!errors.fechaFin}
                />
                {errors.fechaFin ? (
                  <p className="text-sm text-destructive">
                    {errors.fechaFin.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Input
                id="motivo"
                {...register("motivo")}
                aria-invalid={!!errors.motivo}
                placeholder="Vacaciones, feriado, etc."
              />
              {errors.motivo ? (
                <p className="text-sm text-destructive">
                  {errors.motivo.message}
                </p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Agregando…" : "Agregar bloqueo"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {bloqueos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
          <CalendarOff
            className="size-5 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="mt-1 text-sm text-muted-foreground">
            No tenés bloqueos próximos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bloqueos.map((bloqueo) => (
            <BloqueoRow key={bloqueo.id} bloqueo={bloqueo} />
          ))}
        </div>
      )}
    </div>
  );
}
