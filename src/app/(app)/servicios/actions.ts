"use server";

import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import { servicioSchema, type ServicioFormValues } from "./schema";

export type ResultadoServicio = { ok: true } | { ok: false; error: string };

const ERROR_MP_PRO =
  "Cobrar con Mercado Pago es parte del plan Pro. Elegí transferencia o efectivo.";

/** Construye el objeto `data` de Prisma a partir de los valores validados. */
function aDatosPrisma(d: ServicioFormValues) {
  // `requierePago` derivado del método para mantener semántica consistente:
  // - MERCADOPAGO: elección del usuario (checkbox del form).
  // - TRANSFERENCIA: siempre true (el cliente paga antes y ve CBU/alias).
  // - EFECTIVO: false (el cliente paga en el lugar, el turno queda
  //   CONFIRMADO al reservar).
  // - SIN_PAGO: false (no hay cobro).
  let requierePago: boolean;
  if (d.metodoPago === "MERCADOPAGO") {
    requierePago = d.requierePago;
  } else if (d.metodoPago === "TRANSFERENCIA") {
    requierePago = true;
  } else {
    requierePago = false;
  }

  return {
    nombre: d.nombre,
    descripcion: d.descripcion === "" ? null : d.descripcion,
    duracionMinutos: d.duracionMinutos,
    precio: new Decimal(d.precio).toFixed(2),
    moneda: d.moneda,
    requierePago,
    metodoPago: d.metodoPago,
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
  if (parsed.data.metodoPago === "MERCADOPAGO" && !isPro(profesional)) {
    return { ok: false, error: ERROR_MP_PRO };
  }

  const servicio = await prisma.servicio.create({
    data: { profesionalId: profesional.id, ...aDatosPrisma(parsed.data) },
    select: { id: true },
  });

  // Por defecto, todos los miembros activos pueden prestar el servicio nuevo.
  // El profesional puede luego desasignarlo desde /equipo. Esto evita que un
  // servicio recién creado quede sin equipo (y por ende sin disponibilidad)
  // en cuentas que ya trabajan con varios miembros.
  const miembros = await prisma.miembro.findMany({
    where: { profesionalId: profesional.id, activo: true },
    select: { id: true },
  });
  if (miembros.length > 0) {
    await prisma.miembroServicio.createMany({
      data: miembros.map((m) => ({ miembroId: m.id, servicioId: servicio.id })),
    });
  }

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
  if (parsed.data.metodoPago === "MERCADOPAGO" && !isPro(profesional)) {
    return { ok: false, error: ERROR_MP_PRO };
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
