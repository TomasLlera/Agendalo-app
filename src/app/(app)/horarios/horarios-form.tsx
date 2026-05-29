"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { setHorarios } from "./actions";

/** Días en orden de visualización (lunes primero); `num` = `diaSemana`. */
const DIAS = [
  { num: 1, label: "Lunes" },
  { num: 2, label: "Martes" },
  { num: 3, label: "Miércoles" },
  { num: 4, label: "Jueves" },
  { num: 5, label: "Viernes" },
  { num: 6, label: "Sábado" },
  { num: 0, label: "Domingo" },
] as const;

const FRANJA_DEFAULT: Franja = { horaInicio: "09:00", horaFin: "18:00" };

type Franja = { horaInicio: string; horaFin: string };
type DiaEstado = { abierto: boolean; franjas: Franja[] };
type HorarioRow = { diaSemana: number; horaInicio: string; horaFin: string };

function estadoInicial(horarios: HorarioRow[]): Record<number, DiaEstado> {
  const map: Record<number, DiaEstado> = {};
  for (const d of DIAS) map[d.num] = { abierto: false, franjas: [] };

  for (const h of horarios) {
    const dia = map[h.diaSemana];
    if (!dia) continue;
    dia.abierto = true;
    dia.franjas.push({ horaInicio: h.horaInicio, horaFin: h.horaFin });
  }

  for (const d of DIAS) {
    const dia = map[d.num];
    if (!dia) continue;
    dia.franjas.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    if (dia.franjas.length === 0) dia.franjas = [{ ...FRANJA_DEFAULT }];
    if (dia.franjas.length > 2) dia.franjas = dia.franjas.slice(0, 2);
  }
  return map;
}

export function HorariosForm({ horarios }: { horarios: HorarioRow[] }) {
  const [dias, setDias] = useState(() => estadoInicial(horarios));
  const [isPending, startTransition] = useTransition();

  function actualizar(num: number, fn: (dia: DiaEstado) => DiaEstado) {
    setDias((prev) => {
      const dia = prev[num];
      if (!dia) return prev;
      return { ...prev, [num]: fn(dia) };
    });
  }

  function toggleDia(num: number) {
    actualizar(num, (dia) => ({
      abierto: !dia.abierto,
      franjas: dia.franjas.length ? dia.franjas : [{ ...FRANJA_DEFAULT }],
    }));
  }

  function setHora(
    num: number,
    idx: number,
    campo: keyof Franja,
    valor: string,
  ) {
    actualizar(num, (dia) => ({
      ...dia,
      franjas: dia.franjas.map((f, i) =>
        i === idx ? { ...f, [campo]: valor } : f,
      ),
    }));
  }

  function agregarFranja(num: number) {
    actualizar(num, (dia) =>
      dia.franjas.length >= 2
        ? dia
        : { ...dia, franjas: [...dia.franjas, { ...FRANJA_DEFAULT }] },
    );
  }

  function quitarFranja(num: number, idx: number) {
    actualizar(num, (dia) => {
      const franjas = dia.franjas.filter((_, i) => i !== idx);
      return { abierto: franjas.length > 0, franjas };
    });
  }

  function onGuardar() {
    const payload: HorarioRow[] = [];
    for (const d of DIAS) {
      const dia = dias[d.num];
      if (!dia || !dia.abierto) continue;
      for (const f of dia.franjas) {
        payload.push({
          diaSemana: d.num,
          horaInicio: f.horaInicio,
          horaFin: f.horaFin,
        });
      }
    }
    for (const item of payload) {
      if (item.horaInicio >= item.horaFin) {
        toast.error("Cada franja debe terminar después de empezar.");
        return;
      }
    }

    startTransition(async () => {
      const res = await setHorarios(payload);
      if (res.ok) toast.success("Horarios guardados.");
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {DIAS.map((d) => {
          const dia = dias[d.num];
          if (!dia) return null;
          return (
            <div
              key={d.num}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={dia.abierto}
                  onChange={() => toggleDia(d.num)}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="w-24 text-sm font-medium">{d.label}</span>
                {!dia.abierto ? (
                  <span className="text-xs text-muted-foreground">Cerrado</span>
                ) : null}
              </label>

              {dia.abierto ? (
                <div className="mt-3 flex flex-col gap-2 pl-7">
                  {dia.franjas.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={f.horaInicio}
                        onChange={(e) =>
                          setHora(d.num, idx, "horaInicio", e.target.value)
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={f.horaFin}
                        onChange={(e) =>
                          setHora(d.num, idx, "horaFin", e.target.value)
                        }
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Quitar franja"
                        onClick={() => quitarFranja(d.num, idx)}
                      >
                        <X strokeWidth={1.5} />
                      </Button>
                    </div>
                  ))}
                  {dia.franjas.length < 2 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-fit"
                      onClick={() => agregarFranja(d.num)}
                    >
                      <Plus strokeWidth={1.5} />
                      Agregar franja
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onGuardar} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar horarios"}
        </Button>
      </CardFooter>
    </Card>
  );
}
