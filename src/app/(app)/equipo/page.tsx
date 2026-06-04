import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Sparkles, Users } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { isPro } from "@/lib/plan";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MiembroCard } from "./miembro-card";

export const metadata: Metadata = {
  title: "Equipo — Agendalo",
};

export default async function EquipoPage() {
  const profesional = await getCurrentProfesional();
  const esPro = isPro(profesional);

  // El equipo es una funcionalidad Pro: en Free mostramos un upsell.
  if (!esPro) {
    return (
      <section>
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sumá a las personas que atienden y elegí qué servicios da cada una.
          </p>
        </header>

        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-secondary/30">
            <Sparkles className="size-5 text-secondary" strokeWidth={1.5} />
          </span>
          <p className="mt-4 text-sm font-medium">
            Trabajá con varios profesionales
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Con el plan Pro podés sumar peluqueros, profesionales de salud o
            cualquier persona de tu equipo, asignarle servicios y llevar el
            control de sus turnos.
          </p>
          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/configuracion/plan" />}
          >
            <Sparkles strokeWidth={1.5} />
            Pasar a Pro
          </Button>
        </div>
      </section>
    );
  }

  const [miembros, servicios] = await Promise.all([
    prisma.miembro.findMany({
      where: { profesionalId: profesional.id, activo: true },
      orderBy: { createdAt: "asc" },
      include: {
        servicios: {
          include: { servicio: { select: { id: true, nombre: true } } },
        },
      },
    }),
    prisma.servicio.findMany({
      where: { profesionalId: profesional.id, activo: true },
      select: { id: true },
    }),
  ]);

  const sinServicios = servicios.length === 0;

  return (
    <section>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Las personas que atienden y los servicios que da cada una.
          </p>
        </div>
        {!sinServicios ? (
          <Button nativeButton={false} render={<Link href="/equipo/nuevo" />}>
            <Plus strokeWidth={1.5} />
            Nuevo miembro
          </Button>
        ) : null}
      </header>

      {sinServicios ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Primero creá tus servicios.
          </p>
          <p className="mt-1 text-xs text-subtle">
            Cada miembro del equipo se asocia a los servicios que puede dar.
          </p>
          <Button
            className="mt-5"
            variant="outline"
            nativeButton={false}
            render={<Link href="/servicios/nuevo" />}
          >
            <Plus strokeWidth={1.5} />
            Crear un servicio
          </Button>
        </div>
      ) : miembros.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-secondary/30">
            <Users className="size-5 text-muted-foreground" strokeWidth={1.5} />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Todavía no sumaste a nadie a tu equipo.
          </p>
          <p className="mt-1 text-xs text-subtle">
            Agregá a las personas que atienden para repartir los turnos.
          </p>
          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/equipo/nuevo" />}
          >
            <Plus strokeWidth={1.5} />
            Sumar primer miembro
          </Button>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {miembros.map((miembro) => (
            <MiembroCard
              key={miembro.id}
              miembro={{
                id: miembro.id,
                nombre: miembro.nombre,
                fotoUrl: miembro.fotoUrl,
                servicios: miembro.servicios.map((ms) => ms.servicio.nombre),
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
