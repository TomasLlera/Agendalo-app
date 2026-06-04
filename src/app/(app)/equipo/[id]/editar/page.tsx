import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { isPro } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { MiembroForm } from "../../miembro-form";

export const metadata: Metadata = {
  title: "Editar miembro — Agendalo",
};

export default async function EditarMiembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profesional = await getCurrentProfesional();
  if (!isPro(profesional)) redirect("/equipo");

  const [miembro, servicios] = await Promise.all([
    prisma.miembro.findFirst({
      where: { id, profesionalId: profesional.id, activo: true },
      include: { servicios: { select: { servicioId: true } } },
    }),
    prisma.servicio.findMany({
      where: { profesionalId: profesional.id, activo: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, nombre: true },
    }),
  ]);
  if (!miembro) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/equipo"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Equipo
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar miembro
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actualizá los datos de “{miembro.nombre}”.
        </p>
      </header>

      <div className="mt-8">
        <MiembroForm
          mode="editar"
          servicios={servicios}
          miembro={{
            id: miembro.id,
            nombre: miembro.nombre,
            fotoUrl: miembro.fotoUrl ?? "",
            servicioIds: miembro.servicios.map((ms) => ms.servicioId),
          }}
        />
      </div>
    </div>
  );
}
