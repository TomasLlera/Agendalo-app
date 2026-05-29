import "server-only";
import twilio, { type Twilio } from "twilio";

let cached: Twilio | null = null;

/**
 * Cliente Twilio singleton. Lee credenciales del entorno al primer uso. No se
 * inicializa en módulo top-level para que el build de Next no falle cuando las
 * vars no estén configuradas (caso típico en dev / preview sin Twilio).
 */
export function twilioClient(): Twilio {
  if (cached) return cached;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error(
      "Faltan TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN en el entorno.",
    );
  }
  cached = twilio(accountSid, authToken);
  return cached;
}

/**
 * Devuelve el remitente WhatsApp configurado (formato `whatsapp:+<E164>`).
 * En dev se usa el sandbox de Twilio (`whatsapp:+14155238886`); en prod, el
 * número WhatsApp Business aprobado.
 */
export function twilioWhatsAppFrom(): string {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    throw new Error(
      "Falta TWILIO_WHATSAPP_FROM (formato 'whatsapp:+<E164>').",
    );
  }
  return from;
}
