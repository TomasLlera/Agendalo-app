import "server-only";
import { MercadoPagoConfig } from "mercadopago";

/**
 * Cliente de Mercado Pago de la app principal de Agendalo (para cobrar las
 * suscripciones Pro). Usa `MP_ACCESS_TOKEN`.
 */
export function mpClientApp(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta MP_ACCESS_TOKEN en el entorno.");
  }
  return new MercadoPagoConfig({ accessToken });
}

/**
 * Cliente de Mercado Pago de un profesional concreto, usando el access token
 * que obtuvo al conectar su cuenta por OAuth. Con él se cobra a sus clientes.
 */
export function mpClientProfesional(accessToken: string): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken });
}
