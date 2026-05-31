import { NextResponse, type NextRequest } from "next/server";
import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { generateAvailableSlots } from "@/lib/booking/slots";
import { reservaSchema } from "@/lib/booking/validate";
import { crearPreferenceTurno } from "@/lib/mercadopago/payments";
import { sendConfirmacionReserva } from "@/lib/resend/emails";

/**
 * `POST /api/reservas` — crea un turno desde la página pública.
 *
 * Valida el cuerpo, reverifica que el slot siga disponible y crea el `Turno`
 * dentro de una transacción que vuelve a chequear solapamientos (guarda
 * contra reservas concurrentes del mismo horario).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = reservaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }
  const { profesionalSlug, servicioId, fechaInicio, cliente } = parsed.data;

  const profesional = await prisma.profesional.findUnique({
    where: { slug: profesionalSlug },
    select: {
      id: true,
      nombre: true,
      slug: true,
      timezone: true,
      mpAccessToken: true,
    },
  });
  if (!profesional) {
    return NextResponse.json(
      { error: "Profesional no encontrado." },
      { status: 404 },
    );
  }

  const servicio = await prisma.servicio.findFirst({
    where: { id: servicioId, profesionalId: profesional.id, activo: true },
    select: {
      id: true,
      nombre: true,
      precio: true,
      moneda: true,
      duracionMinutos: true,
      requierePago: true,
      metodoPago: true,
    },
  });
  if (!servicio) {
    return NextResponse.json(
      { error: "Servicio no encontrado." },
      { status: 404 },
    );
  }

  const inicio = new Date(fechaInicio);
  if (inicio.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "El horario elegido ya pasó. Elegí otro." },
      { status: 400 },
    );
  }
  const fin = addMinutes(inicio, servicio.duracionMinutos);

  // El slot debe seguir siendo válido (dentro de horarios, sin bloqueos).
  const fecha = formatInTimeZone(inicio, profesional.timezone, "yyyy-MM-dd");
  const disponibles = await generateAvailableSlots(
    profesional.id,
    profesional.timezone,
    fecha,
    servicio,
  );
  if (!disponibles.some((s) => s.inicioISO === inicio.toISOString())) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible. Elegí otro." },
      { status: 409 },
    );
  }

  // Creación con guarda de concurrencia: si aparece un turno solapado entre
  // la verificación y el insert, la transacción devuelve null → 409.
  const turno = await prisma.$transaction(async (tx) => {
    const solapado = await tx.turno.findFirst({
      where: {
        profesionalId: profesional.id,
        estado: { not: "CANCELADO" },
        fechaInicio: { lt: fin },
        fechaFin: { gt: inicio },
      },
      select: { id: true },
    });
    if (solapado) return null;

    return tx.turno.create({
      data: {
        profesionalId: profesional.id,
        servicioId: servicio.id,
        clienteNombre: cliente.nombre,
        clienteTelefono: cliente.telefono,
        clienteEmail: cliente.email === "" ? null : cliente.email,
        fechaInicio: inicio,
        fechaFin: fin,
        estado: servicio.requierePago ? "PENDIENTE_PAGO" : "CONFIRMADO",
        notas: cliente.notas === "" ? null : cliente.notas,
      },
      select: { id: true },
    });
  });

  if (!turno) {
    return NextResponse.json(
      { error: "Ese horario ya fue reservado. Elegí otro." },
      { status: 409 },
    );
  }

  // Flujo de pago según `metodoPago` del servicio:
  // - MERCADOPAGO: crea preferencia y persiste `mpPreferenceId` + `mpInitPoint`
  //   en el Turno. La confirmación monta el Wallet Brick con esos datos.
  //   El turno queda PENDIENTE_PAGO; lo confirma el webhook al aprobar el pago.
  // - TRANSFERENCIA: turno queda PENDIENTE_PAGO; la confirmación muestra
  //   los datos bancarios del profesional.
  // - EFECTIVO / SIN_PAGO: el turno ya quedó CONFIRMADO en el INSERT.
  let checkoutUrl: string | null = null;
  if (
    servicio.requierePago &&
    servicio.metodoPago === "MERCADOPAGO" &&
    profesional.mpAccessToken
  ) {
    try {
      const { initPoint, preferenceId } = await crearPreferenceTurno(
        {
          id: turno.id,
          profesionalSlug,
          servicioNombre: servicio.nombre,
          precio: servicio.precio.toString(),
          moneda: servicio.moneda,
          clienteEmail: cliente.email === "" ? null : cliente.email,
        },
        profesional.mpAccessToken,
      );
      checkoutUrl = initPoint || null;
      await prisma.turno.update({
        where: { id: turno.id },
        data: {
          mpPreferenceId: preferenceId || null,
          mpInitPoint: initPoint || null,
        },
      });
    } catch (err) {
      console.error("Error al crear la preferencia de Mercado Pago:", err);
    }
  }

  // Email de confirmación: sólo si el turno quedó en CONFIRMADO (no si
  // requiere pago — en ese caso lo manda el webhook MP cuando aprueba el
  // pago). Best-effort: si Resend falla no abortamos la reserva.
  const emailCliente = cliente.email === "" ? null : cliente.email;
  if (!servicio.requierePago && emailCliente) {
    try {
      await sendConfirmacionReserva({
        clienteNombre: cliente.nombre,
        clienteEmail: emailCliente,
        fechaInicio: inicio,
        servicio: { nombre: servicio.nombre },
        profesional: {
          nombre: profesional.nombre,
          timezone: profesional.timezone,
          slug: profesional.slug,
        },
        turnoId: turno.id,
      });
    } catch (err) {
      console.error(
        `[reservas] email a ${emailCliente} falló`,
        err,
      );
    }
  }

  return NextResponse.json(
    {
      turnoId: turno.id,
      requierePago: servicio.requierePago,
      metodoPago: servicio.metodoPago,
      checkoutUrl,
    },
    { status: 201 },
  );
}
