import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import {
  generateAvailableSlots,
  miembrosDeServicio,
} from "@/lib/booking/slots";
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
  const { profesionalSlug, servicioId, miembroId, fechaInicio, cliente } =
    parsed.data;

  const profesional = await prisma.profesional.findUnique({
    where: { slug: profesionalSlug },
    select: {
      id: true,
      nombre: true,
      slug: true,
      timezone: true,
      mpAccessToken: true,
      plan: true,
      planExpiresAt: true,
      email: true,
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

  // Miembros del equipo que prestan este servicio. Vacío = sin equipo
  // asignado → modo cuenta (capacidad 1, comportamiento monopersona).
  const linked = await miembrosDeServicio(profesional.id, servicio.id);
  const modoEquipo = linked.length > 0;

  if (miembroId && !linked.includes(miembroId)) {
    return NextResponse.json(
      { error: "El profesional elegido no atiende este servicio." },
      { status: 400 },
    );
  }
  // En modo cuenta no se asigna miembro; en modo equipo, `miembroId` puede
  // venir nulo ("cualquiera"): lo resuelve la transacción más abajo.
  const candidatos = modoEquipo
    ? miembroId
      ? [miembroId]
      : linked
    : null;

  // El slot debe seguir siendo válido (dentro de horarios, sin bloqueos y con
  // al menos un miembro libre si hay equipo).
  const fecha = formatInTimeZone(inicio, profesional.timezone, "yyyy-MM-dd");
  const disponibles = await generateAvailableSlots(
    profesional.id,
    profesional.timezone,
    fecha,
    servicio,
    { miembroId },
  );
  if (!disponibles.some((s) => s.inicioISO === inicio.toISOString())) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible. Elegí otro." },
      { status: 409 },
    );
  }

  // Token público para el link de cancelación en el email. 16 bytes = 32 hex
  // chars: espacio de búsqueda inabarcable por fuerza bruta y único por turno.
  const cancelToken = randomBytes(16).toString("hex");

  // Cobrar con Mercado Pago es exclusivo de Pro. Si un servicio quedó marcado
  // como MERCADOPAGO pero el profesional es Free, no hay forma de cobrar online
  // → el turno se confirma directo en vez de quedar trabado en PENDIENTE_PAGO.
  const esPro = isPro(profesional);
  const mpBloqueadoFree =
    servicio.requierePago && servicio.metodoPago === "MERCADOPAGO" && !esPro;
  const estadoInicial =
    servicio.requierePago && !mpBloqueadoFree ? "PENDIENTE_PAGO" : "CONFIRMADO";

  // Creación con guarda de concurrencia: si aparece un turno solapado entre
  // la verificación y el insert, la transacción devuelve null → 409.
  //
  // - Modo cuenta (`candidatos === null`): cualquier turno solapado bloquea.
  // - Modo equipo: se busca un miembro candidato sin turno solapado. Si se
  //   pidió uno puntual y está ocupado, o no queda ninguno libre → null.
  const turno = await prisma.$transaction(async (tx) => {
    const solapados = await tx.turno.findMany({
      where: {
        profesionalId: profesional.id,
        estado: { not: "CANCELADO" },
        fechaInicio: { lt: fin },
        fechaFin: { gt: inicio },
      },
      select: { miembroId: true },
    });

    let miembroAsignado: string | null = null;
    if (candidatos === null) {
      if (solapados.length > 0) return null;
    } else {
      const ocupados = new Set(solapados.map((t) => t.miembroId));
      miembroAsignado = candidatos.find((id) => !ocupados.has(id)) ?? null;
      if (!miembroAsignado) return null;
    }

    return tx.turno.create({
      data: {
        profesionalId: profesional.id,
        servicioId: servicio.id,
        miembroId: miembroAsignado,
        clienteNombre: cliente.nombre,
        clienteTelefono: cliente.telefono,
        clienteEmail: cliente.email === "" ? null : cliente.email,
        fechaInicio: inicio,
        fechaFin: fin,
        estado: estadoInicial,
        cancelToken,
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
    profesional.mpAccessToken &&
    esPro
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
  if (estadoInicial === "CONFIRMADO" && emailCliente) {
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
        cancelToken,
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
