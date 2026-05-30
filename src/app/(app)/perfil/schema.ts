import { z } from "zod";
import { esTimezoneValida } from "@/lib/timezones";
import { sentenceCase } from "@/lib/text";

/**
 * Esquema compartido por el formulario de Perfil (cliente, vía `zodResolver`)
 * y la server action `updatePerfil` (validación en el servidor).
 *
 * `slug` se normaliza a minúsculas/sin espacios y se valida con el mismo
 * formato URL-safe que produce `slugify` en `@/lib/utils`.
 */
export const perfilSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .transform(sentenceCase),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "El slug debe tener al menos 3 caracteres.")
    .max(40, "El slug no puede superar los 40 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo minúsculas, números y guiones (sin espacios).",
    ),
  descripcion: z
    .string()
    .trim()
    .max(280, "La descripción no puede superar los 280 caracteres.")
    .transform(sentenceCase),
  timezone: z
    .string()
    .refine(esTimezoneValida, "Elegí una zona horaria válida."),
});

export type PerfilFormValues = z.infer<typeof perfilSchema>;
