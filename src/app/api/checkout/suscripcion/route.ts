import { NextResponse } from "next/server";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { crearPreapprovalPro } from "@/lib/mercadopago/subscriptions";
import { isPro } from "@/lib/plan";

export const runtime = "nodejs";

/**
 * `POST /api/checkout/suscripcion` — alternativa programática a la server
 * action `crearSuscripcionPro`. Devuelve `{ checkoutUrl }` con el `init_point`
 * de Mercado Pago para que el cliente redirija al pago.
 *
 * Protegida por el proxy de Clerk (no está en la lista de rutas públicas).
 */
export async function POST() {
  const profesional = await getCurrentProfesional();
  if (isPro(profesional)) {
    return NextResponse.json(
      { error: "Ya tenés el plan Pro activo." },
      { status: 400 },
    );
  }

  try {
    const result = await crearPreapprovalPro({
      profesionalId: profesional.id,
      email: profesional.email,
    });
    if (result.id) {
      await prisma.profesional.update({
        where: { id: profesional.id },
        data: { mpSubscriptionId: result.id },
      });
    }
    if (!result.initPoint) {
      return NextResponse.json(
        { error: "Mercado Pago no devolvió URL de pago." },
        { status: 502 },
      );
    }
    return NextResponse.json({ checkoutUrl: result.initPoint });
  } catch (err) {
    console.error("Error al crear suscripción Pro:", err);
    return NextResponse.json(
      { error: "No se pudo iniciar la suscripción." },
      { status: 500 },
    );
  }
}
