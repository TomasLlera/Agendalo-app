import { z } from "zod";
import Decimal from "decimal.js";

/** Duraciones ofrecidas para un servicio (en minutos). */
export const DURACIONES = [15, 30, 45, 60, 90, 120] as const;

/** Monedas soportadas para el precio de un servicio. */
export const MONEDAS = [
  { value: "ARS", label: "Peso argentino (ARS)" },
  { value: "USD", label: "Dólar (USD)" },
] as const;

const DURACION_VALUES: number[] = [...DURACIONES];
const MONEDA_VALUES: string[] = MONEDAS.map((m) => m.value);

/** Tope de un campo `Decimal(10, 2)`: 8 dígitos enteros + 2 decimales. */
const PRECIO_MAX = "99999999.99";

/**
 * Valida que el precio sea un número no negativo, finito y con como máximo
 * dos decimales. Usa decimal.js para evitar los errores de redondeo de los
 * floats — el mismo criterio con el que se persiste en `Decimal(10,2)`.
 */
export function precioValido(value: string): boolean {
  let d: Decimal;
  try {
    d = new Decimal(value);
  } catch {
    return false;
  }
  return (
    d.isFinite() &&
    d.greaterThanOrEqualTo(0) &&
    d.lessThanOrEqualTo(PRECIO_MAX) &&
    d.decimalPlaces() <= 2
  );
}

/**
 * Esquema compartido por el formulario de Servicio (cliente, vía
 * `zodResolver`) y las server actions `createServicio` / `updateServicio`.
 * El precio viaja como string para no perder precisión.
 */
export const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre no puede superar los 80 caracteres."),
  descripcion: z
    .string()
    .trim()
    .max(280, "La descripción no puede superar los 280 caracteres."),
  duracionMinutos: z
    .number()
    .refine((v) => DURACION_VALUES.includes(v), "Elegí una duración válida."),
  precio: z
    .string()
    .trim()
    .min(1, "Ingresá un precio.")
    .refine(
      precioValido,
      "Precio inválido: debe ser un número no negativo con hasta 2 decimales.",
    ),
  moneda: z
    .string()
    .refine((v) => MONEDA_VALUES.includes(v), "Elegí una moneda válida."),
  requierePago: z.boolean(),
});

export type ServicioFormValues = z.infer<typeof servicioSchema>;
