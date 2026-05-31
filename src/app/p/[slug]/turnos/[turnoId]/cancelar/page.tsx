import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarX, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CancelForm } from "./cancel-form";

export const metadata: Metadata = {
  title: "Cancelar turno — Agendalo",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug: string; turnoId: string }>;
  searchParams: Promise<{ token?: string }>;
};

function Detalle({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{valor}</span>
    </div>
  );
}

export default async function CancelarTurnoPage({
  params,
  searchParams,
}: PageProps) {
  const { slug, turnoId } = await params;
  const { token } = await searchParams;
  if (!token) notFound();

  const turno = await prisma.turno.findUnique({
    where: { id: turnoId },
    select: {
      id: true,
      cancelToken: true,
      estado: true,
      fechaInicio: true,
      clienteNombre: true,
      servicio: { select: { nombre: true } },
      profesional: { select: { nombre: true, slug: true, timezone: true } },
    },
  });

  // 404 genérico: token mismatch, turno inexistente, o slug del path no
  // coincide con el del profesional. No filtrar existencia de turnos.
  if (
    !turno ||
    !turno.cancelToken ||
    turno.cancelToken !== token ||
    turno.profesional.slug !== slug
  ) {
    notFound();
  }

  const tz = turno.profesional.timezone;
  const fechaTexto = formatInTimeZone(
    turno.fechaInicio,
    tz,
    "EEEE d 'de' MMMM yyyy",
    { locale: es },
  );
  const horaTexto = formatInTimeZone(turno.fechaInicio, tz, "HH:mm");
  const yaCancelado = turno.estado === "CANCELADO";
  const yaPaso = turno.fechaInicio.getTime() <= Date.now();

  if (yaCancelado || yaPaso) {
    const titulo = yaCancelado
      ? "Este turno ya estaba cancelado"
      : "Este turno ya pasó";
    const detalle = yaCancelado
      ? "Si querés reservar uno nuevo, podés hacerlo desde la página del profesional."
      : "Ya no se puede cancelar online un turno que comenzó. Si necesitás avisar, contactá al profesional.";

    return (
      <main className="mx-auto w-full max-w-[560px] px-5 py-16">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock className="size-7" strokeWidth={1.5} />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            {titulo}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{detalle}</p>
        </div>
        <Button
          className="mt-8 w-full"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/p/${slug}`} />}
        >
          Volver al perfil
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-16">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CalendarX className="size-7" strokeWidth={1.5} />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          ¿Cancelar tu turno?
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Estás por cancelar este turno. Esta acción no se puede deshacer.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface px-5 py-2">
        <Detalle label="Profesional" valor={turno.profesional.nombre} />
        <div className="border-t border-border" />
        <Detalle label="Servicio" valor={turno.servicio.nombre} />
        <div className="border-t border-border" />
        <Detalle label="Fecha" valor={fechaTexto} />
        <div className="border-t border-border" />
        <Detalle label="Hora" valor={`${horaTexto} h`} />
        <div className="border-t border-border" />
        <Detalle label="A nombre de" valor={turno.clienteNombre} />
      </div>

      <CancelForm slug={slug} turnoId={turno.id} token={token} />
    </main>
  );
}
