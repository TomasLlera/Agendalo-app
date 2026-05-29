import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convierte un texto en un slug URL-safe: minúsculas, sin acentos, separado
 * por guiones. Usado para la URL pública del profesional (/p/[slug]).
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // elimina acentos y tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Genera un slug único: prueba el slug base y, ante colisión, agrega sufijos
 * aleatorios. `existeSlug` debe indicar si un slug ya está tomado en la DB.
 * Compartido por el webhook de Clerk y la creación diferida del Profesional.
 */
export async function generarSlugUnico(
  base: string,
  existeSlug: (slug: string) => Promise<boolean>,
): Promise<string> {
  const original = slugify(base) || "profesional";
  let slug = original;
  for (let intento = 0; intento < 10; intento++) {
    if (!(await existeSlug(slug))) return slug;
    slug = `${original}-${Math.random().toString(36).slice(2, 6)}`;
  }
  // Salvaguarda extremadamente improbable: sufijo basado en timestamp.
  return `${original}-${Date.now().toString(36)}`;
}
