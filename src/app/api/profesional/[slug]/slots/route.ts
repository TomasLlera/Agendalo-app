import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateAvailableSlots } from "@/lib/booking/slots";

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `GET /api/profesional/[slug]/slots?date=YYYY-MM-DD&servicioId=...`
 * Devuelve los horarios disponibles del profesional para esa fecha/servicio.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const date = req.nextUrl.searchParams.get("date");
  const servicioId = req.nextUrl.searchParams.get("servicioId");
  const miembroId = req.nextUrl.searchParams.get("miembroId");

  if (!date || !servicioId || !FECHA_RE.test(date)) {
    return NextResponse.json(
      { error: "Parámetros inválidos." },
      { status: 400 },
    );
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

  const slots = await generateAvailableSlots(
    profesional.id,
    profesional.timezone,
    date,
    servicio,
    { miembroId },
  );
  return NextResponse.json({ slots });
}
