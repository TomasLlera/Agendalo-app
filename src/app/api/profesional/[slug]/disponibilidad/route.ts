import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getDiasConDisponibilidad } from "@/lib/booking/slots";

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Tope de días para evitar rangos abusivos. */
const MAX_DIAS = 60;

/**
 * `GET /api/profesional/[slug]/disponibilidad?desde=YYYY-MM-DD&dias=21&servicioId=...`
 * Devuelve las fechas del rango que tienen al menos un horario disponible,
 * para atenuar en el calendario los días sin cupo.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const desde = req.nextUrl.searchParams.get("desde");
  const servicioId = req.nextUrl.searchParams.get("servicioId");
  const miembroId = req.nextUrl.searchParams.get("miembroId");
  const dias = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("dias")) || 0, 1),
    MAX_DIAS,
  );

  if (!desde || !servicioId || !FECHA_RE.test(desde)) {
    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
  }

  const profesional = await prisma.profesional.findUnique({
    where: { slug },
    select: { id: true, timezone: true },
  });
  if (!profesional) {
    return NextResponse.json(
      { error: "Profesional no encontrado." },
      { status: 404 },
    );
  }

  const servicio = await prisma.servicio.findFirst({
    where: { id: servicioId, profesionalId: profesional.id, activo: true },
    select: { id: true, duracionMinutos: true },
  });
  if (!servicio) {
    return NextResponse.json(
      { error: "Servicio no encontrado." },
      { status: 404 },
    );
  }

  const dispon = await getDiasConDisponibilidad(
    profesional.id,
    profesional.timezone,
    desde,
    dias,
    servicio,
    { miembroId },
  );
  return NextResponse.json({ dias: dispon });
}
