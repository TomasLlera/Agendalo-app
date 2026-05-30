import "server-only";

export type TurnoICS = {
  id: string;
  clienteNombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  servicio: { nombre: string };
  profesional: { nombre: string };
};

/**
 * Genera un archivo .ics (iCalendar RFC 5545) para un turno.
 *
 * Diseño:
 * - Fechas en UTC (`...Z`), evita el lío de VTIMEZONE inline y todos los
 *   clientes (Google Calendar, Apple Calendar, Outlook) lo interpretan bien.
 * - Líneas separadas con CRLF (`\r\n`) como exige el RFC.
 * - `UID` estable por turno → reimportar el mismo .ics no duplica el evento.
 * - Texto escapado: `,`, `;`, `\` y newlines según el RFC.
 */
export function generarICS(turno: TurnoICS): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const summary = `${turno.servicio.nombre} con ${turno.profesional.nombre}`;
  const description = `Turno reservado a nombre de ${turno.clienteNombre}.`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agendalo//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:turno-${turno.id}@agendalo.app`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(turno.fechaInicio)}`,
    `DTEND:${fmt(turno.fechaFin)}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `ORGANIZER;CN=${escapeICS(turno.profesional.nombre)}:mailto:noreply@agendalo.app`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

/** Escape de texto según RFC 5545 §3.3.11. */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}
