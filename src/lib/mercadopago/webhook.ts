import "server-only";
import crypto from "node:crypto";

/**
 * Verifica la firma `x-signature` enviada por Mercado Pago en sus webhooks.
 *
 * Formato del header: `ts=1704908010,v1=hash`. El manifest que MP firma es:
 *
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 *
 * Donde `data.id` viene del query param `data.id` de la URL del webhook
 * (NO del body), y el hash es HMAC-SHA256 con `MP_WEBHOOK_SECRET`.
 *
 * Referencia: https://www.mercadopago.com.ar/developers/es/docs/notifications/webhooks/webhooks-signatures
 */
export function verificarFirmaMP(args: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  if (!args.xSignature || !args.xRequestId || !args.dataId) return false;

  const partes = Object.fromEntries(
    args.xSignature.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k, rest.join("=")];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  // data.id se incluye en minúsculas si es alfanumérico (cuids).
  const manifest = `id:${args.dataId.toLowerCase()};request-id:${args.xRequestId};ts:${ts};`;
  const esperado = crypto
    .createHmac("sha256", args.secret)
    .update(manifest)
    .digest("hex");

  // Comparación timing-safe.
  try {
    const a = Buffer.from(esperado, "hex");
    const b = Buffer.from(v1, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
