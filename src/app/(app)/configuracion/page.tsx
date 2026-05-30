import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CreditCard, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Configuración — Agendalo",
};

const SECCIONES = [
  {
    href: "/configuracion/pagos",
    icon: CreditCard,
    title: "Pagos",
    description:
      "Conectá Mercado Pago y cargá tus datos bancarios para cobrar por transferencia.",
  },
  {
    href: "/configuracion/plan",
    icon: Sparkles,
    title: "Plan",
    description:
      "Gestioná tu suscripción Pro: recordatorios por WhatsApp y más.",
  },
] as const;

export default function ConfiguracionPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos de la cuenta, pagos y plan.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        {SECCIONES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="block">
            <Card className="transition-colors hover:bg-muted/40">
              <CardContent className="flex items-center gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <div className="flex-1">
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="mt-0.5">
                    {description}
                  </CardDescription>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
