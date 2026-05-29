"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  datosBancariosSchema,
  type DatosBancariosFormValues,
} from "./datos-bancarios-schema";
import { guardarDatosBancarios } from "./actions";

type Props = {
  defaults: DatosBancariosFormValues;
};

export function DatosBancariosForm({ defaults }: Props) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosBancariosFormValues>({
    resolver: zodResolver(datosBancariosSchema),
    defaultValues: defaults,
  });

  function onSubmit(values: DatosBancariosFormValues) {
    startTransition(async () => {
      const res = await guardarDatosBancarios(values);
      if (res.ok) {
        toast.success("Datos bancarios guardados.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="alias">Alias</Label>
        <Input
          id="alias"
          {...register("alias")}
          aria-invalid={!!errors.alias}
          placeholder="mi.alias.mp"
        />
        {errors.alias ? (
          <p className="text-sm text-destructive">{errors.alias.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cbu">CBU</Label>
        <Input
          id="cbu"
          inputMode="numeric"
          {...register("cbu")}
          aria-invalid={!!errors.cbu}
          placeholder="22 dígitos"
        />
        {errors.cbu ? (
          <p className="text-sm text-destructive">{errors.cbu.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="banco">Banco</Label>
          <Input
            id="banco"
            {...register("banco")}
            aria-invalid={!!errors.banco}
            placeholder="Galicia, Santander…"
          />
          {errors.banco ? (
            <p className="text-sm text-destructive">{errors.banco.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="titular">Titular</Label>
          <Input
            id="titular"
            {...register("titular")}
            aria-invalid={!!errors.titular}
            placeholder="Nombre completo"
          />
          {errors.titular ? (
            <p className="text-sm text-destructive">
              {errors.titular.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cuit">CUIT / CUIL</Label>
        <Input
          id="cuit"
          inputMode="numeric"
          {...register("cuit")}
          aria-invalid={!!errors.cuit}
          placeholder="11 dígitos sin guiones"
        />
        {errors.cuit ? (
          <p className="text-sm text-destructive">{errors.cuit.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar datos bancarios"}
        </Button>
      </div>
    </form>
  );
}
