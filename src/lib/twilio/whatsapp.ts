import "server-only";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { twilioClient, twilioWhatsAppFrom } from "./client";

export type TipoRecordatorio = "24h" | "1h";

/**
 * Forma mínima del turno necesaria para armar un recordatorio. Pedimos sólo
 * los campos que usamos para que el caller (cron) pueda hacer un `select`
 * acotado y no pasar el modelo completo.
 */
export type TurnoRecordatorio = {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  fechaInicio: Date;
  servicio: { nombre: string };
  profesional: { nombre: string; timezone: string };
};

const CONTENT_SID_ENV: Record<TipoRecordatorio, string> = {
  "24h": "TWILIO_CONTENT_SID_24H",
  "1h": "TWILIO_CONTENT_SID_1H",
};

const TEMPLATE_NOMBRE: Record<TipoRecordatorio, string> = {
  "24h": "agendalo_reminder_24h",
  "1h": "agendalo_reminder_1h",
};

function formatearCuando(turno: TurnoRecordatorio): string {
  return formatInTimeZone(
    turno.fechaInicio,
    turno.profesional.timezone,
    "EEEE dd/MM 'a las' HH:mm",
    { locale: es },
  );
}

/**
 * Cuerpo de fallback cuando no hay Content SID configurado (sandbox de dev).
 * En producción se usa el template aprobado via Content API.
 */
function plantillaTextoLibre(
  turno: TurnoRecordatorio,
  tipo: TipoRecordatorio,
): string {
  const cuando = formatearCuando(turno);
  const encabezado =
    tipo === "24h"
      ? `Hola ${turno.clienteNombre}! Te recordamos tu turno de mañana`
      : `Hola ${turno.clienteNombre}! Tu turno es en 1 hora`;
  return `${encabezado} con ${turno.profesional.nombre} para ${turno.servicio.nombre}, ${cuando}. Avisanos si necesitás cancelar.`;
}

function destinoWhatsApp(telefono: string): string {
  return telefono.startsWith("whatsapp:") ? telefono : `whatsapp:${telefono}`;
}

export type ResultadoEnvio = {
  sid: string;
  template: string;
  via: "content_template" | "free_form";
};

/**
 * Envía un recordatorio WhatsApp por Twilio. Si `TWILIO_CONTENT_SID_<TIPO>` está
 * seteado, dispara el template aprobado via Content API (production); si no,
 * cae a texto libre (sandbox de Twilio, sólo para números que aceptaron unirse).
 *
 * Lanza si Twilio falla. El caller (cron) maneja el error por turno para no
 * abortar el batch.
 */
export async function sendReminder(
  turno: TurnoRecordatorio,
  tipo: TipoRecordatorio,
): Promise<ResultadoEnvio> {
  const client = twilioClient();
  const from = twilioWhatsAppFrom();
  const to = destinoWhatsApp(turno.clienteTelefono);
  const contentSid = process.env[CONTENT_SID_ENV[tipo]];

  if (contentSid) {
    const contentVariables = JSON.stringify({
      "1": turno.clienteNombre,
      "2": turno.profesional.nombre,
      "3": turno.servicio.nombre,
      "4": formatearCuando(turno),
    });
    const msg = await client.messages.create({
      from,
      to,
      contentSid,
      contentVariables,
    });
    return {
      sid: msg.sid,
      template: TEMPLATE_NOMBRE[tipo],
      via: "content_template",
    };
  }

  const msg = await client.messages.create({
    from,
    to,
    body: plantillaTextoLibre(turno, tipo),
  });
  return {
    sid: msg.sid,
    template: TEMPLATE_NOMBRE[tipo],
    via: "free_form",
  };
}
