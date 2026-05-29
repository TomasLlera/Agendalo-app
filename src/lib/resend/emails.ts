import "server-only";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { resendClient, resendFrom } from "./client";

export type TurnoEmail = {
  clienteNombre: string;
  clienteEmail: string;
  fechaInicio: Date;
  servicio: { nombre: string };
  profesional: { nombre: string; timezone: string; slug: string };
};

export type ContactoMensaje = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  descripcion: string;
};

/**
 * Envía el mensaje del formulario público de contacto al inbox de Agendalo.
 * Destino: `CONTACTO_EMAIL_TO` (default `tomasllera95@gmail.com`).
 * `replyTo` se setea al email del visitante para responder con un click.
 */
export async function sendContactoMensaje(
  m: ContactoMensaje,
): Promise<{ id: string }> {
  const resend = resendClient();
  const from = resendFrom();
  const to =
    process.env.CONTACTO_EMAIL_TO?.trim() || "tomasllera95@gmail.com";

  const nombreCompleto = `${m.nombre} ${m.apellido}`.trim();
  const asunto = `Nuevo contacto desde Agendalo — ${nombreCompleto}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 540px; color: #111;">
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #555;">
        Nuevo mensaje desde el formulario público de Agendalo.
      </p>
      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 6px 10px; background: #F4F4F5; width: 110px;">Nombre</td>
          <td style="padding: 6px 10px;">${escapeHtml(nombreCompleto)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; background: #F4F4F5;">Email</td>
          <td style="padding: 6px 10px;">
            <a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; background: #F4F4F5;">Teléfono</td>
          <td style="padding: 6px 10px;">${escapeHtml(m.telefono)}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 6px 0; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.04em;">
        Mensaje
      </p>
      <div style="white-space: pre-wrap; border-left: 3px solid #E4E4E7; padding: 4px 12px; font-size: 14px; line-height: 1.5;">
        ${escapeHtml(m.descripcion)}
      </div>
    </div>
  `;
  const text =
    `Nuevo contacto desde Agendalo\n\n` +
    `Nombre: ${nombreCompleto}\n` +
    `Email: ${m.email}\n` +
    `Teléfono: ${m.telefono}\n\n` +
    `Mensaje:\n${m.descripcion}\n`;

  const res = await resend.emails.send({
    from,
    to,
    replyTo: m.email,
    subject: asunto,
    html,
    text,
  });
  if (res.error) {
    throw new Error(`Resend: ${res.error.message ?? "error desconocido"}`);
  }
  return { id: res.data?.id ?? "" };
}

function formatearCuando(turno: TurnoEmail): string {
  return formatInTimeZone(
    turno.fechaInicio,
    turno.profesional.timezone,
    "EEEE d 'de' MMMM 'a las' HH:mm",
    { locale: es },
  );
}

/**
 * Envía el email de confirmación al cliente al reservar un turno. Lanza si
 * Resend falla; el caller (API route / webhook) decide si propagar el error o
 * sólo loguearlo.
 */
export async function sendConfirmacionReserva(
  turno: TurnoEmail,
): Promise<{ id: string }> {
  const resend = resendClient();
  const from = resendFrom();
  const cuando = formatearCuando(turno);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const linkPublico = `${baseUrl}/p/${turno.profesional.slug}`;

  const asunto = `Tu turno con ${turno.profesional.nombre} está confirmado`;
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; color: #111;">
      <p>Hola ${escapeHtml(turno.clienteNombre)},</p>
      <p>
        Tu turno con <strong>${escapeHtml(turno.profesional.nombre)}</strong>
        para <strong>${escapeHtml(turno.servicio.nombre)}</strong> quedó
        confirmado para el <strong>${escapeHtml(cuando)}</strong>.
      </p>
      <p>
        Si necesitás cancelar o reprogramar, contactá a ${escapeHtml(turno.profesional.nombre)}
        o entrá a su página:
        <a href="${linkPublico}">${linkPublico}</a>
      </p>
      <p style="color: #555; font-size: 12px; margin-top: 24px;">— Agendalo</p>
    </div>
  `;
  const text =
    `Hola ${turno.clienteNombre},\n\n` +
    `Tu turno con ${turno.profesional.nombre} para ${turno.servicio.nombre} quedó confirmado para el ${cuando}.\n\n` +
    `Si necesitás cancelar o reprogramar, entrá a: ${linkPublico}\n\n— Agendalo`;

  const res = await resend.emails.send({
    from,
    to: turno.clienteEmail,
    subject: asunto,
    html,
    text,
  });
  if (res.error) {
    throw new Error(`Resend: ${res.error.message ?? "error desconocido"}`);
  }
  return { id: res.data?.id ?? "" };
}

/**
 * Envía el email de cancelación al cliente. Lanza si Resend falla; el caller
 * (server action) decide si propagar el error o sólo loguearlo.
 */
export async function sendCancelacionTurno(
  turno: TurnoEmail,
): Promise<{ id: string }> {
  const resend = resendClient();
  const from = resendFrom();
  const cuando = formatearCuando(turno);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const linkPublico = `${baseUrl}/p/${turno.profesional.slug}`;

  const asunto = `Tu turno con ${turno.profesional.nombre} fue cancelado`;
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; color: #111;">
      <p>Hola ${escapeHtml(turno.clienteNombre)},</p>
      <p>
        Te avisamos que tu turno con <strong>${escapeHtml(turno.profesional.nombre)}</strong>
        para <strong>${escapeHtml(turno.servicio.nombre)}</strong> el
        <strong>${escapeHtml(cuando)}</strong> fue cancelado.
      </p>
      <p>
        Podés reservar un nuevo turno desde su página:
        <a href="${linkPublico}">${linkPublico}</a>
      </p>
      <p style="color: #555; font-size: 12px; margin-top: 24px;">— Agendalo</p>
    </div>
  `;
  const text =
    `Hola ${turno.clienteNombre},\n\n` +
    `Tu turno con ${turno.profesional.nombre} para ${turno.servicio.nombre} el ${cuando} fue cancelado.\n\n` +
    `Reservá uno nuevo en: ${linkPublico}\n\n— Agendalo`;

  const res = await resend.emails.send({
    from,
    to: turno.clienteEmail,
    subject: asunto,
    html,
    text,
  });
  if (res.error) {
    throw new Error(`Resend: ${res.error.message ?? "error desconocido"}`);
  }
  return { id: res.data?.id ?? "" };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
