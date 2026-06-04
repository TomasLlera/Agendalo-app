import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeCode } from "@/lib/mercadopago/oauth";

/**
 * Callback del flujo OAuth de Mercado Pago. La ruta está protegida por Clerk,
 * así que corre con la sesión del profesional que inició la conexión.
 * Intercambia el `code` por tokens y los guarda en el `Profesional`.
 */
export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const destino = (estado: string) =>
    NextResponse.redirect(`${base}/configuracion/pagos?${estado}`);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code) return destino("error=oauth");

  const profesional = await getCurrentProfesional();
  // `state` se fijó al iniciar la conexión con el id del profesional.
  if (state !== profesional.id) return destino("error=state");

  try {
    const token = await exchangeCode(code);
    await prisma.profesional.update({
      where: { id: profesional.id },
      data: {
        mpAccessToken: token.access_token,
        mpUserId: String(token.user_id),
        mpPublicKey: token.public_key ?? null,
      },
    });
  } catch {
    return destino("error=token");
  }

  return destino("conectado=1");
}
