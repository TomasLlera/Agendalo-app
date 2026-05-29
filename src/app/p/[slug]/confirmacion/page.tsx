import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { CalendarCheck, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reserva — Agendalo",
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ turnoId?: string }>;
};

function Detalle({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{valor}</span>
    </div>
  );
}

export default async function ConfirmacionPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { turnoId } = await searchParams;
  if (!turnoId) notFound();

  const turno = await prisma.turno.findUnique({
    where: { id: turnoId },
    include: { servicio: true, profesional: true },
  });
  if (!turno || turno.profesional.slug !== slug) notFound();

  const tz = turno.profesional.timezone;
  const pendientePago = turno.estado === "PENDIENTE_PAGO";
  const fechaTexto = formatInTimeZone(
    turno.fechaInicio,
    tz,
    "EEEE d 'de' MMMM yyyy",
    { locale: es },
  );
  const horaTexto = formatInTimeZone(turno.fechaInicio, tz, "HH:mm");
  const precioTexto = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: turno.servicio.moneda,
  }).format(Number(turno.servicio.precio));

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-16">
      <div className="flex flex-col items-center text-center">
        <span
          className={
            pendientePago
              ? "flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning"
              : "flex size-14 items-center justify-center rounded-full bg-success/10 text-success"
          }
        >
          {pendientePago ? (
            <Clock className="size-7" strokeWidth={1.5} />
          ) : (
            <CalendarCheck className="size-7" strokeWidth={1.5} />
          )}
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          {pendientePago
            ? "Reserva pendiente de pago"
            : "¡Reserva confirmada!"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {pendientePago
            ? "Tu turno queda reservado una vez completado el pago."
            : `Te esperamos, ${turno.clienteNombre.split(" ")[0]}.`}
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
        <Detalle
          label="Duración"
          valor={`${turno.servicio.duracionMinutos} min`}
        />
        <div className="border-t border-border" />
        <Detalle label="Precio" valor={precioTexto} />
        <div className="border-t border-border" />
        <Detalle label="A nombre de" valor={turno.clienteNombre} />
      </div>

      {pendientePago ? (
        <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          La integración con Mercado Pago se completa en el Step 10. Por ahora
          el turno queda en estado pendiente de pago.
        </p>
      ) : null}

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
