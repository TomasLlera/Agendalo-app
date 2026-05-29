"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export type DiaIngreso = {
  dia: string;
  etiqueta: string;
  ingresos: number;
};

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function IncomeChart({ data }: { data: DiaIngreso[] }) {
  const total = data.reduce((s, d) => s + d.ingresos, 0);

  if (total === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Sin pagos en los últimos 30 días.
        </p>
        <p className="mt-1 text-xs text-subtle">
          Conectá Mercado Pago en Configuración para empezar a cobrar.
        </p>
      </div>
    );
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            interval={4}
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)" }}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-muted-foreground)" }}
            itemStyle={{ color: "var(--color-foreground)" }}
            formatter={(v) => {
              const n = typeof v === "number" ? v : Number(v ?? 0);
              return [formatoARS.format(n), "Ingresos"];
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
