"use client";

import { useState } from "react";
import { PRECIO_PRO_ARS } from "@/lib/plan";

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

/**
 * Supuestos del cálculo, conservadores y centralizados acá para poder
 * ajustarlos en un solo lugar:
 * - Sin recordatorios, ~1 de cada 5 turnos se pierde por ausencias.
 * - Los recordatorios automáticos reducen esas ausencias ~70%.
 * El resultado es una estimación, no una promesa: se aclara en el texto.
 */
const TASA_AUSENCIA = 0.2;
const REDUCCION = 0.7;

const TURNOS_MIN = 10;
const TURNOS_MAX = 400;
const VALOR_MIN = 2000;
const VALOR_MAX = 80000;

/**
 * Calculadora de ROI interactiva: el profesional ajusta cuántos turnos atiende
 * por mes y cuánto cobra, y ve cuántos turnos recuperaría con recordatorios y
 * cuánto representa eso frente al costo del plan Pro.
 */
export function RoiCalculator() {
  const [turnos, setTurnos] = useState(80);
  const [valor, setValor] = useState(15000);

  const turnosRecuperados = Math.round(turnos * TASA_AUSENCIA * REDUCCION);
  const ingresos = turnosRecuperados * valor;
  const veces = ingresos > 0 ? Math.round(ingresos / PRECIO_PRO_ARS) : 0;

  return (
    <div className="ring-gradient-brand flex flex-col rounded-2xl bg-surface/70 p-6 backdrop-blur-md sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
        Calculá tu caso
      </p>
      <h3 className="mt-2 text-xl font-semibold">¿Cuánto recuperás por mes?</h3>

      <div className="mt-6 flex flex-col gap-6">
        <Slider
          label="Turnos por mes"
          value={turnos}
          min={TURNOS_MIN}
          max={TURNOS_MAX}
          step={5}
          onChange={setTurnos}
          display={`${turnos}`}
        />
        <Slider
          label="Valor de tu servicio"
          value={valor}
          min={VALOR_MIN}
          max={VALOR_MAX}
          step={1000}
          onChange={setValor}
          display={ARS.format(valor)}
        />
      </div>

      <div className="mt-7 rounded-xl border border-border bg-surface-elevated/60 p-5">
        <p className="text-sm text-muted-foreground">
          Recuperás unos{" "}
          <span className="font-semibold text-foreground">
            {turnosRecuperados} turnos
          </span>{" "}
          por mes que hoy se perderían por ausencias.
        </p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-gradient-brand sm:text-4xl">
          {ARS.format(ingresos)}
          <span className="ml-1 text-base font-medium text-muted-foreground">
            / mes
          </span>
        </p>
        {veces >= 1 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Eso es{" "}
            <span className="font-semibold text-foreground">
              {veces}× el costo del plan Pro
            </span>{" "}
            ({ARS.format(PRECIO_PRO_ARS)}/mes).
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-subtle">
        Estimación orientativa: asumimos que ~1 de cada 5 turnos se pierde por
        ausencias y que los recordatorios reducen eso un 70%. Tu resultado real
        depende de tu actividad.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-secondary h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-strong/60 outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      />
    </label>
  );
}
