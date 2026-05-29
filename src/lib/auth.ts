import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma, type Profesional } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generarSlugUnico } from "@/lib/utils";

/**
 * Devuelve el `Profesional` del usuario Clerk autenticado.
 *
 * Si el usuario está autenticado pero todavía no tiene fila `Profesional`
 * (p. ej. el webhook `user.created` de Clerk aún no llegó o se perdió), la
 * crea al vuelo. El webhook y esta creación diferida se cubren mutuamente:
 * el que dispara primero gana, y `clerkUserId @unique` evita duplicados.
 *
 * Lanza si no hay sesión — las rutas de `(app)` ya están protegidas por el
 * proxy de Clerk, así que en la práctica eso no debería ocurrir.
 */
export async function getCurrentProfesional(): Promise<Profesional> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("No hay un usuario autenticado");
  }

  const existente = await prisma.profesional.findUnique({
    where: { clerkUserId: userId },
  });
  if (existente) return existente;

  // El Profesional no existe: lo creamos a partir de los datos de Clerk.
  const user = await currentUser();
  if (!user) {
    throw new Error("No se pudo obtener el usuario de Clerk");
  }

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("El usuario de Clerk no tiene email");
  }

  const nombre =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0];

  try {
    return await prisma.profesional.create({
      data: {
        clerkUserId: userId,
        email,
        nombre,
        slug: await generarSlugUnico(email.split("@")[0], (s) =>
          prisma.profesional
            .findUnique({ where: { slug: s }, select: { id: true } })
            .then(Boolean),
        ),
        // plan FREE por default en el schema.
      },
    });
  } catch (err) {
    // Carrera con el webhook u otra request concurrente: ya fue creado.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const yaCreado = await prisma.profesional.findUnique({
        where: { clerkUserId: userId },
      });
      if (yaCreado) return yaCreado;
    }
    throw err;
  }
}
