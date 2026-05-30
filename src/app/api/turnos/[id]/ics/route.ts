import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generarICS } from "@/lib/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/turnos/[id]/ics` — descarga del archivo iCalendar del turno.
 *
 * Endpoint público: el `id` (cuid) actúa como token. Cualquiera con el link
 * puede descargar — mismo modelo de seguridad que un link de Google Calendar.
 * No expone datos sensibles más allá de nombre del cliente, servicio,
 * profesional y horario.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const turno = await prisma.turno.findUnique({
    where: { id },
    select: {
      id: true,
      clienteNombre: true,
      fechaInicio: true,
      fechaFin: true,
      estado: true,
      servicio: { select: { nombre: true } },
      profesional: { select: { nombre: true } },
    },
  });
  if (!turno || turno.estado === "CANCELADO") {
    return new Response("Turno no encontrado.", { status: 404 });
  }

  const ics = generarICS({
    id: turno.id,
    clienteNombre: turno.clienteNombre,
    fechaInicio: turno.fechaInicio,
    fechaFin: turno.fechaFin,
    servicio: { nombre: turno.servicio.nombre },
    profesional: { nombre: turno.profesional.nombre },
  });

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="turno-${turno.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
