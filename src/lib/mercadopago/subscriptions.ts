import "server-only";
import { PreApproval } from "mercadopago";
import { mpClientApp } from "./client";
import { PRECIO_PRO_ARS } from "@/lib/plan";

export type PreapprovalCreado = {
  id: string;
  initPoint: string;
};

/**
 * Crea una preapproval (suscripción recurrente) en Mercado Pago para el
 * profesional. Usa el access token de la app principal de Agendalo, NO el del
 * profesional. El cobro va a la cuenta de la app, no a la del profesional.
 *
 * Si `MP_SUSCRIPCION_PRO_PLAN_ID` está seteado, se asocia la preapproval a ese
 * plan. Si no, se crea inline con `auto_recurring` (mensual, ARS, $4.999).
 *
 * Sin `card_token_id`, MP devuelve un `init_point` para que el usuario complete
 * el alta de tarjeta. El status arranca en `pending` hasta que paga.
 */
export async function crearPreapprovalPro(args: {
  profesionalId: string;
  email: string;
}): Promise<PreapprovalCreado> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const planId = process.env.MP_SUSCRIPCION_PRO_PLAN_ID;

  const preapproval = new PreApproval(mpClientApp());
  const result = await preapproval.create({
    body: {
      reason: "Suscripción Agendalo Pro",
      external_reference: args.profesionalId,
      payer_email: args.email,
      back_url: `${base}/configuracion/plan?suscripcion=ok`,
      status: "pending",
      ...(planId
        ? { preapproval_plan_id: planId }
        : {
            auto_recurring: {
              frequency: 1,
              frequency_type: "months",
              transaction_amount: PRECIO_PRO_ARS,
              currency_id: "ARS",
            },
          }),
    },
  });

  return {
    id: result.id ?? "",
    initPoint: result.init_point ?? "",
  };
}

/**
 * Cancela una preapproval existente seteándola en `cancelled`. MP corta el
 * cobro recurrente. El webhook posterior actualiza `profesional.plan` a FREE.
 */
export async function cancelarPreapproval(preapprovalId: string): Promise<void> {
  const preapproval = new PreApproval(mpClientApp());
  await preapproval.update({
    id: preapprovalId,
    body: { status: "cancelled" },
  });
}

export type PreapprovalSnapshot = {
  id: string;
  status: string;
  externalReference: string | null;
  nextPaymentDate: Date | null;
};

/**
 * Lee una preapproval por id desde MP. Sirve para el webhook: cuando llega un
 * evento `subscription_preapproval`, vamos a MP a buscar el estado actual y el
 * `external_reference` (= profesionalId) en vez de confiar en el payload del
 * webhook (que sólo trae el id).
 */
export async function obtenerPreapproval(
  preapprovalId: string,
): Promise<PreapprovalSnapshot> {
  const preapproval = new PreApproval(mpClientApp());
  const result = await preapproval.get({ id: preapprovalId });
  return {
    id: result.id ?? preapprovalId,
    status: result.status ?? "",
    externalReference: result.external_reference ?? null,
    nextPaymentDate: result.next_payment_date
      ? new Date(result.next_payment_date)
      : null,
  };
}
