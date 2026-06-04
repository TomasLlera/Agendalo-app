import "server-only";
import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";

export type Slot = {
  /** Instante de inicio del turno en ISO 8601 (UTC). */
  inicioISO: string;
  /** Hora local del profesional para mostrar, formato `HH:mm`. */
  etiqueta: string;
  /** Hora local de fin del turno para mostrar, formato `HH:mm`. */
  finEtiqueta: string;
};

type Horario = { diaSemana: number; horaInicio: string; horaFin: string };
type Ocupacion = { fechaInicio: Date; fechaFin: Date };
type TurnoOcupado = {
  fechaInicio: Date;
  fechaFin: Date;
  miembroId: string | null;
};

/** Opciones de cálculo de disponibilidad. */
type SlotsOptions = {
  /** Si se pasa, sólo cuenta la disponibilidad de ese miembro. */
  miembroId?: string | null;
};

/**
 * Ids de los miembros activos que prestan el servicio. Si está vacío, el
 * servicio no tiene equipo asignado y la disponibilidad se calcula a nivel
 * cuenta (capacidad 1, comportamiento clásico monopersona).
 */
export async function miembrosDeServicio(
  profesionalId: string,
  servicioId: string,
): Promise<string[]> {
  const miembros = await prisma.miembro.findMany({
    where: {
      profesionalId,
      activo: true,
      servicios: { some: { servicioId } },
    },
    select: { id: true },
  });
  return miembros.map((m) => m.id);
}

/**
 * Resuelve qué miembros se consideran al calcular la disponibilidad:
 * - `null`  → no hay equipo asignado al servicio: modo cuenta (capacidad 1).
 * - `[]`    → el miembro pedido no presta el servicio: sin disponibilidad.
 * - lista   → ids de miembros candidatos (uno si se pidió uno puntual).
 */
function resolverCandidatos(
  linked: string[],
  miembroId: string | null | undefined,
): string[] | null {
  if (linked.length === 0) return null;
  if (miembroId) return linked.includes(miembroId) ? [miembroId] : [];
  return linked;
}

/**
 * Construye los slots libres de un día a partir de datos ya cargados.
 *
 * `miembrosCandidatos`:
 * - `null`: capacidad 1 a nivel cuenta — el slot está libre si ningún turno
 *   lo solapa (comportamiento clásico).
 * - lista de ids: el slot está libre si al menos uno de esos miembros no
 *   tiene un turno solapado (capacidad = cantidad de miembros libres).
 *
 * Pura y sin acceso a la base.
 */
function construirSlotsDelDia(
  fecha: string,
  timezone: string,
  horariosDelDia: Horario[],
  turnos: TurnoOcupado[],
  bloqueos: Ocupacion[],
  dur: number,
  ahora: Date,
  miembrosCandidatos: string[] | null,
): Slot[] {
  const slots: Slot[] = [];
  for (const h of horariosDelDia) {
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

      // Un bloqueo (a nivel cuenta) cierra el slot para todos.
      if (bloqueos.some((b) => solapa(b.fechaInicio, b.fechaFin))) continue;

      const libre =
        miembrosCandidatos === null
          ? !turnos.some((t) => solapa(t.fechaInicio, t.fechaFin))
          : miembrosCandidatos.some(
              (mid) =>
                !turnos.some(
                  (t) =>
                    t.miembroId === mid && solapa(t.fechaInicio, t.fechaFin),
                ),
            );

      if (libre) {
        slots.push({
          inicioISO: cursor.toISOString(),
          etiqueta: formatInTimeZone(cursor, timezone, "HH:mm"),
          finEtiqueta: formatInTimeZone(slotFin, timezone, "HH:mm"),
        });
      }
    }
  }
  return slots;
}

/**
 * Genera los horarios disponibles de un profesional para una fecha y servicio.
 *
 * 1. Toma las franjas (`HorarioDisponible`) del día de la semana.
 * 2. Divide cada franja en slots de `duracionMinutos`.
 * 3. Descarta los slots según la capacidad del equipo (ver
 *    `construirSlotsDelDia`) y los bloqueos.
 * 4. Descarta los slots que ya pasaron.
 *
 * `fecha` es `YYYY-MM-DD` interpretada en la zona horaria del profesional.
 */
