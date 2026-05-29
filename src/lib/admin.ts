import "server-only";
import { currentUser } from "@clerk/nextjs/server";

/** Lista de emails con acceso a /admin. Se lee de `ADMIN_EMAILS` (coma-separados). */
function emailsPermitidos(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return emailsPermitidos().includes(email.toLowerCase());
}

/**
 * Devuelve el email del usuario Clerk si está en la whitelist de admins,
 * `null` en caso contrario. Las rutas `/admin/*` deben llamar a esto y
 * `notFound()`/`redirect()` si devuelve null.
 */
export async function getAdminEmail(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  return isAdminEmail(email) ? email : null;
}
