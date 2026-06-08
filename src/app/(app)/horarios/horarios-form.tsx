"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { setHorarios } from "./actions";

/** Días en orden de visualización (lunes primero); `num` = `diaSemana`. */
const DIAS = [
  { num: 1, label: "Lunes", corto: "Lun" },
  { num: 2, label: "Martes", corto: "Mar" },
  { num: 3, label: "Miércoles", corto: "Mié" },
  { num: 4, label: "Jueves", corto: "Jue" },
  { num: 5, label: "Viernes", corto: "Vie" },
  { num: 6, label: "Sábado", corto: "Sáb" },
  { num: 0, label: "Domingo", corto: "Dom" },
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

  /** Replica las franjas del día `num` (abierto) a todos los días. */
  function copiarATodos(num: number) {
    setDias((prev) => {
      const origen = prev[num];
      if (!origen) return prev;
      const next: Record<number, DiaEstado> = {};
      for (const d of DIAS) {
        next[d.num] = {
          abierto: true,
          franjas: origen.franjas.map((f) => ({ ...f })),
        };
      }
      return next;
    });
    toast.success("Horario copiado a toda la semana.");
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
      <CardContent>
        <div className="divide-y divide-border">
          {DIAS.map((d) => {
            const dia = dias[d.num];
            if (!dia) return null;
            return (
              <div
                key={d.num}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                {/* Día + toggle. */}
                <label className="flex w-28 shrink-0 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={dia.abierto}
                    onChange={() => toggleDia(d.num)}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <span className="text-sm font-medium">{d.label}</span>
                </label>

                {!dia.abierto ? (
                  <span className="text-sm text-muted-foreground">Cerrado</span>
                ) : (
                  <>
                    {/* Franjas (una o dos, apiladas). */}
                    <div className="flex flex-col gap-2">
                      {dia.franjas.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Input
                            type="time"
                            value={f.horaInicio}
                            onChange={(e) =>
                              setHora(d.num, idx, "horaInicio", e.target.value)
                            }
                            className="w-28"
                            aria-label={`${d.label}: inicio franja ${idx + 1}`}
                          />
                          <span className="text-sm text-muted-foreground">
                            –
                          </span>
                          <Input
                            type="time"
                            value={f.horaFin}
                            onChange={(e) =>
                              setHora(d.num, idx, "horaFin", e.target.value)
                            }
                            className="w-28"
                            aria-label={`${d.label}: fin franja ${idx + 1}`}
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
                    </div>

                    {/* Acciones del día. */}
                    <div className="ml-auto flex items-center gap-1">
                      {dia.franjas.length < 2 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Agregar franja"
                          title="Agregar franja"
                          onClick={() => agregarFranja(d.num)}
                        >
                          <Plus strokeWidth={1.5} />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Copiar este horario a toda la semana"
                        title="Copiar a toda la semana"
                        onClick={() => copiarATodos(d.num)}
                      >
                        <Copy strokeWidth={1.5} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onGuardar} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar horarios"}
        </Button>
      </CardFooter>
    </Card>
  );
}
