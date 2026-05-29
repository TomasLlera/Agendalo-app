import { z } from "zod";

/**
 * Validación de datos bancarios para cobrar por transferencia.
 *
 * Se exige al menos uno de `cbu` o `alias` — si no, no hay cómo cobrarle al
 * cliente. El resto de los campos son opcionales pero recomendados.
 */
export const datosBancariosSchema = z
  .object({
    cbu: z
      .string()
      .trim()
      .max(22, "El CBU son 22 dígitos.")
      .refine(
        (v) => v === "" || /^\d{22}$/.test(v),
        "CBU inválido: deben ser 22 dígitos.",
      ),
    alias: z
      .string()
      .trim()
      .max(20, "El alias no puede superar 20 caracteres.")
      .refine(
        (v) => v === "" || /^[A-Za-z0-9.\-]{6,20}$/.test(v),
        "Alias inválido: 6-20 caracteres alfanuméricos, puntos o guiones.",
      ),
    banco: z.string().trim().max(60, "Máximo 60 caracteres."),
    titular: z.string().trim().max(80, "Máximo 80 caracteres."),
    cuit: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^\d{11}$/.test(v),
        "CUIT inválido: deben ser 11 dígitos sin guiones.",
      ),
  })
  .refine((d) => d.cbu !== "" || d.alias !== "", {
    message: "Cargá al menos un CBU o un alias.",
    path: ["cbu"],
  });

export type DatosBancariosFormValues = z.infer<typeof datosBancariosSchema>;
