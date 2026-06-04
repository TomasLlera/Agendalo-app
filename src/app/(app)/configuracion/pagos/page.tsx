import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CreditCard, Crown } from "lucide-react";
import { getCurrentProfesional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPro } from "@/lib/plan";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { conectarMercadoPago, desconectarMercadoPago } from "./actions";
import { DatosBancariosForm } from "./datos-bancarios-form";

export const metadata: Metadata = {
  title: "Pagos — Agendalo",
};

const MENSAJES_ERROR: Record<string, string> = {
  oauth: "No se completó la conexión con Mercado Pago. Intentá de nuevo.",
  state: "La conexión no pudo validarse. Volvé a intentarlo.",
  token: "Mercado Pago rechazó la conexión. Intentá de nuevo.",
};

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ conectado?: string; error?: string }>;
}) {
  const profesional = await getCurrentProfesional();
  const { conectado, error } = await searchParams;
  const estaConectado = Boolean(profesional.mpAccessToken);
  const pro = isPro(profesional);
  const mensajeError = error ? MENSAJES_ERROR[error] : undefined;

  const datosBancarios = await prisma.datosBancarios.findUnique({
    where: { profesionalId: profesional.id },
  });
  const datosDefaults = {
    cbu: datosBancarios?.cbu ?? "",
    alias: datosBancarios?.alias ?? "",
    banco: datosBancarios?.banco ?? "",
    titular: datosBancarios?.titular ?? "",
    cuit: datosBancarios?.cuit ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pagos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conectá tu cuenta de Mercado Pago para cobrarles a tus clientes al
          reservar.
        </p>
      </header>

      {conectado ? (
        <p className="mt-6 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          Tu cuenta de Mercado Pago quedó conectada.
        </p>
      ) : null}
      {mensajeError ? (
        <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mensajeError}
        </p>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mercado Pago</CardTitle>
          <CardDescription>
            Los servicios marcados como “requiere pago” cobran a través de tu
            cuenta conectada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pro ? (
            // Free (no admin): nunca exponemos la conexión MP, ni siquiera si
            // quedó un token de antes. Solo el CTA a Pro. Transferencia sigue
            // disponible en la tarjeta de abajo.
            <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-background/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Crown className="size-4 text-secondary" strokeWidth={1.5} />
                Cobrar online es parte de Pro
              </div>
              <p className="text-sm text-muted-foreground">
                Conectá Mercado Pago para cobrar señas o el total al reservar.
                Disponible en el plan Pro. En Free podés cobrar por
                transferencia.
              </p>
              <Link
                href="/configuracion/plan"
                className={cn(buttonVariants(), "mt-1")}
              >
                <Crown strokeWidth={1.5} />
                Pasar a Pro
              </Link>
            </div>
          ) : estaConectado ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="size-4" strokeWidth={1.5} />
                Cuenta conectada
                {profesional.mpUserId ? (
                  <span className="text-muted-foreground">
                    (ID {profesional.mpUserId})
                  </span>
                ) : null}
              </div>
              <form action={desconectarMercadoPago}>
                <Button type="submit" variant="outline">
                  Desconectar
                </Button>
              </form>
            </div>
          ) : (
            <form action={conectarMercadoPago}>
              <Button type="submit">
                <CreditCard strokeWidth={1.5} />
                Conectar Mercado Pago
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Datos bancarios</CardTitle>
          <CardDescription>
            Para los servicios con método “Transferencia”. Se muestran al
            cliente al confirmar la reserva para que te transfiera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatosBancariosForm defaults={datosDefaults} />
        </CardContent>
      </Card>
    </div>
  );
}
