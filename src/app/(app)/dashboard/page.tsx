import type { Metadata } from "next";
import { addDays, differenceInMinutes, format } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import Decimal from "decimal.js";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Minus,
  Wallet,
} from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { rangosFecha } from "./rangos";
import { ShareLinkCard } from "./share-link-card";
import { IncomeChart, type DiaIngreso } from "./income-chart";
import {
  AgendaList,
  type AgendaServicioOpcion,
  type AgendaTurno,
} from "./agenda-list";

export const metadata: Metadata = {
  title: "Agenda — Agendalo",
};

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const profesional = await getCurrentProfesional();
  // Las estadísticas de ingresos son una feature Pro (mismo criterio que
  // /estadisticas). En Free se ocultan los KPIs financieros del dashboard,
  // pero se mantiene la operación: próximos turnos, su estado de pago,
  // link público y calendario semanal.
  const pro = isPro(profesional);
  const tz = profesional.timezone;
  const ahora = new Date();
  const { hoy, semana } = rangosFecha(tz, ahora);

  // Una sola query a 60d cubre: mes actual, mes anterior y serie 30 días.
  const inicio60 = addDays(ahora, -60);
  const fin7Dias = addDays(ahora, 7);

  const [proximo, turnosSemana, turnosIngresos60, agendaTurnos, serviciosOpcion] =
    await Promise.all([
      prisma.turno.findFirst({
        where: {
          profesionalId: profesional.id,
          estado: { not: "CANCELADO" },
          fechaInicio: { gte: ahora },
        },
        orderBy: { fechaInicio: "asc" },
        select: {
          id: true,
          fechaInicio: true,
          clienteNombre: true,
          servicio: { select: { nombre: true, duracionMinutos: true } },
        },
      }),
      prisma.turno.findMany({
        where: {
          profesionalId: profesional.id,
          estado: { not: "CANCELADO" },
          fechaInicio: { gte: semana.inicio, lt: semana.fin },
        },
        select: { fechaInicio: true },
      }),
      // Ingresos = turnos efectivamente dados, valuados por precio de servicio
      // (todos los métodos de pago, no solo MP). Mismo criterio que
      // /estadisticas. Solo Pro: en Free ni se consulta.
      pro
        ? prisma.turno.findMany({
            where: {
              profesionalId: profesional.id,
              // Excluye cancelados y pendientes de pago.
              estado: { in: ["CONFIRMADO", "COMPLETADO"] },
              fechaInicio: { gte: inicio60 },
            },
            select: {
              fechaInicio: true,
              servicio: { select: { precio: true } },
            },
          })
        : Promise.resolve(
            [] as { fechaInicio: Date; servicio: { precio: Decimal } }[],
          ),
      prisma.turno.findMany({
        where: {
          profesionalId: profesional.id,
          estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO", "COMPLETADO"] },
          fechaInicio: { gte: ahora, lt: fin7Dias },
        },
        orderBy: { fechaInicio: "asc" },
        select: {
          id: true,
          fechaInicio: true,
          clienteNombre: true,
          clienteTelefono: true,
          estado: true,
          mpPaymentId: true,
          servicioId: true,
          servicio: {
            select: { nombre: true, duracionMinutos: true },
          },
        },
      }),
      prisma.servicio.findMany({
        where: { profesionalId: profesional.id, activo: true },
        orderBy: { nombre: "asc" },
        select: { id: true, nombre: true },
      }),
    ]);

  // Bucketear ingresos por día y por mes (en la TZ del profesional).
  const porDia = new Map<string, Decimal>();
  const porMes = new Map<string, Decimal>();
  for (const t of turnosIngresos60) {
    const dia = formatInTimeZone(t.fechaInicio, tz, "yyyy-MM-dd");
    const mesKey = formatInTimeZone(t.fechaInicio, tz, "yyyy-MM");
    const precio = new Decimal(t.servicio.precio.toString());
    porDia.set(dia, (porDia.get(dia) ?? new Decimal(0)).plus(precio));
    porMes.set(mesKey, (porMes.get(mesKey) ?? new Decimal(0)).plus(precio));
  }

  const mesActualKey = formatInTimeZone(ahora, tz, "yyyy-MM");
  const [ya, ma] = mesActualKey.split("-").map(Number);
  const prevY = ma === 1 ? ya - 1 : ya;
  const prevM = ma === 1 ? 12 : ma - 1;
  const mesPrevKey = `${prevY}-${String(prevM).padStart(2, "0")}`;

  const ingresosMes = porMes.get(mesActualKey) ?? new Decimal(0);
  const ingresosMesPrev = porMes.get(mesPrevKey) ?? new Decimal(0);

  const ingresosMesStr = formatoARS.format(Number(ingresosMes.toString()));
  let deltaPct: number | null = null;
  if (!ingresosMesPrev.isZero()) {
    deltaPct = ingresosMes
      .minus(ingresosMesPrev)
      .div(ingresosMesPrev)
      .times(100)
      .toNumber();
  }

  // Serie 30 días, hacia atrás desde hoy, en TZ del profesional.
  const serie30: DiaIngreso[] = [];
  for (let i = 29; i >= 0; i--) {
    const fecha = addDays(ahora, -i);
    const dia = formatInTimeZone(fecha, tz, "yyyy-MM-dd");
    serie30.push({
      dia,
      etiqueta: formatInTimeZone(fecha, tz, "d MMM", { locale: es }),
      ingresos: Number((porDia.get(dia) ?? new Decimal(0)).toString()),
    });
  }

  // Conteo de turnos por día de la semana (para el calendario).
  const turnosPorDia = new Map<string, number>();
  for (const t of turnosSemana) {
    const k = formatInTimeZone(t.fechaInicio, tz, "yyyy-MM-dd");
    turnosPorDia.set(k, (turnosPorDia.get(k) ?? 0) + 1);
  }

  // Próximo turno formateado.
  const proximoFmt = proximo ? formatearProximo(proximo.fechaInicio, tz, ahora) : null;

  // Lista de turnos para la agenda (próximos 7 días), serializada para el
  // componente cliente. Etiquetas pre-formateadas en TZ del profesional.
  const diaHoyKey = formatInTimeZone(ahora, tz, "yyyy-MM-dd");
  const diaManianaKey = formatInTimeZone(
    addDays(ahora, 1),
    tz,
    "yyyy-MM-dd",
  );
  const agendaTurnosFmt: AgendaTurno[] = agendaTurnos.map((t) => {
    const diaKey = formatInTimeZone(t.fechaInicio, tz, "yyyy-MM-dd");
    let etiquetaDia: string;
    if (diaKey === diaHoyKey) etiquetaDia = "Hoy";
    else if (diaKey === diaManianaKey) etiquetaDia = "Mañana";
    else
      etiquetaDia = formatInTimeZone(
        t.fechaInicio,
        tz,
        "EEEE d 'de' MMMM",
        { locale: es },
      );
    return {
      id: t.id,
      fechaInicioISO: t.fechaInicio.toISOString(),
      diaKey,
      etiquetaDia,
      hora: formatInTimeZone(t.fechaInicio, tz, "HH:mm"),
      duracionMinutos: t.servicio.duracionMinutos,
      clienteNombre: t.clienteNombre,
      clienteTelefono: t.clienteTelefono,
      servicioId: t.servicioId,
      servicioNombre: t.servicio.nombre,
      estado: t.estado as AgendaTurno["estado"],
      pagado: t.mpPaymentId !== null,
    };
  });
  const opcionesServicio: AgendaServicioOpcion[] = serviciosOpcion;

  const rangoSemana = `${formatInTimeZone(
    semana.dias[0],
    tz,
    "d 'de' MMM",
    { locale: es },
  )} — ${formatInTimeZone(semana.dias[6], tz, "d 'de' MMM", { locale: es })}`;
  const fechaHoyStr = format(ahora, "EEEE d 'de' MMMM", { locale: es });
  const primerNombre = profesional.nombre.split(" ")[0];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const urlCompletoPublico = `${baseUrl}/p/${profesional.slug}`;
  const urlVisiblePublico = urlCompletoPublico.replace(/^https?:\/\//, "");

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Hola, {primerNombre}
        </h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          {fechaHoyStr}
        </p>
      </header>

      <div className={cn("grid gap-6", pro && "md:grid-cols-2")}>
        <ProximoTurnoTile
          turno={proximo}
          fmt={proximoFmt}
        />
        {pro ? (
          <IngresosTile
            valor={ingresosMesStr}
            deltaPct={deltaPct}
            prevHadData={!ingresosMesPrev.isZero()}
          />
        ) : null}
      </div>

      <section className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Próximos turnos
          </h2>
          <span className="text-xs text-muted-foreground">
            7 días por delante
          </span>
        </header>
        <AgendaList turnos={agendaTurnosFmt} servicios={opcionesServicio} />
      </section>

      {pro ? (
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Ingresos · últimos 30 días</h2>
            <span className="text-xs text-muted-foreground">
              Total {formatoARS.format(
                Number(
                  serie30
                    .reduce((s, d) => s + d.ingresos, 0)
                    .toFixed(0),
                ),
              )}
            </span>
          </div>
          <div className="p-3">
            <IncomeChart data={serie30} />
          </div>
        </div>
      ) : null}

      <ShareLinkCard
        slug={profesional.slug}
        urlCompleto={urlCompletoPublico}
        urlVisible={urlVisiblePublico}
      />

      <WeekCalendar
        tz={tz}
        dias={semana.dias}
        turnosPorDia={turnosPorDia}
        rangoSemana={rangoSemana}
        hoyInicio={hoy.inicio}
      />
    </section>
  );
}

