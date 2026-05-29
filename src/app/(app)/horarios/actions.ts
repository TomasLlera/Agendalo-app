"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bloqueoSchema, horariosSchema } from "./schema";

export type ResultadoHorarios = { ok: true } | { ok: false; error: string };

/**
 * Reemplaza por completo las franjas horarias del profesional autenticado.
 * Borra las existentes y crea las nuevas en una transacción, validando que
 * ningún día tenga más de 2 franjas ni franjas superpuestas.
 */
export async function setHorarios(
  raw: unknown,
): Promise<ResultadoHorarios> {
  const profesional = await getCurrentProfesional();

  const parsed = horariosSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los horarios cargados.",
    };
  }
  const franjas = parsed.data;

  // Agrupar por día para validar cantidad y solapamientos.
  const porDia = new Map<number, { horaInicio: string; horaFin: string }[]>();
  for (const f of franjas) {
    const arr = porDia.get(f.diaSemana) ?? [];
    arr.push({ horaInicio: f.horaInicio, horaFin: f.horaFin });
    porDia.set(f.diaSemana, arr);
  }
  for (const arr of porDia.values()) {
    if (arr.length > 2) {
      return { ok: false, error: "Cada día admite como máximo 2 franjas." };
    }
    const ordenadas = [...arr].sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio),
    );
    for (let i = 1; i < ordenadas.length; i++) {
      const previa = ordenadas[i - 1];
      const actual = ordenadas[i];
      if (previa && actual && actual.horaInicio < previa.horaFin) {
        return {
          ok: false,
          error: "Las franjas de un mismo día no pueden superponerse.",
        };
      }
    }
  }

  await prisma.$transaction([
    prisma.horarioDisponible.deleteMany({
      where: { profesionalId: profesional.id },
    }),
    prisma.horarioDisponible.createMany({
      data: franjas.map((f) => ({
        profesionalId: profesional.id,
        diaSemana: f.diaSemana,
        horaInicio: f.horaInicio,
        horaFin: f.horaFin,
      })),
    }),
  ]);

  revalidatePath("/horarios");
  return { ok: true };
}

/**
 * Crea un bloqueo (vacaciones / día no disponible). Las fechas llegan como
 * `YYYY-MM-DD` y se interpretan en la zona horaria del profesional: el inicio
 * al comienzo del día y el fin al final, convertidos a UTC para la DB.
 */
export async function createBloqueo(
  raw: unknown,
): Promise<ResultadoHorarios> {
  const profesional = await getCurrentProfesional();

  const parsed = bloqueoSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá las fechas del bloqueo.",
    };
  }
  const { fechaInicio, fechaFin, motivo } = parsed.data;

  await prisma.bloqueo.create({
    data: {
      profesionalId: profesional.id,
      fechaInicio: fromZonedTime(
        `${fechaInicio}T00:00:00`,
        profesional.timezone,
      ),
      fechaFin: fromZonedTime(`${fechaFin}T23:59:59.999`, profesional.timezone),
      motivo: motivo === "" ? null : motivo,
    },
  });

  revalidatePath("/horarios");
  return { ok: true };
}

/** Elimina un bloqueo del profesional autenticado. */
export async function deleteBloqueo(
  id: string,
): Promise<ResultadoHorarios> {
  const profesional = await getCurrentProfesional();

  const { count } = await prisma.bloqueo.deleteMany({
    where: { id, profesionalId: profesional.id },
  });
  if (count === 0) {
    return { ok: false, error: "No se encontró el bloqueo." };
  }

  revalidatePath("/horarios");
  return { ok: true };
}
