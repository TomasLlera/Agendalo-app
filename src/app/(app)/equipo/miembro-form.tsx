"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { miembroSchema, type MiembroFormValues } from "./schema";
import { createMiembro, updateMiembro } from "./actions";

type ServicioOption = { id: string; nombre: string };

type MiembroFormProps = {
  servicios: ServicioOption[];
} & (
  | { mode: "crear"; miembro?: undefined }
  | { mode: "editar"; miembro: { id: string } & MiembroFormValues }
);

export function MiembroForm(props: MiembroFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MiembroFormValues>({
    resolver: zodResolver(miembroSchema),
    defaultValues:
      props.mode === "editar"
        ? {
            nombre: props.miembro.nombre,
            fotoUrl: props.miembro.fotoUrl,
            servicioIds: props.miembro.servicioIds,
          }
        : { nombre: "", fotoUrl: "", servicioIds: [] },
  });

  function onSubmit(values: MiembroFormValues) {
    startTransition(async () => {
      const res =
        props.mode === "editar"
          ? await updateMiembro(props.miembro.id, values)
          : await createMiembro(values);
      if (res.ok) {
        toast.success(
          props.mode === "editar" ? "Miembro actualizado." : "Miembro creado.",
        );
        router.push("/equipo");
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
              placeholder="María González"
            />
            {errors.nombre ? (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            ) : null}
          </div>

          {/* Foto (URL) */}
          <div className="grid gap-2">
            <Label htmlFor="fotoUrl">Foto (opcional)</Label>
            <Input
              id="fotoUrl"
              {...register("fotoUrl")}
              aria-invalid={!!errors.fotoUrl}
              placeholder="https://…"
            />
            {errors.fotoUrl ? (
              <p className="text-sm text-destructive">
                {errors.fotoUrl.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Pegá el enlace a una foto de la persona.
              </p>
            )}
          </div>

          {/* Servicios que puede dar */}
          <div className="grid gap-2">
            <Label>Servicios que puede dar</Label>
            <Controller
              control={control}
              name="servicioIds"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {props.servicios.map((s) => {
                    const checked = field.value.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...field.value, s.id]
                                : field.value.filter((id) => id !== s.id),
                            );
                          }}
                          className="size-4 shrink-0 accent-primary"
                        />
                        <span className="text-sm">{s.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.servicioIds ? (
              <p className="text-sm text-destructive">
                {errors.servicioIds.message}
              </p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/equipo")}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Guardando…"
              : props.mode === "editar"
                ? "Guardar cambios"
                : "Sumar miembro"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
