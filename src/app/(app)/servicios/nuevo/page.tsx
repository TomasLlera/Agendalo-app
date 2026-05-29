import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ServicioForm } from "../servicio-form";

export const metadata: Metadata = {
  title: "Nuevo servicio — Agendalo",
};

export default function NuevoServicioPage() {
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
          Nuevo servicio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Definí qué ofrecés, cuánto dura y cuánto cuesta.
        </p>
      </header>

      <div className="mt-8">
        <ServicioForm mode="crear" />
      </div>
    </div>
  );
}
