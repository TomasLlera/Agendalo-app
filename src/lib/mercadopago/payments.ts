import "server-only";
import { Preference } from "mercadopago";
import { mpClientProfesional } from "./client";

export type TurnoParaPago = {
  id: string;
  profesionalSlug: string;
  servicioNombre: string;
  /** Precio como string decimal (p. ej. "1500.00"). */
  precio: string;
  moneda: string;
  clienteEmail: string | null;
};

/**
 * Crea una preferencia de pago de Mercado Pago para un turno, usando el
 * access token del profesional (cobra directo a su cuenta). Devuelve el
 * `init_point` al que se redirige al cliente para pagar.
 */
export async function crearPreferenceTurno(
  turno: TurnoParaPago,
  mpAccessToken: string,
): Promise<{ initPoint: string; preferenceId: string }> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const preference = new Preference(mpClientProfesional(mpAccessToken));

  const result = await preference.create({
    body: {
      items: [
        {
          id: turno.id,
          title: turno.servicioNombre,
          quantity: 1,
          unit_price: Number(turno.precio),
          currency_id: turno.moneda,
        },
      ],
      payer: turno.clienteEmail ? { email: turno.clienteEmail } : undefined,
      external_reference: turno.id,
      back_urls: {
        success: `${base}/p/${turno.profesionalSlug}/confirmacion?turnoId=${turno.id}`,
        pending: `${base}/p/${turno.profesionalSlug}/confirmacion?turnoId=${turno.id}`,
        failure: `${base}/p/${turno.profesionalSlug}/confirmacion?turnoId=${turno.id}`,
      },
      auto_return: "approved",
      // El query `turnoId` permite al webhook identificar al turno (y por
      // ende al profesional + su mpAccessToken) sin tener que llamar a MP
      // primero. Es necesario porque el pago vive en la cuenta del
      // profesional, no en la cuenta de la app, así que el fetch del
      // payment requiere el token correcto.
      notification_url: `${base}/api/webhooks/mercadopago?turnoId=${turno.id}`,
    },
  });

  return {
    initPoint: result.init_point ?? "",
    preferenceId: result.id ?? "",
  };
}
