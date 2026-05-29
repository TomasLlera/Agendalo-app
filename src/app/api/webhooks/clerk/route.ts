import { headers } from "next/headers";
import { Webhook } from "svix";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generarSlugUnico } from "@/lib/utils";

// El webhook necesita el runtime de Node (svix usa crypto nativo).
export const runtime = "nodejs";

type ClerkEmailAddress = { id: string; email_address: string };

type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type ClerkEvent = { type: string; data: ClerkUserData };

/** Devuelve el email primario del usuario Clerk, o null si no tiene. */
function emailPrimario(data: ClerkUserData): string | null {
  const lista = data.email_addresses ?? [];
  const primario = lista.find((e) => e.id === data.primary_email_address_id);
  return (primario ?? lista[0])?.email_address ?? null;
}

/** Nombre visible: first + last name, o el prefijo del email como fallback. */
function nombreVisible(data: ClerkUserData, email: string): string {
  const nombre = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return nombre || email.split("@")[0];
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook:clerk] CLERK_WEBHOOK_SECRET no configurado");
    return new Response("Webhook no configurado", { status: 500 });
  }

  // 1. Verificar la firma svix ANTES de procesar nada (blueprint §16).
  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Faltan headers svix", { status: 400 });
  }

  const body = await req.text();

  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    return new Response("Firma inválida", { status: 401 });
  }

  // 2. Procesar dentro de una transacción: el insert en EventoWebhook actúa
  //    como candado de idempotencia (svix-id es único por entrega).
  try {
    await prisma.$transaction(async (tx) => {
      await tx.eventoWebhook.create({
        data: {
          proveedor: "clerk",
          externalId: svixId,
          payload: evt as unknown as Prisma.InputJsonValue,
        },
      });

      if (evt.type === "user.created") {
        const email = emailPrimario(evt.data);
        if (!email) {
          console.error(
            `[webhook:clerk] user.created sin email (id=${evt.data.id})`,
          );
          return;
        }
        await tx.profesional.create({
          data: {
            clerkUserId: evt.data.id,
            email,
            nombre: nombreVisible(evt.data, email),
            slug: await generarSlugUnico(email.split("@")[0], (s) =>
              tx.profesional
                .findUnique({ where: { slug: s }, select: { id: true } })
                .then(Boolean),
            ),
            // plan FREE por default en el schema.
          },
        });
      } else if (evt.type === "user.updated") {
        const email = emailPrimario(evt.data);
        if (email) {
          await tx.profesional.updateMany({
            where: { clerkUserId: evt.data.id },
            data: { email, nombre: nombreVisible(evt.data, email) },
          });
        }
      } else if (evt.type === "user.deleted") {
        await tx.profesional.deleteMany({
          where: { clerkUserId: evt.data.id },
        });
      }
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // svix-id duplicado o Profesional ya existente → ya procesado.
      return new Response("Evento ya procesado", { status: 200 });
    }
    console.error("[webhook:clerk] error procesando evento", err);
    return new Response("Error procesando webhook", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
