"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BANCOS,
  datosBancariosSchema,
  type DatosBancariosFormValues,
} from "./datos-bancarios-schema";
import { guardarDatosBancarios } from "./actions";

const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-surface px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

const BANCOS_VALUES = new Set<string>(BANCOS.map((b) => b.value));

type Props = {
  defaults: DatosBancariosFormValues;
};

export function DatosBancariosForm({ defaults }: Props) {
  const [isPending, startTransition] = useTransition();

  // Si el banco guardado no está en la lista predefinida, asumimos que
  // venía de "Otro" y precargamos el input libre con su valor.
  const initialBancoEnLista =
    defaults.banco === "" || BANCOS_VALUES.has(defaults.banco);
  const [bancoSelect, setBancoSelect] = useState<string>(
    initialBancoEnLista ? defaults.banco : "Otro",
  );
  const [bancoOtro, setBancoOtro] = useState<string>(
    initialBancoEnLista ? "" : defaults.banco,
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<DatosBancariosFormValues>({
    resolver: zodResolver(datosBancariosSchema),
    defaultValues: defaults,
  });

  // Mantener el campo `banco` del form sincronizado con la combinación
  // de select + input libre.
  const bancoActual = useWatch({ control, name: "banco" });
  if (bancoActual !== (bancoSelect === "Otro" ? bancoOtro : bancoSelect)) {
    setValue("banco", bancoSelect === "Otro" ? bancoOtro : bancoSelect);
  }

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
          <select
            id="banco"
            value={bancoSelect}
            onChange={(e) => setBancoSelect(e.target.value)}
            className={SELECT_CLASS}
            aria-invalid={!!errors.banco}
          >
            <option value="">Elegí un banco…</option>
            {BANCOS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          {bancoSelect === "Otro" ? (
            <Input
              value={bancoOtro}
              onChange={(e) => setBancoOtro(e.target.value)}
              placeholder="Nombre del banco"
              className="mt-1.5"
            />
          ) : null}
          {/* hidden registrado para que el value llegue al submit */}
          <input type="hidden" {...register("banco")} />
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
