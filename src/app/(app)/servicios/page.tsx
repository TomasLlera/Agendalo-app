import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ServicioCard } from "./servicio-card";

export const metadata: Metadata = {
  title: "Servicios — Agendalo",
};

export default async function ServiciosPage() {
  const profesional = await getCurrentProfesional();
  const servicios = await prisma.servicio.findMany({
    where: { profesionalId: profesional.id, activo: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Servicios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lo que tus clientes pueden reservar en tu página pública.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/servicios/nuevo" />}>
          <Plus strokeWidth={1.5} />
          Nuevo servicio
        </Button>
      </header>

      {servicios.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no tenés servicios cargados.
          </p>
          <p className="mt-1 text-xs text-subtle">
            Creá tu primer servicio para empezar a recibir reservas.
          </p>
          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/servicios/nuevo" />}
          >
            <Plus strokeWidth={1.5} />
            Crear primer servicio
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((servicio) => (
            <ServicioCard
              key={servicio.id}
              servicio={{
                id: servicio.id,
                nombre: servicio.nombre,
                descripcion: servicio.descripcion,
                duracionMinutos: servicio.duracionMinutos,
                precio: servicio.precio.toString(),
                moneda: servicio.moneda,
                requierePago: servicio.requierePago,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
