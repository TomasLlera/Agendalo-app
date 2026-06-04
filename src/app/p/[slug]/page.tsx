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
      servicios: {
        where: { activo: true },
        orderBy: { createdAt: "asc" },
        include: {
          miembros: {
            where: { miembro: { activo: true } },
            include: {
              miembro: { select: { id: true, nombre: true, fotoUrl: true } },
            },
          },
        },
      },
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
    miembros: s.miembros.map((ms) => ({
      id: ms.miembro.id,
      nombre: ms.miembro.nombre,
      fotoUrl: ms.miembro.fotoUrl,
    })),
  }));

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 pb-16">
      <header className="relative flex flex-col items-center pt-12 text-center">
        {/* Bloom de luz de marca que florece detrás del avatar. Sin bordes
            duros: reemplaza la portada por un halo difuso que deriva lento. */}
        <div
          aria-hidden
          className="animate-gradient-drift pointer-events-none absolute -top-4 left-1/2 -z-10 h-56 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.5),rgba(6,182,212,0.22),transparent_70%)] blur-2xl"
        />

        {/* Avatar con anillo de gradiente y un fino corte de fondo. */}
        <div className="glow-violet rounded-full bg-gradient-brand p-[3px] shadow-xl">
          <div className="rounded-full bg-background p-[3px]">
            <Avatar className="size-32">
              {profesional.fotoUrl ? (
                <AvatarImage
                  src={profesional.fotoUrl}
                  alt={profesional.nombre}
                />
              ) : null}
              <AvatarFallback className="bg-surface-elevated text-2xl text-secondary">
                {profesional.nombre.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {profesional.nombre}
        </h1>
        {profesional.descripcion ? (
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            {profesional.descripcion}
          </p>
        ) : null}

        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          Reservá tu turno online
        </span>
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
