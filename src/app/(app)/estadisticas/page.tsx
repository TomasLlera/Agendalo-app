import type { Metadata } from "next";
import Link from "next/link";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Crown,
  Minus,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calcularEstadisticas,
  MESES_HISTORIA,
  type Kpis,
} from "./calculo";
import {
  DetalleDiarioChart,
  DiaSemanaChart,
  IngresosMensualesChart,
} from "./charts";

export const metadata: Metadata = {
  title: "Estadísticas — Agendalo",
};

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default async function EstadisticasPage() {
  const profesional = await getCurrentProfesional();

  if (!isPro(profesional)) {
    return <TeaserPro />;
  }

  const tz = profesional.timezone;
  const ahora = new Date();

  // Ventana = primer día del mes hace (MESES_HISTORIA - 1) meses, en la TZ
  // del profesional. Una sola query cubre serie mensual, día de semana,
  // desglose por servicio y detalle diario.
  const mesActualKey = formatInTimeZone(ahora, tz, "yyyy-MM");
  const [ya, ma] = mesActualKey.split("-").map(Number);
  const total = ya * 12 + (ma - 1) - (MESES_HISTORIA - 1);
  const wy = Math.floor(total / 12);
  const wm = (total % 12) + 1;
  const inicioVentana = fromZonedTime(
    `${wy}-${String(wm).padStart(2, "0")}-01T00:00:00`,
    tz,
  );

  const turnos = await prisma.turno.findMany({
    where: {
      profesionalId: profesional.id,
      estado: { in: ["CONFIRMADO", "COMPLETADO"] },
      fechaInicio: { gte: inicioVentana },
    },
    select: {
      fechaInicio: true,
      servicioId: true,
      servicio: { select: { nombre: true, precio: true } },
      miembroId: true,
      miembro: { select: { nombre: true } },
    },
  });

  const stats = calcularEstadisticas(turnos, tz, ahora);
  const { kpis, porMes, porServicio, porMiembro, porDiaSemana, detalleDiario } =
    stats;

  const totalAnual = porMes.reduce((s, m) => s + m.ingresos, 0);
  const totalServicios = porServicio.reduce((s, x) => s + x.ingresos, 0);
  const diaMenor = porDiaSemana.find((d) => d.esMenor) ?? null;

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          {stats.etiquetaMesActual}
        </p>
      </header>

      {/* KPIs del mes */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={<Wallet className="size-3.5" strokeWidth={1.5} />}
          titulo="Ingresos del mes"
          valor={formatoARS.format(kpis.ingresosMes)}
          deltaPct={kpis.ingresosDeltaPct}
          prevTuvoDatos={kpis.prevTuvoDatos}
        />
        <KpiCard
          icon={<CalendarCheck className="size-3.5" strokeWidth={1.5} />}
          titulo="Turnos del mes"
          valor={String(kpis.turnosMes)}
          deltaPct={kpis.turnosDeltaPct}
          prevTuvoDatos={kpis.prevTuvoDatos}
        />
        <KpiCard
          icon={<TrendingDown className="size-3.5 rotate-180" strokeWidth={1.5} />}
          titulo="Ticket promedio"
          valor={formatoARS.format(kpis.ticketPromedio)}
          deltaPct={null}
          prevTuvoDatos={false}
        />
      </div>

      {/* Ingresos por mes */}
      <Panel
        titulo="Ingresos por mes"
        nota={`${MESES_HISTORIA} meses · total ${formatoARS.format(totalAnual)}`}
      >
        {totalAnual === 0 ? (
          <VacioPanel mensaje="Todavía no hay ingresos para mostrar." />
        ) : (
          <div className="p-3">
            <IngresosMensualesChart data={porMes} />
          </div>
        )}
      </Panel>

      {/* Desglose por servicio */}
      <Panel
        titulo="Por servicio"
        nota={stats.etiquetaMesActual}
      >
        {porServicio.length === 0 ? (
          <VacioPanel mensaje="Sin turnos este mes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Servicio</th>
                  <th className="px-5 py-2 text-right font-medium">Turnos</th>
                  <th className="px-5 py-2 text-right font-medium">Ingresos</th>
                  <th className="hidden px-5 py-2 text-right font-medium sm:table-cell">
                    % del total
                  </th>
                </tr>
              </thead>
              <tbody>
                {porServicio.map((s) => {
                  const pct =
                    totalServicios > 0
                      ? (s.ingresos / totalServicios) * 100
                      : 0;
                  return (
                    <tr
                      key={s.servicioId}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-5 py-2.5 font-medium">{s.nombre}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                        {s.turnos}
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums">
                        {formatoARS.format(s.ingresos)}
                      </td>
                      <td className="hidden px-5 py-2.5 text-right tabular-nums text-muted-foreground sm:table-cell">
                        {pct.toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border text-sm font-medium">
                  <td className="px-5 py-2.5">Total</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {porServicio.reduce((s, x) => s + x.turnos, 0)}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {formatoARS.format(totalServicios)}
                  </td>
                  <td className="hidden px-5 py-2.5 text-right text-muted-foreground sm:table-cell">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {/* Desglose por profesional — solo si hay equipo (≥2 miembros). */}
      {porMiembro.length >= 2 ? (
        <Panel titulo="Por profesional" nota={stats.etiquetaMesActual}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Profesional</th>
                  <th className="px-5 py-2 text-right font-medium">Turnos</th>
                  <th className="px-5 py-2 text-right font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {porMiembro.map((m) => (
                  <tr
                    key={m.miembroId}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-5 py-2.5 font-medium">{m.nombre}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                      {m.turnos}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {formatoARS.format(m.ingresos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {/* Día de la semana */}
      <Panel
        titulo="Por día de la semana"
        nota={
          diaMenor
            ? `Día más flojo: ${diaMenor.etiqueta.replace(".", "")}`
            : "Ventas realizadas"
        }
      >
        {porDiaSemana.every((d) => d.turnos === 0) ? (
          <VacioPanel mensaje="Todavía no hay turnos realizados." />
        ) : (
          <div className="p-3">
            <DiaSemanaChart data={porDiaSemana} />
            {diaMenor ? (
              <p className="px-2 pb-1 text-xs text-muted-foreground">
                <span className="capitalize">
                  {diaMenor.etiqueta.replace(".", "")}
                </span>{" "}
                es el día con menos ingresos. Considerá una promo o ajustar tus
                horarios.
              </p>
            ) : null}
          </div>
        )}
      </Panel>

      {/* Detalle diario del mes */}
      <Panel titulo="Detalle diario" nota={stats.etiquetaMesActual}>
        {detalleDiario.every((d) => d.ingresos === 0) ? (
          <VacioPanel mensaje="Sin ingresos este mes." />
        ) : (
          <div className="p-3">
            <DetalleDiarioChart data={detalleDiario} />
          </div>
        )}
      </Panel>
    </section>
  );
}

function KpiCard({
  icon,
  titulo,
  valor,
  deltaPct,
  prevTuvoDatos,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: string;
} & Pick<Kpis, "prevTuvoDatos"> & { deltaPct: number | null }) {
  const subiendo = (deltaPct ?? 0) > 0;
  const bajando = (deltaPct ?? 0) < 0;
  const DeltaIcon = subiendo ? ArrowUpRight : bajando ? ArrowDownRight : Minus;
  const mostrarDelta = deltaPct !== null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {titulo}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{valor}</p>
      {mostrarDelta ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs",
            subiendo
              ? "text-success"
              : bajando
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3.5" strokeWidth={1.5} />
          {`${subiendo ? "+" : ""}${deltaPct.toFixed(1)}% vs mes anterior`}
        </p>
      ) : prevTuvoDatos ? null : (
        <p className="mt-2 text-xs text-subtle">Sin comparación previa</p>
      )}
    </div>
  );
}

function Panel({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">{titulo}</h2>
        {nota ? (
          <span className="text-xs capitalize text-muted-foreground">
            {nota}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function VacioPanel({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex h-32 items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">{mensaje}</p>
    </div>
  );
}

function TeaserPro() {
  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu panel contable: ingresos, turnos y tendencias del negocio.
        </p>
      </header>

      <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
        {/* Vista previa difuminada de fondo */}
        <div
          aria-hidden
          className="pointer-events-none select-none p-6 opacity-40 blur-[3px]"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {["$ 248.500", "32", "$ 7.765"].map((v, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-5">
                <div className="h-3 w-24 rounded bg-muted" />
                <p className="mt-3 text-2xl font-semibold tracking-tight">{v}</p>
                <div className="mt-3 h-3 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex h-40 items-end gap-2">
            {[40, 65, 50, 80, 55, 90, 70, 100, 60, 85, 75, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-secondary/60"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Overlay con CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/40 px-6 text-center backdrop-blur-[1px]">
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <Crown className="size-6" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-base font-semibold">Estadísticas es parte de Pro</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Seguí tus ingresos por mes y por servicio, descubrí tu día más
              flojo y compará tu evolución. Todo en un panel contable.
            </p>
          </div>
          <Link
            href="/configuracion/plan"
            className={cn(buttonVariants(), "mt-1")}
          >
            <Crown strokeWidth={1.5} />
            Pasar a Pro
          </Link>
        </div>
      </div>
    </section>
  );
}
