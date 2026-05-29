import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendContactoMensaje } from "@/lib/resend/emails";

export const runtime = "nodejs";

const contactoSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  apellido: z.string().trim().min(2).max(80),
  telefono: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(160),
  descripcion: z.string().trim().min(10).max(1000),
});

/**
 * `POST /api/contacto` — recibe el formulario público de la landing, valida
 * con zod y reenvía un email al inbox de Agendalo via Resend. Si Resend no
 * está configurado, devuelve 503 (no perdemos el mensaje silenciosamente).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = contactoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error("[contacto] Resend no configurado");
    return NextResponse.json(
      { error: "El servicio de mensajes está temporalmente desactivado." },
      { status: 503 },
    );
  }

  try {
    await sendContactoMensaje(parsed.data);
  } catch (err) {
    console.error("[contacto] error enviando mensaje", err);
    return NextResponse.json(
      { error: "No pudimos enviar tu mensaje. Probá de nuevo en un momento." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
