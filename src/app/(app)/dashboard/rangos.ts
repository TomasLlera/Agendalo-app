import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * Rangos hoy/semana/mes en la timezone del profesional, devueltos como `Date`
 * UTC listos para usar en queries Prisma (`gte`/`lt`). La semana arranca el
 * lunes (convención AR).
 */
export type RangosFecha = {
  hoy: { inicio: Date; fin: Date };
  semana: { inicio: Date; fin: Date; dias: Date[] };
  mes: { inicio: Date; fin: Date };
};

export function rangosFecha(tz: string, ahora: Date = new Date()): RangosFecha {
  const hoyStr = formatInTimeZone(ahora, tz, "yyyy-MM-dd");
  const inicioHoy = fromZonedTime(`${hoyStr}T00:00:00`, tz);
  const finHoy = addDays(inicioHoy, 1);

  // ISO weekday en la TZ del profesional: 1=lunes ... 7=domingo.
  const dow = Number(formatInTimeZone(ahora, tz, "i"));
  const inicioSemana = addDays(inicioHoy, -(dow - 1));
  const finSemana = addDays(inicioSemana, 7);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i));

  const yearMonth = formatInTimeZone(ahora, tz, "yyyy-MM");
  const inicioMes = fromZonedTime(`${yearMonth}-01T00:00:00`, tz);
  const [y, m] = yearMonth.split("-").map(Number);
  const siguienteAnio = m === 12 ? y + 1 : y;
  const siguienteMes = m === 12 ? 1 : m + 1;
  const finMes = fromZonedTime(
    `${siguienteAnio}-${String(siguienteMes).padStart(2, "0")}-01T00:00:00`,
    tz,
  );

  return {
    hoy: { inicio: inicioHoy, fin: finHoy },
    semana: { inicio: inicioSemana, fin: finSemana, dias },
    mes: { inicio: inicioMes, fin: finMes },
  };
}