function formatearProximo(
  fechaInicio: Date,
  tz: string,
  ahora: Date,
): { etiqueta: string; relativo: string | null } {
  const diaTurno = formatInTimeZone(fechaInicio, tz, "yyyy-MM-dd");
  const diaHoy = formatInTimeZone(ahora, tz, "yyyy-MM-dd");
  const diaManiana = formatInTimeZone(
    new Date(ahora.getTime() + 24 * 60 * 60 * 1000),
    tz,
    "yyyy-MM-dd",
  );
  const hora = formatInTimeZone(fechaInicio, tz, "HH:mm");

  let etiqueta: string;
  if (diaTurno === diaHoy) etiqueta = `Hoy · ${hora}`;
  else if (diaTurno === diaManiana) etiqueta = `Mañana · ${hora}`;
  else
    etiqueta = formatInTimeZone(fechaInicio, tz, "EEE d MMM · HH:mm", {
      locale: es,
    });

  const minutos = differenceInMinutes(fechaInicio, ahora);
  let relativo: string | null = null;
  if (minutos < 60) relativo = `en ${minutos} min`;
  else if (minutos < 60 * 24) relativo = `en ${Math.round(minutos / 60)} h`;

  return { etiqueta, relativo };
}

function ProximoTurnoTile({
  turno,
  fmt,
}: {
  turno: {
    clienteNombre: string;
    servicio: { nombre: string; duracionMinutos: number };
  } | null;
  fmt: { etiqueta: string; relativo: string | null } | null;
}) {
  return (
    <div className="border-l-2 border-secondary pl-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <CalendarClock className="size-3.5" strokeWidth={1.5} />
        Próximo turno
      </div>
      {turno && fmt ? (
        <>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {turno.clienteNombre}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {turno.servicio.nombre} · {turno.servicio.duracionMinutos} min
          </p>
          <p className="mt-3 text-sm">
            <span className="font-medium">{fmt.etiqueta}</span>
            {fmt.relativo ? (
              <span className="ml-2 text-muted-foreground">
                ({fmt.relativo})
              </span>
            ) : null}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-muted-foreground">
            Sin turnos próximos
          </p>
          <p className="mt-1 text-sm text-subtle">
            Cuando reciban una reserva, va a aparecer acá.
          </p>
        </>
      )}
    </div>
  );
}

