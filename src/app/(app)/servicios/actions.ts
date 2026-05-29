"use server";

import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { servicioSchema, type ServicioFormValues } from "./schema";

export type ResultadoServicio = { ok: true } | { ok: false; error: string };

/** Construye el objeto `data` de Prisma a partir de los valores validados. */
function aDatosPrisma(d: ServicioFormValues) {
  return {
    nombre: d.nombre,
    descripcion: d.descripcion === "" ? null : d.descripcion,
    duracionMinutos: d.duracionMinutos,
    precio: new Decimal(d.precio).toFixed(2),
    moneda: d.moneda,
    requierePago: d.requierePago,
  };
}

/** Crea un servicio para el profesional autenticado. */
export async function createServicio(raw: unknown): Promise<ResultadoServicio> {
  const profesional = await getCurrentProfesional();

  const parsed = servicioSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos del servicio.",
    };
  }

  await prisma.servicio.create({
    data: { profesionalId: profesional.id, ...aDatosPrisma(parsed.data) },
  });

  revalidatePath("/servicios");
  return { ok: true };
}

/** Actualiza un servicio existente del profesional autenticado. */
export async function updateServicio(
  id: string,
  raw: unknown,
): Promise<ResultadoServicio> {
  const profesional = await getCurrentProfesional();

  const parsed = servicioSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos del servicio.",
    };
  }

  // `updateMany` con `profesionalId` en el `where` garantiza que el servicio
  // pertenezca a quien lo edita, sin necesidad de un fetch previo.
  const { count } = await prisma.servicio.updateMany({
    where: { id, profesionalId: profesional.id, activo: true },
    data: aDatosPrisma(parsed.data),
  });
  if (count === 0) {
    return { ok: false, error: "No se encontró el servicio." };
  }

  revalidatePath("/servicios");
  return { ok: true };
}

/**
 * Baja lógica de un servicio (`activo: false`). No se borra la fila para
 * preservar la integridad de los turnos históricos que lo referencian.
 */
export async function deleteServicio(id: string): Promise<ResultadoServicio> {
  const profesional = await getCurrentProfesional();

  const { count } = await prisma.servicio.updateMany({
    where: { id, profesionalId: profesional.id, activo: true },
    data: { activo: false },
  });
  if (count === 0) {
    return { ok: false, error: "No se encontró el servicio." };
  }

  revalidatePath("/servicios");
  return { ok: true };
}
