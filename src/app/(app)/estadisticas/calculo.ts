import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import Decimal from "decimal.js";

/**
 * Cantidad de meses de historia que muestra la comparativa mensual.
 */
export const MESES_HISTORIA = 12;

/**
 * Turno mínimo necesario para los cálculos contables. `precio` llega como el
 * `Decimal` de Prisma (o cualquier cosa con `toString()`), y se valúa la venta
 * por el precio del servicio, sin importar el método de pago.
 */
export type TurnoCalc = {
  fechaInicio: Date;
  servicioId: string;
  servicio: { nombre: string; precio: { toString(): string } };
  miembroId: string | null;
  miembro: { nombre: string } | null;
};

export type PuntoMes = {
  mesKey: string;
  etiqueta: string;
  ingresos: number;
  turnos: number;
};

export type FilaServicio = {
  servicioId: string;
  nombre: string;
  turnos: number;
  ingresos: number;
};

export type FilaMiembro = {
  miembroId: string;
  nombre: string;
  turnos: number;
  ingresos: number;
};

export type PuntoDiaSemana = {
  dow: number; // 1=lunes ... 7=domingo
  etiqueta: string;
  turnos: number;
  ingresos: number;
  esMenor: boolean;
};

export type PuntoDia = {
  dia: string; // yyyy-MM-dd
  etiqueta: string; // "d"
  ingresos: number;
  turnos: number;
};

export type Kpis = {
  ingresosMes: number;
  turnosMes: number;
  ticketPromedio: number;
  ingresosDeltaPct: number | null;
  turnosDeltaPct: number | null;
  prevTuvoDatos: boolean;
};

export type Estadisticas = {
  kpis: Kpis;
  porMes: PuntoMes[];
  porServicio: FilaServicio[];
  porMiembro: FilaMiembro[];
  porDiaSemana: PuntoDiaSemana[];
  detalleDiario: PuntoDia[];
  etiquetaMesActual: string;
  hayDatos: boolean;
};

const num = (d: Decimal): number => Number(d.toFixed(2));

function pctDelta(actual: Decimal, prev: Decimal): number | null {
  if (prev.isZero()) return null;
  return actual.minus(prev).div(prev).times(100).toNumber();
}

/** Construye las claves yyyy-MM de los últimos `n` meses, de más viejo a actual. */
function clavesMeses(mesActualKey: string, n: number): string[] {
  const [ya, ma] = mesActualKey.split("-").map(Number);
  const claves: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    // Aritmética entera de meses (evita drift de DST de addMonths).
    const total = ya * 12 + (ma - 1) - i;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    claves.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return claves;
}

/**
 * Agrega los turnos (ya filtrados a CONFIRMADO/COMPLETADO) en el view-model
 * contable: KPIs del mes, serie mensual, desglose por servicio, día de la
 * semana y detalle diario. Todo bucketeado en la timezone del profesional.
 *
 * - Serie mensual y día de semana: ventana completa de `MESES_HISTORIA`.
 * - KPIs y desglose por servicio: mes actual (vs mes anterior para los deltas).
 * - Detalle diario: mes actual.
 * - Día de la semana: solo turnos ya realizados (fechaInicio <= ahora), para
 *   reflejar ventas reales y no expectativas a futuro.
 */
