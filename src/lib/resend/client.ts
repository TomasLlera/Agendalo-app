import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

/**
 * Cliente Resend singleton, lazy. No se inicializa a nivel módulo para que el
 * build no falle cuando `RESEND_API_KEY` no esté seteado en preview / dev.
 */
export function resendClient(): Resend {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY en el entorno.");
  }
  cached = new Resend(apiKey);
  return cached;
}

export function resendFrom(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("Falta RESEND_FROM_EMAIL en el entorno.");
  }
  return from;
}
