import type { Metadata } from "next";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarX, Phone, User2 } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Turnos cancelados — Agendalo",
};

const TOPE = 100;

export default async function CanceladosPage() {
  const profesional = await getCurrentProfesional();
  const tz = profesional.timezone;
  const ahora = new Date();

  const turnos = await prisma.turno.findMany({
    where: { profesionalId: profesional.id, estado: "CANCELADO" },
    orderBy: { fechaInicio: "desc" },
    take: TOPE,
    select: {
      id: true,
      fechaInicio: true,
      clienteNombre: true,
      clienteTelefono: true,
      servicio: { select: { nombre: true } },
    },
  });

  // Agrupar por mes (en la TZ del profesional) para una lista escaneo fácil.
  const grupos = new Map<
    string,
    {
      etiquetaMes: string;
      turnos: Array<{
        id: string;
        clienteNombre: string;
        clienteTelefono: string;
        servicioNombre: string;
        fechaTexto: string;
        horaTexto: string;
        futuro: boolean;
      }>;
    }
  >();

  for (const t of turnos) {
    const mesKey = formatInTimeZone(t.fechaInicio, tz, "yyyy-MM");
    const grupo = grupos.get(mesKey);
    const fila = {
      id: t.id,
      clienteNombre: t.clienteNombre,
      clienteTelefono: t.clienteTelefono,
      servicioNombre: t.servicio.nombre,
      fechaTexto: formatInTimeZone(t.fechaInicio, tz, "EEE d 'de' MMM", {
        locale: es,
      }),
      horaTexto: formatInTimeZone(t.fechaInicio, tz, "HH:mm"),
      futuro: t.fechaInicio.getTime() > ahora.getTime(),
    };
    if (grupo) {
      grupo.turnos.push(fila);
    } else {
      grupos.set(mesKey, {
        etiquetaMes: formatInTimeZone(t.fechaInicio, tz, "MMMM yyyy", {
          locale: es,
        }),
        turnos: [fila],
      });
    }
  }

  const listaGrupos = Array.from(grupos.values());

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Turnos cancelados
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {turnos.length === 0
            ? "Acá vas a ver los turnos que se cancelaron."
            : `${turnos.length} ${
                turnos.length === 1 ? "turno cancelado" : "turnos cancelados"
              }${turnos.length === TOPE ? " (últimos 100)" : ""}.`}
        </p>
      </header>

      {turnos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarX className="size-6" strokeWidth={1.5} />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            No hay turnos cancelados.
          </p>
          <p className="mt-1 text-xs text-subtle">
            Cuando vos o un cliente cancelen un turno, va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {listaGrupos.map((g) => (
            <div key={g.etiquetaMes} className="flex flex-col gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground first-letter:uppercase">
                <span className="capitalize">{g.etiquetaMes}</span>
              </h2>
              <ul className="overflow-hidden rounded-xl border border-border bg-surface">
                {g.turnos.map((turno, i) => (
                  <li
                    key={turno.id}
                    className={
                      i !== 0
                        ? "flex items-start gap-4 border-t border-border px-4 py-3 sm:items-center"
                        : "flex items-start gap-4 px-4 py-3 sm:items-center"
                    }
                  >
                    <div className="flex w-24 shrink-0 flex-col">
                      <span className="text-sm font-medium capitalize text-muted-foreground line-through">
                        {turno.fechaTexto}
                      </span>
                      <span className="text-[11px] text-subtle">
                        {turno.horaTexto} h
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                        <User2
                          className="size-3.5 text-muted-foreground"
                          strokeWidth={1.5}
                        />
                        <span className="truncate">{turno.clienteNombre}</span>
                      </span>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="truncate">{turno.servicioNombre}</span>
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" strokeWidth={1.5} />
                          {turno.clienteTelefono}
                        </span>
                      </div>
                    </div>
                    {turno.futuro ? (
                      <span className="ml-auto shrink-0 rounded-md border border-amber-500/40 px-2 py-0.5 text-[11px] text-amber-500">
                        Era a futuro
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
