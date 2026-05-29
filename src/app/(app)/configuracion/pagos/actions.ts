"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildAuthUrl } from "@/lib/mercadopago/oauth";

/**
 * Inicia la conexión OAuth con Mercado Pago: redirige al profesional a la
 * pantalla de autorización de MP. El `state` lleva su id para validarlo en
 * el callback.
 */
export async function conectarMercadoPago(): Promise<void> {
  const profesional = await getCurrentProfesional();
  redirect(buildAuthUrl(profesional.id));
}

/** Desvincula la cuenta de Mercado Pago del profesional. */
export async function desconectarMercadoPago(): Promise<void> {
  const profesional = await getCurrentProfesional();
  await prisma.profesional.update({
    where: { id: profesional.id },
    data: { mpAccessToken: null, mpUserId: null },
  });
  revalidatePath("/configuracion/pagos");
}
