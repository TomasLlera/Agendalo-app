import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { Payment } from "mercadopago";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mpClientProfesional } from "@/lib/mercadopago/client";
import { obtenerPreapproval } from "@/lib/mercadopago/subscriptions";
import { verificarFirmaMP } from "@/lib/mercadopago/webhook";
import { sendConfirmacionReserva } from "@/lib/resend/emails";

// Necesitamos runtime Node (crypto + Prisma).
export const runtime = "nodejs";

type CuerpoWebhookMP = {
  type?: string;
  action?: string;
  data?: { id?: string };
};

/**
 * Webhook de Mercado Pago. Procesa:
 *
 *  - `subscription_preapproval` — alta/baja/pausa de la suscripción Pro.
 *    Actualiza `profesional.plan` y `planExpiresAt`. Usa el token de la app.
 *
 *  - `payment` — pagos de turnos del marketplace. El payment vive en la
 *    cuenta del profesional conectado, así que necesitamos su access token
 *    para leerlo. El turnoId viaja como query param en `notification_url`
 *    (ver `crearPreferenceTurno`), lo que nos permite cargar el turno y
 *    el profesional ANTES del fetch a MP, y validar que el
 *    `payment.external_reference` coincide con el turno (evita cross-account).
 *
 * Idempotencia: insert en `EventoWebhook` con `@@unique([proveedor, externalId])`.
 * Si se repite la entrega, el insert falla con P2002 y devolvemos 200.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook:mp] MP_WEBHOOK_SECRET no configurado");
    return new Response("Webhook no configurado", { status: 500 });
  }

  const h = await headers();
  const xSignature = h.get("x-signature");
  const xRequestId = h.get("x-request-id");
  const dataIdQuery = req.nextUrl.searchParams.get("data.id");
  const turnoIdQuery = req.nextUrl.searchParams.get("turnoId");

  const body = (await req.json().catch(() => null)) as CuerpoWebhookMP | null;
  if (!body) {
    return new Response("Body inválido", { status: 400 });
  }

  const tipo = body.type ?? "";
  const dataId = dataIdQuery ?? body.data?.id ?? null;

  if (
    !verificarFirmaMP({ xSignature, xRequestId, dataId, secret })
  ) {
    return new Response("Firma inválida", { status: 401 });
  }
  if (!dataId) {
    return new Response("Falta data.id", { status: 400 });
  }

  // request-id varía por cada entrega — así reintentos del mismo evento
  // siguen siendo idempotentes pero entregas distintas se procesan.
  const externalId = `${tipo}:${dataId}:${xRequestId ?? ""}`;
  try {
    await prisma.eventoWebhook.create({
      data: {
        proveedor: "mercadopago",
        externalId,
        payload: body as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return new Response("Evento ya procesado", { status: 200 });
    }
    console.error("[webhook:mp] error registrando evento", err);
    return new Response("Error registrando evento", { status: 500 });
  }

  try {
    if (tipo === "subscription_preapproval") {
      await procesarPreapproval(dataId);
    } else if (tipo === "payment") {
      await procesarPagoTurno(dataId, turnoIdQuery);
    }
    // Otros tipos: 200 sin acción.
  } catch (err) {
    console.error(`[webhook:mp] error procesando ${tipo}`, err);
    // Devolvemos 200 para no entrar en loop de retries por errores
    // recuperables (token equivocado, recursos de otra cuenta, etc.).
  }

  return NextResponse.json({ ok: true });
}

async function procesarPreapproval(id: string) {
  const snap = await obtenerPreapproval(id);
  if (!snap.externalReference) return;

  if (snap.status === "authorized") {
    await prisma.profesional.update({
      where: { id: snap.externalReference },
      data: {
        plan: "PRO",
        mpSubscriptionId: snap.id,
        planExpiresAt: snap.nextPaymentDate,
      },
    });
    return;
  }

  if (snap.status === "cancelled" || snap.status === "paused") {
    // updateMany para que la guarda por `mpSubscriptionId` evite pisar el
    // plan si el profesional ya tiene otra suscripción activa.
    await prisma.profesional.updateMany({
      where: { id: snap.externalReference, mpSubscriptionId: snap.id },
      data: {
        plan: "FREE",
        mpSubscriptionId: null,
        planExpiresAt: null,
      },
    });
  }
  // status === "pending": no-op, esperamos a authorized.
}

async function procesarPagoTurno(
  paymentId: string,
  turnoId: string | null,
) {
  if (!turnoId) {
    // notification_url legacy o webhook manual sin turnoId — no podemos
    // resolver el access token correcto, así que no procesamos.
    console.warn(
      `[webhook:mp] payment ${paymentId} sin turnoId en query — se ignora`,
    );
    return;
  }

  const turno = await prisma.turno.findUnique({
    where: { id: turnoId },
    select: {
      id: true,
      estado: true,
      clienteNombre: true,
      clienteEmail: true,
      fechaInicio: true,
      cancelToken: true,
      servicio: { select: { nombre: true } },
      profesional: {
        select: {
          mpAccessToken: true,
          nombre: true,
          slug: true,
          timezone: true,
        },
      },
    },
  });
  if (!turno) {
    console.warn(`[webhook:mp] turno ${turnoId} no encontrado`);
    return;
  }
  if (!turno.profesional.mpAccessToken) {
    console.warn(
      `[webhook:mp] profesional de turno ${turnoId} sin mpAccessToken — se ignora`,
    );
    return;
  }

  const payment = new Payment(
    mpClientProfesional(turno.profesional.mpAccessToken),
  );
  const data = await payment.get({ id: paymentId });

  // Guarda anti cross-account: el external_reference del payment tiene que
  // ser el mismo turnoId que nos pasaron en la URL.
  if (data.external_reference !== turnoId) {
    console.warn(
      `[webhook:mp] external_reference (${String(
        data.external_reference,
      )}) no coincide con turnoId (${turnoId}) — se ignora`,
    );
    return;
  }

  if (data.status !== "approved") return;

  const { count } = await prisma.turno.updateMany({
    where: { id: turnoId, estado: "PENDIENTE_PAGO" },
    data: {
      estado: "CONFIRMADO",
      mpPaymentId: String(data.id ?? paymentId),
    },
  });

  // Sólo mandamos email si efectivamente recién pasamos de PENDIENTE_PAGO
  // a CONFIRMADO (count === 1). Si ya estaba CONFIRMADO/CANCELADO, count
  // será 0 y evitamos mails duplicados o tardíos.
  if (count === 1 && turno.clienteEmail) {
    try {
      await sendConfirmacionReserva({
        clienteNombre: turno.clienteNombre,
        clienteEmail: turno.clienteEmail,
        fechaInicio: turno.fechaInicio,
        servicio: { nombre: turno.servicio.nombre },
        profesional: {
          nombre: turno.profesional.nombre,
          timezone: turno.profesional.timezone,
          slug: turno.profesional.slug,
        },
        turnoId: turno.id,
        cancelToken: turno.cancelToken ?? undefined,
      });
    } catch (err) {
      console.error(
        `[webhook:mp] email de confirmación a ${turno.clienteEmail} falló`,
        err,
      );
    }
  }
}
