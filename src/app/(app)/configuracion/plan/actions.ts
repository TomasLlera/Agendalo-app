"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  cancelarPreapproval,
  crearPreapprovalPro,
} from "@/lib/mercadopago/subscriptions";
import { isPro } from "@/lib/plan";

/**
 * Inicia el alta de la suscripción Pro: crea la preapproval en MP, guarda el
 * `mpSubscriptionId` en estado pending y redirige al `init_point` de MP. El
 * pase efectivo a `plan: PRO` lo hace el webhook cuando MP autoriza el pago.
 */
export async function crearSuscripcionPro() {
  const profesional = await getCurrentProfesional();
  if (isPro(profesional)) {
    redirect("/configuracion/plan");
  }

  let initPoint = "";
  try {
    const result = await crearPreapprovalPro({
      profesionalId: profesional.id,
      email: profesional.email,
    });
    initPoint = result.initPoint;
    if (result.id) {
      await prisma.profesional.update({
        where: { id: profesional.id },
        data: { mpSubscriptionId: result.id },
      });
    }
  } catch (err) {
    console.error("Error al crear suscripción Pro:", err);
  }

  if (!initPoint) {
    redirect("/configuracion/plan?error=mp");
  }
  redirect(initPoint);
}

/**
 * Pide a MP la baja de la suscripción Pro. La transición a `FREE` la hace el
 * webhook al recibir el evento `subscription_preapproval` con status
 * `cancelled` (MP es la fuente de verdad para el estado del plan).
 */
export async function cancelarSuscripcionPro() {
  const profesional = await getCurrentProfesional();
  if (!profesional.mpSubscriptionId) {
    redirect("/configuracion/plan");
  }

  let cancelOk = true;
  try {
    await cancelarPreapproval(profesional.mpSubscriptionId);
  } catch (err) {
    console.error("Error al cancelar suscripción Pro:", err);
    cancelOk = false;
  }

  if (!cancelOk) {
    redirect("/configuracion/plan?error=cancel");
  }
  revalidatePath("/configuracion/plan");
  redirect("/configuracion/plan?cancelada=ok");
}
