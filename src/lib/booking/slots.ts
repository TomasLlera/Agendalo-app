import "server-only";
import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";

export type Slot = {
  /** Instante de inicio del turno en ISO 8601 (UTC). */
  inicioISO: string;
  /** Hora local del profesional para mostrar, formato `HH:mm`. */
  etiqueta: string;
};

/**
 * Genera los horarios disponibles de un profesional para una fecha y servicio.
 *
 * 1. Toma las franjas (`HorarioDisponible`) del día de la semana.
 * 2. Divide cada franja en slots de `duracionMinutos`.
 * 3. Descarta los slots que solapan con turnos no cancelados o bloqueos.
 * 4. Descarta los slots que ya pasaron.
 *
 * `fecha` es `YYYY-MM-DD` interpretada en la zona horaria del profesional.
 */
export async function generateAvailableSlots(
  profesionalId: string,
  timezone: string,
  fecha: string,
  servicio: { duracionMinutos: number },
): Promise<Slot[]> {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return [];

  // Día de la semana (0 = domingo … 6 = sábado) de la fecha pedida.
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia, 12)).getUTCDay();

  const horarios = await prisma.horarioDisponible.findMany({
    where: { profesionalId, diaSemana },
  });
  if (horarios.length === 0) return [];

  const inicioDia = fromZonedTime(`${fecha}T00:00:00`, timezone);
  const finDia = fromZonedTime(`${fecha}T23:59:59.999`, timezone);

  const [turnos, bloqueos] = await Promise.all([
    prisma.turno.findMany({
      where: {
        profesionalId,
        estado: { not: "CANCELADO" },
        fechaInicio: { gte: inicioDia, lte: finDia },
      },
      select: { fechaInicio: true, fechaFin: true },
    }),
    prisma.bloqueo.findMany({
      where: {
        profesionalId,
        fechaInicio: { lte: finDia },
        fechaFin: { gte: inicioDia },
      },
      select: { fechaInicio: true, fechaFin: true },
    }),
  ]);

  const ahora = new Date();
  const dur = servicio.duracionMinutos;
  const slots: Slot[] = [];

  for (const h of horarios) {
    const finFranja = fromZonedTime(`${fecha}T${h.horaFin}:00`, timezone);
    for (
      let cursor = fromZonedTime(`${fecha}T${h.horaInicio}:00`, timezone);
      addMinutes(cursor, dur) <= finFranja;
      cursor = addMinutes(cursor, dur)
    ) {
      const slotFin = addMinutes(cursor, dur);
      if (cursor <= ahora) continue;

      const solapa = (otroIni: Date, otroFin: Date) =>
        cursor < otroFin && slotFin > otroIni;
      const ocupado =
        turnos.some((t) => solapa(t.fechaInicio, t.fechaFin)) ||
        bloqueos.some((b) => solapa(b.fechaInicio, b.fechaFin));

      if (!ocupado) {
        slots.push({
          inicioISO: cursor.toISOString(),
          etiqueta: formatInTimeZone(cursor, timezone, "HH:mm"),
        });
      }
    }
  }

  slots.sort((a, b) => a.inicioISO.localeCompare(b.inicioISO));
  return slots;
}
