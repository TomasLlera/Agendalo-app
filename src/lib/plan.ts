import type { Plan } from "@prisma/client";

/**
 * Precio mensual del plan Pro, en ARS. Es un valor de configuración del SaaS
 * (no un precio guardado en la DB), por eso es un número simple: la API de
 * Mercado Pago espera `transaction_amount` como number.
 */
export const PRECIO_PRO_ARS = 29999;

/** Datos mínimos de un profesional necesarios para evaluar su plan. */
export type EstadoPlan = {
  plan: Plan;
  planExpiresAt: Date | null;
};

/**
 * Indica si el profesional tiene Pro activo. Contempla un grace period: si
 * `planExpiresAt` está en el futuro, sigue siendo Pro aunque la suscripción
 * se haya dado de baja; si ya pasó, vuelve a contar como Free.
 */
export function isPro(p: EstadoPlan): boolean {
  if (p.plan !== "PRO") return false;
  if (!p.planExpiresAt) return true;
  return p.planExpiresAt.getTime() > Date.now();
}
