import type { Metadata } from "next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Crown, Sparkles } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isPro, PRECIO_PRO_ARS } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { cancelarSuscripcionPro, crearSuscripcionPro } from "./actions";

export const metadata: Metadata = {
  title: "Plan — Agendalo",
};

const MENSAJES_ERROR: Record<string, string> = {
  mp: "No pudimos iniciar la suscripción. Intentá de nuevo.",
  cancel: "No pudimos cancelar la suscripción. Intentá de nuevo.",
};

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{
    suscripcion?: string;
    error?: string;
    cancelada?: string;
  }>;
}) {
  const profesional = await getCurrentProfesional();
  const pro = isPro(profesional);
  const sp = await searchParams;
  const mensajeError = sp.error ? MENSAJES_ERROR[sp.error] : undefined;
  const precioStr = formatoARS.format(PRECIO_PRO_ARS);

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pasá a Pro para activar recordatorios automáticos por WhatsApp.
        </p>
      </header>

      {sp.suscripcion === "ok" ? (
        <p className="mt-6 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          Pago en proceso. Cuando Mercado Pago confirme, vas a quedar en Pro.
        </p>
      ) : null}
      {sp.cancelada === "ok" ? (
        <p className="mt-6 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          Pedimos la baja. En cuanto Mercado Pago la confirme, tu plan vuelve a
          Free.
        </p>
      ) : null}
      {mensajeError ? (
        <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mensajeError}
        </p>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pro ? (
                <Crown className="size-4 text-secondary" strokeWidth={1.5} />
              ) : (
                <Sparkles
                  className="size-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
              )}
              <CardTitle>{pro ? "Plan Pro" : "Plan Free"}</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              {pro ? `${precioStr} / mes` : "Gratis"}
            </span>
          </div>
          <CardDescription>
            {pro
              ? "Recordatorios automáticos por WhatsApp y todas las features."
              : "Reservás turnos con tu link, pero sin recordatorios WhatsApp."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="mb-6 space-y-2 text-sm">
            <Beneficio activo>Link público de reservas</Beneficio>
            <Beneficio activo>Pagos vía Mercado Pago</Beneficio>
            <Beneficio activo={pro}>
              Recordatorios por WhatsApp 24h y 1h antes
            </Beneficio>
            <Beneficio activo={pro}>Soporte prioritario</Beneficio>
          </ul>

          {pro ? (
            <>
              {profesional.planExpiresAt ? (
                <p className="mb-4 text-xs text-muted-foreground">
                  Próximo cobro:{" "}
                  {format(profesional.planExpiresAt, "d 'de' MMMM yyyy", {
                    locale: es,
                  })}
                </p>
              ) : null}
              <form action={cancelarSuscripcionPro}>
                <Button type="submit" variant="outline">
                  Cancelar suscripción
                </Button>
              </form>
            </>
          ) : (
            <form action={crearSuscripcionPro}>
              <Button type="submit">
                <Crown strokeWidth={1.5} />
                Pasar a Pro · {precioStr} / mes
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Beneficio({
  activo,
  children,
}: {
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        activo ? "text-foreground" : "text-subtle",
      )}
    >
      <CheckCircle2
        className={cn("size-4", activo ? "text-success" : "text-subtle")}
        strokeWidth={1.5}
      />
      {children}
    </li>
  );
}
