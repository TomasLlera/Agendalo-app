import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookingFlow, type ServicioPublico } from "./booking-flow";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profesional = await prisma.profesional.findUnique({
    where: { slug },
    select: { nombre: true, descripcion: true },
  });
  if (!profesional) {
    return { title: "Perfil no encontrado — Agendalo" };
  }
  const titulo = `${profesional.nombre} — Reservá tu turno`;
  const descripcion =
    profesional.descripcion ??
    `Reservá un turno online con ${profesional.nombre}.`;
  return {
    title: titulo,
    description: descripcion,
    openGraph: { title: titulo, description: descripcion },
  };
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { slug } = await params;

  const profesional = await prisma.profesional.findUnique({
    where: { slug },
    include: {
      servicios: { where: { activo: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!profesional) notFound();

  const servicios: ServicioPublico[] = profesional.servicios.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    duracionMinutos: s.duracionMinutos,
    precio: s.precio.toString(),
    moneda: s.moneda,
    requierePago: s.requierePago,
  }));

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-10">
      <header className="flex flex-col items-center text-center">
        <Avatar size="lg" className="size-20">
          {profesional.fotoUrl ? (
            <AvatarImage src={profesional.fotoUrl} alt={profesional.nombre} />
          ) : null}
          <AvatarFallback className="text-2xl">
            {profesional.nombre.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          {profesional.nombre}
        </h1>
        {profesional.descripcion ? (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {profesional.descripcion}
          </p>
        ) : null}
      </header>

      <div className="mt-8">
        {servicios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Este profesional todavía no publicó servicios para reservar.
            </p>
          </div>
        ) : (
          <BookingFlow slug={slug} servicios={servicios} />
        )}
      </div>
    </main>
  );
}