function IngresosTile({
  valor,
  deltaPct,
  prevHadData,
}: {
  valor: string;
  deltaPct: number | null;
  prevHadData: boolean;
}) {
  const subiendo = (deltaPct ?? 0) > 0;
  const bajando = (deltaPct ?? 0) < 0;
  const DeltaIcon = subiendo ? ArrowUpRight : bajando ? ArrowDownRight : Minus;
  const deltaTexto = !prevHadData
    ? "Sin datos del mes anterior"
    : deltaPct === null
      ? null
      : `${subiendo ? "+" : ""}${deltaPct.toFixed(1)}% vs mes anterior`;

  return (
    <div className="border-l-2 border-border pl-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Wallet className="size-3.5" strokeWidth={1.5} />
        Ingresos del mes
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{valor}</p>
      {deltaTexto ? (
        <p
          className={cn(
            "mt-3 flex items-center gap-1 text-sm",
            subiendo
              ? "text-success"
              : bajando
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3.5" strokeWidth={1.5} />
          {deltaTexto}
        </p>
      ) : null}
    </div>
  );
}

function WeekCalendar({
  tz,
  dias,
  turnosPorDia,
  rangoSemana,
  hoyInicio,
}: {
  tz: string;
  dias: Date[];
  turnosPorDia: Map<string, number>;
  rangoSemana: string;
  hoyInicio: Date;
}) {
  const hoyKey = formatInTimeZone(hoyInicio, tz, "yyyy-MM-dd");
  const sinTurnos = turnosPorDia.size === 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium">Semana actual</h2>
        <span className="text-xs text-muted-foreground">{rangoSemana}</span>
      </div>

      <div className="grid grid-cols-7 divide-x divide-border">
        {dias.map((dia) => {
          const k = formatInTimeZone(dia, tz, "yyyy-MM-dd");
          const cantidad = turnosPorDia.get(k) ?? 0;
          const esHoy = k === hoyKey;
          return (
            <div key={k} className="flex h-28 flex-col p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs capitalize text-muted-foreground">
                  {formatInTimeZone(dia, tz, "EEE", { locale: es })}
                </p>
                {esHoy ? (
                  <span className="rounded-full bg-secondary px-1.5 text-[10px] font-medium text-primary-foreground">
                    Hoy
                  </span>
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-0.5 text-lg font-semibold",
                  esHoy ? "text-secondary" : "text-foreground",
                )}
              >
                {formatInTimeZone(dia, tz, "d")}
              </p>
              {cantidad > 0 ? (
                <div className="mt-auto rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                  {cantidad} {cantidad === 1 ? "turno" : "turnos"}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {sinTurnos ? (
        <div className="flex flex-col items-center justify-center gap-1 border-t border-border px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sin turnos esta semana.
          </p>
          <p className="text-xs text-subtle">
            Compartí tu link y empezá a recibir reservas.
          </p>
        </div>
      ) : null}
    </div>
  );
}
