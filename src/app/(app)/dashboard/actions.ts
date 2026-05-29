"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendCancelacionTurno } from "@/lib/resend/emails";

export type ResultadoTurno = { ok: true } | { ok: false; error: string };

/**
 * Cancela un turno del profesional autenticado. Marca `estado=CANCELADO` y
 * envía email de cancelación al cliente si tiene mail registrado. El envío de
 * email es mejor esfuerzo: si Resend falla (sin API key, etc.), se loguea pero
 * la cancelación se conserva.
 *
 * No se hace refund automático de pagos MP — esa decisión la maneja el
 * profesional fuera del flujo (caso edge, MVP).
 */
export async function cancelarTurno(turnoId: string): Promise<ResultadoTurno> {
  const profesional = await getCurrentProfesional();

  const turno = await prisma.turno.findFirst({
    where: {
      id: turnoId,
      profesionalId: profesional.id,
      estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] },
    },
    select: {
      id: true,
      clienteNombre: true,
      clienteEmail: true,
      fechaInicio: true,
      servicio: { select: { nombre: true } },
    },
  });
  if (!turno) {
    return { ok: false, error: "No se encontró el turno o ya está cerrado." };
  }

  await prisma.turno.update({
    where: { id: turno.id },
    data: { estado: "CANCELADO" },
  });

  if (turno.clienteEmail) {
    try {
      await sendCancelacionTurno({
        clienteNombre: turno.clienteNombre,
        clienteEmail: turno.clienteEmail,
        fechaInicio: turno.fechaInicio,
        servicio: { nombre: turno.servicio.nombre },
        profesional: {
          nombre: profesional.nombre,
          timezone: profesional.timezone,
          slug: profesional.slug,
        },
      });
    } catch (err) {
      console.error(
        `[cancelarTurno] email a ${turno.clienteEmail} falló`,
        err,
      );
    }
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Marca un turno como COMPLETADO. Sólo aplica a turnos `CONFIRMADO` (no se
 * puede completar un cancelado ni un pendiente de pago).
 */
export async function marcarCompletado(
  turnoId: string,
): Promise<ResultadoTurno> {
  const profesional = await getCurrentProfesional();

  const { count } = await prisma.turno.updateMany({
    where: {
      id: turnoId,
      profesionalId: profesional.id,
      estado: "CONFIRMADO",
    },
    data: { estado: "COMPLETADO" },
  });
  if (count === 0) {
    return {
      ok: false,
      error: "No se encontró el turno o no está confirmado.",
    };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
