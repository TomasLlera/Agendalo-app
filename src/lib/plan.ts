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
  /** Email del profesional: los admins se tratan siempre como Pro. */
  email?: string;
};

/**
 * Indica si el email está en la whitelist `ADMIN_EMAILS`. Misma lógica que
 * `isAdminEmail` en `@/lib/admin`, replicada acá para no arrastrar el módulo
 * `server-only` (con `currentUser`) a `plan.ts`, que se importa en muchos
 * lugares. `ADMIN_EMAILS` no es `NEXT_PUBLIC`, así que client-side queda
 * `undefined` → devuelve `false` (sin fugas ni errores).
 */
function esEmailAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}

/**
 * Indica si el profesional tiene Pro activo. Los admins son siempre Pro.
 * Contempla un grace period: si `planExpiresAt` está en el futuro, sigue
 * siendo Pro aunque la suscripción se haya dado de baja; si ya pasó, vuelve a
 * contar como Free.
 */
export function isPro(p: EstadoPlan): boolean {
  if (esEmailAdmin(p.email)) return true;
  if (p.plan !== "PRO") return false;
  if (!p.planExpiresAt) return true;
  return p.planExpiresAt.getTime() > Date.now();
}
