import type { Metadata } from "next";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HorariosForm } from "./horarios-form";
import { BloqueosSection, type BloqueoItem } from "./bloqueos-section";

export const metadata: Metadata = {
  title: "Horarios — Agendalo",
};

/** Arma la etiqueta de rango de un bloqueo en la zona horaria del profesional. */
function rangoBloqueo(
  inicio: Date,
  fin: Date,
  timezone: string,
): string {
  const fmt = (d: Date) =>
    formatInTimeZone(d, timezone, "d 'de' MMM yyyy", { locale: es });
  const desde = fmt(inicio);
  const hasta = fmt(fin);
  return desde === hasta ? desde : `${desde} — ${hasta}`;
}

export default async function HorariosPage() {
  const profesional = await getCurrentProfesional();

  const [horarios, bloqueos] = await Promise.all([
    prisma.horarioDisponible.findMany({
      where: { profesionalId: profesional.id },
    }),
    prisma.bloqueo.findMany({
      where: { profesionalId: profesional.id, fechaFin: { gte: new Date() } },
      orderBy: { fechaInicio: "asc" },
    }),
  ]);

  const bloqueosItems: BloqueoItem[] = bloqueos.map((b) => ({
    id: b.id,
    rango: rangoBloqueo(b.fechaInicio, b.fechaFin, profesional.timezone),
    motivo: b.motivo,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Horarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Definí cuándo atendés y qué días no estás disponible.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium">Horarios de atención</h2>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Hasta 2 franjas por día (por ejemplo, mañana y tarde).
        </p>
        <HorariosForm
          horarios={horarios.map((h) => ({
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
          }))}
        />
      </section>

      <section>
        <h2 className="text-sm font-medium">Bloqueos y vacaciones</h2>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">
          Días en los que no vas a recibir turnos.
        </p>
        <BloqueosSection bloqueos={bloqueosItems} />
      </section>
    </div>
  );
}