export function calcularEstadisticas(
  turnos: TurnoCalc[],
  tz: string,
  ahora: Date,
): Estadisticas {
  const mesActualKey = formatInTimeZone(ahora, tz, "yyyy-MM");
  const claves = clavesMeses(mesActualKey, MESES_HISTORIA);
  const mesPrevKey = claves[claves.length - 2];

  // Acumuladores.
  const ingresosPorMes = new Map<string, Decimal>();
  const turnosPorMes = new Map<string, number>();
  const porServicioMap = new Map<string, { nombre: string; turnos: number; ingresos: Decimal }>();
  const porMiembroMap = new Map<string, { nombre: string; turnos: number; ingresos: Decimal }>();
  const ingresosPorDia = new Map<string, Decimal>();
  const turnosPorDia = new Map<string, number>();
  const ingresosPorDow = new Map<number, Decimal>();
  const turnosPorDow = new Map<number, number>();

  for (const t of turnos) {
    const precio = new Decimal(t.servicio.precio.toString());
    const mesKey = formatInTimeZone(t.fechaInicio, tz, "yyyy-MM");
    const diaKey = formatInTimeZone(t.fechaInicio, tz, "yyyy-MM-dd");

    ingresosPorMes.set(mesKey, (ingresosPorMes.get(mesKey) ?? new Decimal(0)).plus(precio));
    turnosPorMes.set(mesKey, (turnosPorMes.get(mesKey) ?? 0) + 1);

    ingresosPorDia.set(diaKey, (ingresosPorDia.get(diaKey) ?? new Decimal(0)).plus(precio));
    turnosPorDia.set(diaKey, (turnosPorDia.get(diaKey) ?? 0) + 1);

    // Desglose por servicio: solo mes actual.
    if (mesKey === mesActualKey) {
      const acc = porServicioMap.get(t.servicioId);
      if (acc) {
        acc.turnos += 1;
        acc.ingresos = acc.ingresos.plus(precio);
      } else {
        porServicioMap.set(t.servicioId, {
          nombre: t.servicio.nombre,
          turnos: 1,
          ingresos: precio,
        });
      }

      // Desglose por profesional (mes actual). Turnos sin miembro asignado
      // (servicios sin equipo) se agrupan bajo una clave neutra.
      const mid = t.miembroId ?? "—";
      const accM = porMiembroMap.get(mid);
      if (accM) {
        accM.turnos += 1;
        accM.ingresos = accM.ingresos.plus(precio);
      } else {
        porMiembroMap.set(mid, {
          nombre: t.miembro?.nombre ?? "Sin asignar",
          turnos: 1,
          ingresos: precio,
        });
      }
    }

    // Día de la semana: solo turnos ya realizados.
    if (t.fechaInicio.getTime() <= ahora.getTime()) {
      const dow = Number(formatInTimeZone(t.fechaInicio, tz, "i")); // 1..7
      ingresosPorDow.set(dow, (ingresosPorDow.get(dow) ?? new Decimal(0)).plus(precio));
      turnosPorDow.set(dow, (turnosPorDow.get(dow) ?? 0) + 1);
    }
  }

  // Serie mensual (12 meses, de más viejo a actual).
  const porMes: PuntoMes[] = claves.map((mesKey) => {
    const [y, m] = mesKey.split("-").map(Number);
    return {
      mesKey,
      etiqueta: format(new Date(y, m - 1, 1), "MMM", { locale: es }),
      ingresos: num(ingresosPorMes.get(mesKey) ?? new Decimal(0)),
      turnos: turnosPorMes.get(mesKey) ?? 0,
    };
  });

  // KPIs del mes actual y deltas vs mes anterior.
  const ingresosMes = ingresosPorMes.get(mesActualKey) ?? new Decimal(0);
  const ingresosPrev = ingresosPorMes.get(mesPrevKey) ?? new Decimal(0);
  const turnosMes = turnosPorMes.get(mesActualKey) ?? 0;
  const turnosPrev = turnosPorMes.get(mesPrevKey) ?? 0;
  const ticket = turnosMes > 0 ? ingresosMes.div(turnosMes) : new Decimal(0);

  const kpis: Kpis = {
    ingresosMes: num(ingresosMes),
    turnosMes,
    ticketPromedio: num(ticket),
    ingresosDeltaPct: pctDelta(ingresosMes, ingresosPrev),
    turnosDeltaPct: pctDelta(new Decimal(turnosMes), new Decimal(turnosPrev)),
    prevTuvoDatos: !ingresosPrev.isZero() || turnosPrev > 0,
  };

  // Desglose por servicio (mes actual), ordenado por ingresos desc.
  const porServicio: FilaServicio[] = Array.from(porServicioMap.entries())
    .map(([servicioId, v]) => ({
      servicioId,
      nombre: v.nombre,
      turnos: v.turnos,
      ingresos: num(v.ingresos),
    }))
    .sort((a, b) => b.ingresos - a.ingresos);

  // Desglose por profesional (mes actual), ordenado por turnos desc.
  const porMiembro: FilaMiembro[] = Array.from(porMiembroMap.entries())
    .map(([miembroId, v]) => ({
      miembroId,
      nombre: v.nombre,
      turnos: v.turnos,
      ingresos: num(v.ingresos),
    }))
    .sort((a, b) => b.turnos - a.turnos);

  // Día de la semana (lun..dom). Marca el día con menos ingresos entre los que
  // tuvieron al menos un turno (para destacar el más flojo).
  const dowConDatos = Array.from({ length: 7 }, (_, i) => i + 1).filter(
    (d) => (turnosPorDow.get(d) ?? 0) > 0,
  );
  let dowMenor = -1;
  if (dowConDatos.length > 0) {
    dowMenor = dowConDatos.reduce((min, d) =>
      num(ingresosPorDow.get(d) ?? new Decimal(0)) <
      num(ingresosPorDow.get(min) ?? new Decimal(0))
        ? d
        : min,
    );
  }
  const porDiaSemana: PuntoDiaSemana[] = Array.from({ length: 7 }, (_, i) => {
    const dow = i + 1;
    // Lunes 2024-01-01 fue lunes: armamos una fecha cuyo ISO weekday matchee.
    const ref = new Date(2024, 0, dow); // 2024-01-01 = lunes (dow 1)
    return {
      dow,
      etiqueta: format(ref, "EEE", { locale: es }),
      turnos: turnosPorDow.get(dow) ?? 0,
      ingresos: num(ingresosPorDow.get(dow) ?? new Decimal(0)),
      esMenor: dow === dowMenor,
    };
  });

  // Detalle diario del mes actual.
  const [ya, ma] = mesActualKey.split("-").map(Number);
  const diasEnMes = new Date(ya, ma, 0).getDate();
  const detalleDiario: PuntoDia[] = Array.from({ length: diasEnMes }, (_, i) => {
    const d = i + 1;
    const diaKey = `${mesActualKey}-${String(d).padStart(2, "0")}`;
    return {
      dia: diaKey,
      etiqueta: String(d),
      ingresos: num(ingresosPorDia.get(diaKey) ?? new Decimal(0)),
      turnos: turnosPorDia.get(diaKey) ?? 0,
    };
  });

  return {
    kpis,
    porMes,
    porServicio,
    porMiembro,
    porDiaSemana,
    detalleDiario,
    etiquetaMesActual: format(new Date(ya, ma - 1, 1), "MMMM yyyy", { locale: es }),
    hayDatos: turnos.length > 0,
  };
}
