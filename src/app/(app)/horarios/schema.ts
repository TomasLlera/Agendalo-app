import { z } from "zod";

/** `HH:mm` en formato 24 h. */
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** `YYYY-MM-DD` (valor de un `<input type="date">`). */
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Una franja horaria recurrente de un día de la semana. */
export const franjaSchema = z
  .object({
    diaSemana: z.number().int().min(0).max(6),
    horaInicio: z.string().regex(HORA_RE, "Hora de inicio inválida."),
    horaFin: z.string().regex(HORA_RE, "Hora de fin inválida."),
  })
  .refine((f) => f.horaInicio < f.horaFin, {
    message: "Cada franja debe terminar después de empezar.",
    path: ["horaFin"],
  });

/** Conjunto completo de franjas que `setHorarios` reemplaza de una vez. */
export const horariosSchema = z.array(franjaSchema).max(14);

export type FranjaInput = z.infer<typeof franjaSchema>;

/** Datos de un bloqueo (vacaciones / franja no disponible). */
export const bloqueoSchema = z
  .object({
    fechaInicio: z.string().regex(FECHA_RE, "Elegí una fecha de inicio."),
    fechaFin: z.string().regex(FECHA_RE, "Elegí una fecha de fin."),
    motivo: z
      .string()
      .trim()
      .max(120, "El motivo no puede superar los 120 caracteres."),
  })
  .refine((b) => b.fechaInicio <= b.fechaFin, {
    message: "La fecha de fin no puede ser anterior al inicio.",
    path: ["fechaFin"],
  });

export type BloqueoFormValues = z.infer<typeof bloqueoSchema>;
