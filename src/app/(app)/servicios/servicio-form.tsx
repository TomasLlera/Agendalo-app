"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DURACIONES,
  MONEDAS,
  servicioSchema,
  type ServicioFormValues,
} from "./schema";
import { createServicio, updateServicio } from "./actions";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-surface px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

const DESCRIPCION_MAX = 280;

type ServicioFormProps =
  | { mode: "crear"; servicio?: undefined }
  | { mode: "editar"; servicio: { id: string } & ServicioFormValues };

export function ServicioForm(props: ServicioFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ServicioFormValues>({
    resolver: zodResolver(servicioSchema),
    defaultValues:
      props.mode === "editar"
        ? {
            nombre: props.servicio.nombre,
            descripcion: props.servicio.descripcion,
            duracionMinutos: props.servicio.duracionMinutos,
            precio: props.servicio.precio,
            moneda: props.servicio.moneda,
            requierePago: props.servicio.requierePago,
          }
        : {
            nombre: "",
            descripcion: "",
            duracionMinutos: 30,
            precio: "",
            moneda: "ARS",
            requierePago: false,
          },
  });

  const descripcion = useWatch({ control, name: "descripcion" }) ?? "";

  function onSubmit(values: ServicioFormValues) {
    startTransition(async () => {
      const res =
        props.mode === "editar"
          ? await updateServicio(props.servicio.id, values)
          : await createServicio(values);
      if (res.ok) {
        toast.success(
          props.mode === "editar"
            ? "Servicio actualizado."
            : "Servicio creado.",
        );
        router.push("/servicios");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="flex flex-col gap-6">
          {/* Nombre */}
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              aria-invalid={!!errors.nombre}
              placeholder="Corte de pelo"
            />
            {errors.nombre ? (
              <p className="text-sm text-destructive">
                {errors.nombre.message}
              </p>
            ) : null}
          </div>

          {/* Duración */}
          <div className="grid gap-2">
            <Label htmlFor="duracionMinutos">Duración</Label>
            <select
              id="duracionMinutos"
              {...register("duracionMinutos", { valueAsNumber: true })}
              aria-invalid={!!errors.duracionMinutos}
              className={SELECT_CLASS}
            >
              {DURACIONES.map((min) => (
                <option key={min} value={min}>
                  {min} minutos
                </option>
              ))}
            </select>
            {errors.duracionMinutos ? (
              <p className="text-sm text-destructive">
                {errors.duracionMinutos.message}
              </p>
            ) : null}
          </div>

          {/* Precio + Moneda */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="precio">Precio</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                {...register("precio")}
                aria-invalid={!!errors.precio}
                placeholder="0.00"
              />
              {errors.precio ? (
                <p className="text-sm text-destructive">
                  {errors.precio.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="moneda">Moneda</Label>
              <select
                id="moneda"
                {...register("moneda")}
                aria-invalid={!!errors.moneda}
                className={SELECT_CLASS}
              >
                {MONEDAS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.moneda ? (
                <p className="text-sm text-destructive">
                  {errors.moneda.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Requiere pago */}
          <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
            <input
              type="checkbox"
              {...register("requierePago")}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                Requiere pago al reservar
              </span>
              <span className="text-xs text-muted-foreground">
                El cliente paga por Mercado Pago antes de confirmar el turno.
              </span>
            </span>
          </label>

          {/* Descripción */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="descripcion">Descripción</Label>
              <span
                className={cn(
                  "text-xs text-subtle",
                  descripcion.length > DESCRIPCION_MAX && "text-destructive",
                )}
              >
                {descripcion.length}/{DESCRIPCION_MAX}
              </span>
            </div>
            <Textarea
              id="descripcion"
              rows={3}
              {...register("descripcion")}
              aria-invalid={!!errors.descripcion}
              placeholder="Detalle opcional del servicio."
            />
            {errors.descripcion ? (
              <p className="text-sm text-destructive">
                {errors.descripcion.message}
              </p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/servicios")}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Guardando…"
              : props.mode === "editar"
                ? "Guardar cambios"
                : "Crear servicio"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
