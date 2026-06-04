"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import { miembroSchema } from "./schema";

export type ResultadoMiembro = { ok: true } | { ok: false; error: string };

const ERROR_PRO =
  "Sumar profesionales a tu equipo es parte del plan Pro. Pasate a Pro para habilitarlo.";

/**
 * Filtra los `servicioIds` recibidos dejando solo los que pertenecen al
 * profesional y están activos. Evita que un cliente manipule el form para
 * asociar servicios de otra cuenta.
 */
async function servicioIdsValidos(
  profesionalId: string,
  ids: string[],
): Promise<string[]> {
  const servicios = await prisma.servicio.findMany({
    where: { id: { in: ids }, profesionalId, activo: true },
    select: { id: true },
  });
  return servicios.map((s) => s.id);
}

/** Crea un miembro del equipo para el profesional autenticado. */
export async function createMiembro(raw: unknown): Promise<ResultadoMiembro> {
  const profesional = await getCurrentProfesional();
  if (!isPro(profesional)) return { ok: false, error: ERROR_PRO };

  const parsed = miembroSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos del miembro.",
    };
  }

  const ids = await servicioIdsValidos(profesional.id, parsed.data.servicioIds);
  if (ids.length === 0) {
    return { ok: false, error: "Elegí al menos un servicio válido." };
  }

  await prisma.miembro.create({
    data: {
      profesionalId: profesional.id,
      nombre: parsed.data.nombre,
      fotoUrl: parsed.data.fotoUrl === "" ? null : parsed.data.fotoUrl,
      servicios: { create: ids.map((servicioId) => ({ servicioId })) },
    },
  });

  revalidatePath("/equipo");
  return { ok: true };
}

/** Actualiza un miembro existente del profesional autenticado. */
export async function updateMiembro(
  id: string,
  raw: unknown,
): Promise<ResultadoMiembro> {
  const profesional = await getCurrentProfesional();
  if (!isPro(profesional)) return { ok: false, error: ERROR_PRO };

  const parsed = miembroSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos del miembro.",
    };
  }

  // Verifica pertenencia antes de tocar la relación N:N.
  const miembro = await prisma.miembro.findFirst({
    where: { id, profesionalId: profesional.id, activo: true },
    select: { id: true },
  });
  if (!miembro) return { ok: false, error: "No se encontró el miembro." };

  const ids = await servicioIdsValidos(profesional.id, parsed.data.servicioIds);
  if (ids.length === 0) {
    return { ok: false, error: "Elegí al menos un servicio válido." };
  }

  // Reemplaza el set de servicios: borra los actuales y crea los nuevos.
  await prisma.$transaction([
    prisma.miembro.update({
      where: { id },
      data: {
        nombre: parsed.data.nombre,
        fotoUrl: parsed.data.fotoUrl === "" ? null : parsed.data.fotoUrl,
      },
    }),
    prisma.miembroServicio.deleteMany({ where: { miembroId: id } }),
    prisma.miembroServicio.createMany({
      data: ids.map((servicioId) => ({ miembroId: id, servicioId })),
    }),
  ]);

  revalidatePath("/equipo");
  return { ok: true };
}

/**
 * Baja lógica de un miembro (`activo: false`). No se borra la fila para
 * preservar la integridad de los turnos históricos que lo referencian.
 */
export async function deleteMiembro(id: string): Promise<ResultadoMiembro> {
  const profesional = await getCurrentProfesional();

  const { count } = await prisma.miembro.updateMany({
    where: { id, profesionalId: profesional.id, activo: true },
    data: { activo: false },
  });
  if (count === 0) return { ok: false, error: "No se encontró el miembro." };

  revalidatePath("/equipo");
  return { ok: true };
}