export async function generateAvailableSlots(
  profesionalId: string,
  timezone: string,
  fecha: string,
  servicio: { id: string; duracionMinutos: number },
  opts: SlotsOptions = {},
): Promise<Slot[]> {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return [];

  // Día de la semana (0 = domingo … 6 = sábado) de la fecha pedida.
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia, 12)).getUTCDay();

  const [horarios, linked] = await Promise.all([
    prisma.horarioDisponible.findMany({ where: { profesionalId, diaSemana } }),
    miembrosDeServicio(profesionalId, servicio.id),
  ]);
  if (horarios.length === 0) return [];

  const candidatos = resolverCandidatos(linked, opts.miembroId);
  if (candidatos !== null && candidatos.length === 0) return [];

  const inicioDia = fromZonedTime(`${fecha}T00:00:00`, timezone);
  const finDia = fromZonedTime(`${fecha}T23:59:59.999`, timezone);

  const [turnos, bloqueos] = await Promise.all([
    prisma.turno.findMany({
      where: {
        profesionalId,
        estado: { not: "CANCELADO" },
        fechaInicio: { gte: inicioDia, lte: finDia },
      },
      select: { fechaInicio: true, fechaFin: true, miembroId: true },
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

  const slots = construirSlotsDelDia(
    fecha,
    timezone,
    horarios,
    turnos,
    bloqueos,
    servicio.duracionMinutos,
    new Date(),
    candidatos,
  );

  slots.sort((a, b) => a.inicioISO.localeCompare(b.inicioISO));
  return slots;
}

/**
 * Suma `cantidad` días de calendario a una fecha `YYYY-MM-DD` y la devuelve
 * en el mismo formato. Usa aritmética UTC para no depender de la zona local.
 */
function sumarDias(fecha: string, cantidad: number): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia + cantidad, 12));
  return formatInTimeZone(d, "UTC", "yyyy-MM-dd");
}

/**
 * Dado un rango de `dias` a partir de `desde` (`YYYY-MM-DD`), devuelve el
 * conjunto de fechas que tienen al menos un horario disponible para el
 * servicio. Carga horarios, turnos y bloqueos una sola vez para todo el rango.
 */
export async function getDiasConDisponibilidad(
  profesionalId: string,
  timezone: string,
  desde: string,
  dias: number,
  servicio: { id: string; duracionMinutos: number },
  opts: SlotsOptions = {},
): Promise<string[]> {
  const fechas = Array.from({ length: dias }, (_, i) => sumarDias(desde, i));
  if (fechas.length === 0) return [];

  const [horarios, linked] = await Promise.all([
    prisma.horarioDisponible.findMany({ where: { profesionalId } }),
    miembrosDeServicio(profesionalId, servicio.id),
  ]);
  if (horarios.length === 0) return [];

  const candidatos = resolverCandidatos(linked, opts.miembroId);
  if (candidatos !== null && candidatos.length === 0) return [];

  const inicioRango = fromZonedTime(`${desde}T00:00:00`, timezone);
  const finRango = fromZonedTime(
    `${fechas[fechas.length - 1]}T23:59:59.999`,
    timezone,
  );

  const [turnos, bloqueos] = await Promise.all([
    prisma.turno.findMany({
      where: {
        profesionalId,
        estado: { not: "CANCELADO" },
        fechaInicio: { gte: inicioRango, lte: finRango },
      },
      select: { fechaInicio: true, fechaFin: true, miembroId: true },
    }),
    prisma.bloqueo.findMany({
      where: {
        profesionalId,
        fechaInicio: { lte: finRango },
        fechaFin: { gte: inicioRango },
      },
      select: { fechaInicio: true, fechaFin: true },
    }),
  ]);

  const ahora = new Date();
  const disponibles: string[] = [];
  for (const fecha of fechas) {
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const diaSemana = new Date(Date.UTC(anio, mes - 1, dia, 12)).getUTCDay();
    const horariosDelDia = horarios.filter((h) => h.diaSemana === diaSemana);
    if (horariosDelDia.length === 0) continue;

    const slots = construirSlotsDelDia(
      fecha,
      timezone,
      horariosDelDia,
      turnos,
      bloqueos,
      servicio.duracionMinutos,
      ahora,
      candidatos,
    );
    if (slots.length > 0) disponibles.push(fecha);
  }
  return disponibles;
}
