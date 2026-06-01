"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import { buildAuthUrl } from "@/lib/mercadopago/oauth";
import {
  datosBancariosSchema,
  type DatosBancariosFormValues,
} from "./datos-bancarios-schema";

export type ResultadoDatosBancarios =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Inicia la conexión OAuth con Mercado Pago: redirige al profesional a la
 * pantalla de autorización de MP. El `state` lleva su id para validarlo en
 * el callback.
 */
export async function conectarMercadoPago(): Promise<void> {
  const profesional = await getCurrentProfesional();
  // Cobrar con Mercado Pago es una feature del plan Pro. Guard defensivo: la UI
  // ya esconde el botón para Free, pero protegemos también el action.
  if (!isPro(profesional)) {
    redirect("/configuracion/plan");
  }
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

/**
 * Crea o actualiza los datos bancarios del profesional (CBU/alias para
 * cobrar por transferencia). Los strings vacíos se persisten como `null`
 * para mantener la columna limpia.
 */
export async function guardarDatosBancarios(
  raw: unknown,
): Promise<ResultadoDatosBancarios> {
  const profesional = await getCurrentProfesional();

  const parsed = datosBancariosSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos bancarios.",
    };
  }

  const norm = (v: string) => (v.trim() === "" ? null : v.trim());
  const d: DatosBancariosFormValues = parsed.data;
  const data = {
    cbu: norm(d.cbu),
    alias: norm(d.alias),
    banco: norm(d.banco),
    titular: norm(d.titular),
    cuit: norm(d.cuit),
  };

  await prisma.datosBancarios.upsert({
    where: { profesionalId: profesional.id },
    create: { profesionalId: profesional.id, ...data },
    update: data,
  });

  revalidatePath("/configuracion/pagos");
  return { ok: true };
}
