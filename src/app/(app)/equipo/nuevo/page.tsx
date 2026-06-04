import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { isPro } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { MiembroForm } from "../miembro-form";

export const metadata: Metadata = {
  title: "Nuevo miembro — Agendalo",
};

export default async function NuevoMiembroPage() {
  const profesional = await getCurrentProfesional();
  if (!isPro(profesional)) redirect("/equipo");

  const servicios = await prisma.servicio.findMany({
    where: { profesionalId: profesional.id, activo: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, nombre: true },
  });
  if (servicios.length === 0) redirect("/equipo");

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
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo miembro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sumá a alguien de tu equipo y elegí qué servicios puede dar.
        </p>
      </header>

      <div className="mt-8">
        <MiembroForm mode="crear" servicios={servicios} />
      </div>
    </div>
  );
}
