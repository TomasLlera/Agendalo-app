import type { Metadata } from "next";
import { getCurrentProfesional } from "@/lib/auth";
import { PerfilForm } from "./perfil-form";

export const metadata: Metadata = {
  title: "Perfil — Agendalo",
};

export default async function PerfilPage() {
  const profesional = await getCurrentProfesional();

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Así te ven tus clientes en tu página pública de reservas.
        </p>
      </header>

      <div className="mt-8">
        <PerfilForm
          perfil={{
            nombre: profesional.nombre,
            slug: profesional.slug,
            descripcion: profesional.descripcion,
            timezone: profesional.timezone,
            fotoUrl: profesional.fotoUrl,
          }}
          appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
        />
      </div>
    </div>
  );
}
