import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRECIO_PRO_ARS } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Precios — Agendalo",
  description:
    "Plan Free gratis para siempre. Plan Pro con recordatorios por WhatsApp y cobros con Mercado Pago.",
};

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type Fila = {
  feature: string;
  detalle?: string;
  free: boolean | string;
  pro: boolean | string;
};

const FILAS: Fila[] = [
  {
    feature: "Página pública con tu link",
    detalle: "agendalo.app/p/tu-slug",
    free: true,
    pro: true,
  },
  {
    feature: "Servicios cargados",
    free: "Ilimitados",
    pro: "Ilimitados",
  },
  {
    feature: "Horarios y bloqueos",
    free: true,
    pro: true,
  },
  {
    feature: "Reservas online (sin auth para el cliente)",
    free: true,
    pro: true,
  },
  {
    feature: "Recordatorios por WhatsApp",
    detalle: "24 h y 1 h antes del turno",
    free: false,
    pro: true,
  },
  {
    feature: "Cobros y señas con Mercado Pago",
    detalle: "La plata cae directo en tu cuenta",
    free: false,
    pro: true,
  },
  {
    feature: "Cancelación con aviso por email",
    free: true,
    pro: true,
  },
  {
    feature: "Soporte",
    free: "Email",
    pro: "Email prioritario",
  },
];

const FAQ_ITEMS = [
  {
    q: "¿Cuándo me cobran?",
    a: "El plan Free no se cobra nunca. Si activás Pro, Mercado Pago debita el primer mes al confirmar la suscripción y después una vez al mes en la misma fecha.",
  },
  {
    q: "¿Qué pasa si cancelo el plan Pro?",
    a: "Mantenés el acceso Pro hasta el final del ciclo ya pagado. Después tu cuenta vuelve a Free automáticamente y conservás todos tus turnos, servicios y configuración.",
  },
  {
    q: "¿Tiene costo extra cada recordatorio de WhatsApp?",
    a: "No. El plan Pro incluye todos los recordatorios automáticos, sin límite de envíos por mes.",
  },
  {
    q: "¿Agendalo se queda con una comisión por cada cobro?",
    a: "No. La única comisión es la que Mercado Pago aplica por cada transacción, según el medio de pago que use tu cliente. Agendalo nunca toca tu dinero.",
  },
  {
    q: "¿Puedo emitir factura de mi suscripción?",
    a: "Sí. Solicitanos la factura de tu plan Pro escribiendo a hola@agendalo.app y te la enviamos por mail.",
  },
];

export default function PreciosPage() {
  const precio = formatoARS.format(PRECIO_PRO_ARS);

  return (
    <>
      <section className="mx-auto w-full max-w-[1100px] px-6 pt-16 pb-12 text-center sm:pt-24">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Gratis para empezar. Pro para crecer.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Sin contrato y sin tarjeta para empezar. Cancelás cuando quieras, sin penalidades.
        </p>
      </section>

      <section className="mx-auto w-full max-w-[1100px] px-6 pb-12">
        <div className="grid gap-4 md:grid-cols-2">
          <PlanCard
            nombre="Free"
            precio="$ 0"
            sufijo="para siempre"
            descripcion="Lo necesario para tener tu agenda online y empezar a recibir reservas."
            cta="Empezar gratis"
            variantCta="outline"
          />
          <PlanCard
            nombre="Pro"
            precio={precio}
            sufijo="por mes"
            descripcion="Reducí las ausencias con recordatorios por WhatsApp y cobrá online con Mercado Pago."
            cta="Probar Pro"
            destacado
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] px-6 pb-20">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[1fr_140px_140px] border-b border-border bg-surface-elevated px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr_180px_180px]">
            <span>Características</span>
            <span className="text-center">Free</span>
            <span className="text-center">Pro</span>
          </div>
          <ul>
            {FILAS.map((fila, i) => (
              <li
                key={fila.feature}
                className={
                  "grid grid-cols-[1fr_140px_140px] items-start gap-3 px-5 py-3 text-sm sm:grid-cols-[1fr_180px_180px]" +
                  (i !== 0 ? " border-t border-border" : "")
                }
              >
                <div>
                  <p className="font-medium">{fila.feature}</p>
                  {fila.detalle ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fila.detalle}
                    </p>
                  ) : null}
                </div>
                <CeldaPlan valor={fila.free} />
                <CeldaPlan valor={fila.pro} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[760px] px-6 pb-24">
        <header className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Preguntas frecuentes
          </h2>
        </header>
        <div className="mt-8 flex flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-surface px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function PlanCard({
  nombre,
  precio,
  sufijo,
  descripcion,
  cta,
  destacado = false,
  variantCta = "default",
}: {
  nombre: string;
  precio: string;
  sufijo: string;
  descripcion: string;
  cta: string;
  destacado?: boolean;
  variantCta?: "default" | "outline";
}) {
  return (
    <div
      className={
        "flex flex-col rounded-2xl border bg-surface p-6 " +
        (destacado
          ? "border-secondary/40 ring-1 ring-secondary/20"
          : "border-border")
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{nombre}</h2>
        {destacado ? <Badge variant="secondary">Recomendado</Badge> : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>
      <p className="mt-6">
        <span className="text-3xl font-semibold">{precio}</span>
        <span className="ml-1 text-sm text-muted-foreground">{sufijo}</span>
      </p>
      <Button
        className="mt-6"
        size="lg"
        variant={variantCta}
        nativeButton={false}
        render={<Link href="/sign-up" />}
      >
        {cta}
      </Button>
    </div>
  );
}

function CeldaPlan({ valor }: { valor: boolean | string }) {
  if (typeof valor === "string") {
    return <span className="text-center text-sm">{valor}</span>;
  }
  return (
    <span className="flex justify-center">
      {valor ? (
        <Check className="size-4 text-success" strokeWidth={1.5} />
      ) : (
        <Minus className="size-4 text-subtle" strokeWidth={1.5} />
      )}
    </span>
  );
}
