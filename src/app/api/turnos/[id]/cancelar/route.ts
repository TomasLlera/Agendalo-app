import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { sendCancelacionTurno } from "@/lib/resend/emails";

export const runtime = "nodejs";

/**
 * `POST /api/turnos/[id]/cancelar` — cancelación pública por token.
 *
 * El cliente llega acá desde el link del email de confirmación. Sin login: el
 * `cancelToken` (32 hex chars) del body funciona como prueba de posesión del
 * link. Mismatch o turno inexistente devuelven 404 genérico para no filtrar
 * existencia de turnos a terceros.
 *
 * Idempotente / safe: si el turno ya estaba cancelado o ya pasó, devolvemos
 * un estado claro y NO mandamos email de cancelación de nuevo.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as
    | { token?: unknown }
    | null;
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  const turno = await prisma.turno.findUnique({
    where: { id },
    select: {
      id: true,
      cancelToken: true,
      estado: true,
      fechaInicio: true,
      clienteNombre: true,
      clienteEmail: true,
      servicio: { select: { nombre: true } },
      profesional: {
        select: { nombre: true, timezone: true, slug: true },
      },
    },
  });

  // 404 genérico ante token mismatch o turno inexistente (no filtrar).
  if (!turno || !turno.cancelToken || turno.cancelToken !== token) {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  if (turno.estado === "CANCELADO") {
    return NextResponse.json(
      { error: "Este turno ya estaba cancelado." },
      { status: 409 },
    );
  }

  if (turno.fechaInicio.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Este turno ya pasó, no se puede cancelar." },
      { status: 409 },
    );
  }

  // updateMany con guarda en el `estado` actual: evita race conditions si el
  // profe canceló desde el dashboard en paralelo. Si count=0, alguien ganó
  // la carrera — tratamos como "ya cancelado".
  const { count } = await prisma.turno.updateMany({
    where: {
      id: turno.id,
      estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] },
    },
    data: { estado: "CANCELADO" },
  });

  if (count === 0) {
    return NextResponse.json(
      { error: "Este turno ya estaba cancelado." },
      { status: 409 },
    );
  }

  if (turno.clienteEmail) {
    try {
      await sendCancelacionTurno({
        clienteNombre: turno.clienteNombre,
        clienteEmail: turno.clienteEmail,
        fechaInicio: turno.fechaInicio,
        servicio: { nombre: turno.servicio.nombre },
        profesional: {
          nombre: turno.profesional.nombre,
          timezone: turno.profesional.timezone,
          slug: turno.profesional.slug,
        },
      });
    } catch (err) {
      console.error(
        `[api/turnos/cancelar] email a ${turno.clienteEmail} falló`,
        err,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
