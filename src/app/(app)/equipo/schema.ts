import { z } from "zod";
import { tituloCase } from "@/lib/text";

/**
 * Esquema compartido por el formulario de Miembro (cliente, vía `zodResolver`)
 * y las server actions `createMiembro` / `updateMiembro`.
 */
export const miembroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .transform(tituloCase),
  fotoUrl: z
    .string()
    .trim()
    .max(2000, "La URL de la foto es demasiado larga.")
    .refine(
      (v) => v === "" || /^https?:\/\//.test(v),
      "La foto debe ser una URL válida.",
    ),
  servicioIds: z
    .array(z.string().min(1))
    .min(1, "Elegí al menos un servicio que pueda dar."),
});

export type MiembroFormValues = z.infer<typeof miembroSchema>;
