import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ServicioForm } from "../../servicio-form";

export const metadata: Metadata = {
  title: "Editar servicio — Agendalo",
};

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profesional = await getCurrentProfesional();

  const servicio = await prisma.servicio.findFirst({
    where: { id, profesionalId: profesional.id, activo: true },
  });
  if (!servicio) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/servicios"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        Servicios
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Editar servicio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actualizá los datos de “{servicio.nombre}”.
        </p>
      </header>

      <div className="mt-8">
        <ServicioForm
          mode="editar"
          servicio={{
            id: servicio.id,
            nombre: servicio.nombre,
            descripcion: servicio.descripcion ?? "",
            duracionMinutos: servicio.duracionMinutos,
            precio: servicio.precio.toString(),
            moneda: servicio.moneda,
            requierePago: servicio.requierePago,
            metodoPago: servicio.metodoPago,
          }}
        />
      </div>
    </div>
  );
}
