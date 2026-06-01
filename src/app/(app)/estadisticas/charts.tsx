"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PuntoDia, PuntoDiaSemana, PuntoMes } from "./calculo";

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

const tooltipLabel = { color: "var(--color-muted-foreground)" } as const;
const tooltipItem = { color: "var(--color-foreground)" } as const;
const tickFill = { fill: "var(--color-muted-foreground)", fontSize: 11 } as const;

/** Ingresos por mes (últimos 12 meses). */
export function IngresosMensualesChart({ data }: { data: PuntoMes[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            tick={tickFill}
            tickFormatter={(v) => String(v).replace(".", "")}
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabel}
            itemStyle={tooltipItem}
            formatter={(value, _name, item) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              const turnos = (item?.payload as PuntoMes | undefined)?.turnos ?? 0;
              return [
                `${formatoARS.format(n)} · ${turnos} ${turnos === 1 ? "turno" : "turnos"}`,
                "Ingresos",
              ];
            }}
          />
          <Bar
            dataKey="ingresos"
            fill="var(--color-secondary)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ingresos por día de la semana. Resalta el día más flojo. */
export function DiaSemanaChart({ data }: { data: PuntoDiaSemana[] }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            tick={tickFill}
            tickFormatter={(v) => String(v).replace(".", "")}
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabel}
            itemStyle={tooltipItem}
            formatter={(value, _name, item) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              const turnos =
                (item?.payload as PuntoDiaSemana | undefined)?.turnos ?? 0;
              return [
                `${formatoARS.format(n)} · ${turnos} ${turnos === 1 ? "turno" : "turnos"}`,
                "Ingresos",
              ];
            }}
          />
          <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.dow}
                fill={
                  d.esMenor
                    ? "var(--color-warning)"
                    : "var(--color-secondary)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Detalle diario del mes actual. */
export function DetalleDiarioChart({ data }: { data: PuntoDia[] }) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            tick={tickFill}
            interval={2}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabel}
            itemStyle={tooltipItem}
            labelFormatter={(label) => `Día ${label}`}
            formatter={(value, _name, item) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              const turnos = (item?.payload as PuntoDia | undefined)?.turnos ?? 0;
              return [
                `${formatoARS.format(n)} · ${turnos} ${turnos === 1 ? "turno" : "turnos"}`,
                "Ingresos",
              ];
            }}
          />
          <Bar
            dataKey="ingresos"
            fill="var(--color-secondary)"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
