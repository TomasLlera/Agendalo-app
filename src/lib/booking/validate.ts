import { z } from "zod";

/** Teléfono en formato E.164: `+` seguido de 8 a 15 dígitos. */
const TELEFONO_RE = /^\+\d{8,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Datos que completa el cliente al reservar (paso "Datos" del flujo). */
export const datosClienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre.")
    .max(80, "El nombre es demasiado largo."),
  telefono: z
    .string()
    .trim()
    .regex(TELEFONO_RE, "Teléfono inválido. Usá el formato +5491155551234."),
  email: z
    .string()
    .trim()
    .max(120, "El email es demasiado largo.")
    .refine((v) => v === "" || EMAIL_RE.test(v), "Email inválido."),
  notas: z
    .string()
    .trim()
    .max(280, "Las notas no pueden superar los 280 caracteres."),
});

export type DatosCliente = z.infer<typeof datosClienteSchema>;

/** Cuerpo del `POST /api/reservas`. */
export const reservaSchema = z.object({
  profesionalSlug: z.string().min(1),
  servicioId: z.string().min(1),
  fechaInicio: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha de inicio inválida."),
  cliente: datosClienteSchema,
});

export type ReservaInput = z.infer<typeof reservaSchema>;
