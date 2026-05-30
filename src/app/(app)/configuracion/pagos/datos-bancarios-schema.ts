import { z } from "zod";
import { sentenceCase } from "@/lib/text";

/**
 * Lista de bancos y billeteras virtuales más usadas en Argentina.
 * El value se persiste tal cual (el form puede mostrar la label).
 * "Otro" abre un input libre en el form.
 */
export const BANCOS = [
  { value: "Galicia", label: "Galicia" },
  { value: "Santander", label: "Santander" },
  { value: "BBVA", label: "BBVA" },
  { value: "Macro", label: "Macro" },
  { value: "Nación", label: "Nación" },
  { value: "Provincia", label: "Provincia" },
  { value: "Ciudad", label: "Ciudad" },
  { value: "Patagonia", label: "Patagonia" },
  { value: "Supervielle", label: "Supervielle" },
  { value: "Credicoop", label: "Credicoop" },
  { value: "ICBC", label: "ICBC" },
  { value: "HSBC", label: "HSBC" },
  { value: "Hipotecario", label: "Hipotecario" },
  { value: "Brubank", label: "Brubank" },
  { value: "Mercado Pago", label: "Mercado Pago" },
  { value: "Ualá", label: "Ualá" },
  { value: "Naranja X", label: "Naranja X" },
  { value: "Otro", label: "Otro (especificar)" },
] as const;

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
    titular: z
      .string()
      .trim()
      .max(80, "Máximo 80 caracteres.")
      .transform(sentenceCase),
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
