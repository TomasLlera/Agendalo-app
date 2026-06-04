import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * `GET /api/turnos/[id]/estado`
 * Devuelve sólo el estado del turno. Lo usa la página de confirmación para
 * detectar cuándo Mercado Pago confirma el pago (vía webhook) y refrescar a
 * la pantalla de éxito sin que el cliente recargue a mano.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const turno = await prisma.turno.findUnique({
    where: { id },
    select: { estado: true },
  });
  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ estado: turno.estado });
}
