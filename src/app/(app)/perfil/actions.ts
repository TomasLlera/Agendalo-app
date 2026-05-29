"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subirFotoPerfil } from "@/lib/storage";
import { perfilSchema } from "./schema";

export type ResultadoPerfil =
  | { ok: true }
  | { ok: false; error: string; field?: "slug" };

/**
 * Actualiza los datos públicos del profesional autenticado.
 *
 * Recibe `FormData` porque incluye un archivo opcional (la foto). Valida los
 * campos de texto con `perfilSchema`, verifica que el `slug` no esté tomado
 * por otro profesional y, si llegó una foto, la sube a Supabase Storage.
 */
export async function updatePerfil(
  formData: FormData,
): Promise<ResultadoPerfil> {
  const profesional = await getCurrentProfesional();

  const parsed = perfilSchema.safeParse({
    nombre: formData.get("nombre"),
    slug: formData.get("slug"),
    descripcion: formData.get("descripcion") ?? "",
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos del formulario.",
    };
  }
  const { nombre, slug, descripcion, timezone } = parsed.data;

  // Unicidad de slug: ningún OTRO profesional puede tener el mismo.
  const colision = await prisma.profesional.findFirst({
    where: { slug, NOT: { id: profesional.id } },
    select: { id: true },
  });
  if (colision) {
    return {
      ok: false,
      error: "Ese slug ya está en uso. Probá con otro.",
      field: "slug",
    };
  }

  // Foto opcional: solo se procesa si el usuario eligió un archivo nuevo.
  let fotoUrl: string | undefined;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const subida = await subirFotoPerfil(profesional.id, foto);
    if (!subida.ok) {
      return { ok: false, error: subida.error };
    }
    fotoUrl = subida.url;
  }

  try {
    await prisma.profesional.update({
      where: { id: profesional.id },
      data: {
        nombre,
        slug,
        descripcion: descripcion === "" ? null : descripcion,
        timezone,
        ...(fotoUrl ? { fotoUrl } : {}),
      },
    });
  } catch (err) {
    // Carrera: otro request tomó el slug entre el chequeo y el update.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        ok: false,
        error: "Ese slug ya está en uso. Probá con otro.",
        field: "slug",
      };
    }
    throw err;
  }

  revalidatePath("/perfil");
  return { ok: true };
}
