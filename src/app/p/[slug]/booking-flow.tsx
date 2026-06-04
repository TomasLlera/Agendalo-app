"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Check, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { datosClienteSchema, type DatosCliente } from "@/lib/booking/validate";

export type ServicioPublico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionMinutos: number;
  precio: string;
  moneda: string;
  requierePago: boolean;
};

type Slot = { inicioISO: string; etiqueta: string; finEtiqueta: string };

const PASOS = ["Servicio", "Día", "Horario", "Datos"] as const;
/** Cantidad de días hacia adelante ofrecidos para reservar. */
const DIAS_DISPONIBLES = 21;

function formatearPrecio(precio: string, moneda: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
  }).format(Number(precio));
}

export function BookingFlow({
  slug,
  servicios,
}: {
  slug: string;
  servicios: ServicioPublico[];
}) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [servicio, setServicio] = useState<ServicioPublico | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  /** Fechas con al menos un horario libre. `null` mientras se consultan. */
  const [diasDisponibles, setDiasDisponibles] = useState<Set<string> | null>(
    null,
  );
  const [slot, setSlot] = useState<Slot | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DatosCliente>({
    resolver: zodResolver(datosClienteSchema),
    defaultValues: { nombre: "", telefono: "", email: "", notas: "" },
  });
  const watchEmail = useWatch({ control, name: "email" });

  const hoy = new Date();
  const dias = Array.from({ length: DIAS_DISPONIBLES }, (_, i) =>
    addDays(hoy, i),
  );

  async function cargarDisponibilidad(s: ServicioPublico) {
    setDiasDisponibles(null);
    const desde = format(dias[0], "yyyy-MM-dd");
    try {
      const res = await fetch(
        `/api/profesional/${slug}/disponibilidad?desde=${desde}&dias=${DIAS_DISPONIBLES}&servicioId=${s.id}`,
      );
      const data = await res.json();
      setDiasDisponibles(
        res.ok && Array.isArray(data.dias)
          ? new Set<string>(data.dias)
          : new Set<string>(),
      );
    } catch {
      // Ante un error dejamos todos los días habilitados: el paso Horario
      // sigue validando la disponibilidad real.
      setDiasDisponibles(new Set<string>());
    }
  }

  function elegirServicio(s: ServicioPublico) {
    setServicio(s);
    setFecha(null);
    setSlots(null);
    setSlot(null);
    setPaso(1);
    void cargarDisponibilidad(s);
  }

  async function elegirFecha(valor: string) {
    setFecha(valor);
    setSlot(null);
    setSlots(null);
    setPaso(2);
    if (!servicio) return;
    setCargandoSlots(true);
    try {
      const res = await fetch(
        `/api/profesional/${slug}/slots?date=${valor}&servicioId=${servicio.id}`,
      );
      const data = await res.json();
      setSlots(res.ok && Array.isArray(data.slots) ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  }

  function elegirSlot(s: Slot) {
    setSlot(s);
    setErrorEnvio(null);
    setPaso(3);
  }

  async function onSubmit(datos: DatosCliente) {
    if (!servicio || !slot) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profesionalSlug: slug,
          servicioId: servicio.id,
          fechaInicio: slot.inicioISO,
          cliente: datos,
        }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (res.status === 201) {
        const respuesta = (data ?? {}) as {
          turnoId?: unknown;
        };
        // Siempre vamos a la confirmación: ella decide si monta el Wallet
        // Brick (MP embebido), muestra los datos bancarios (transferencia)
        // o sólo confirma (efectivo / sin pago). Evita salir de Agendalo
        // cuando el profesional tiene MP conectado con public_key.
        const turnoId = respuesta.turnoId ? String(respuesta.turnoId) : "";
        router.push(`/p/${slug}/confirmacion?turnoId=${turnoId}`);
        return;
      }
      const mensaje =
        data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : "No se pudo crear la reserva.";
      setErrorEnvio(mensaje);
    } catch {
      setErrorEnvio("No se pudo conectar. Intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="ring-gradient-brand glow-violet relative rounded-2xl border border-border/70 bg-surface">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-1 border-b border-border px-4 py-3">
        {PASOS.map((nombre, i) => {
          const completado = i < paso;
          const actual = i === paso;
          return (
            <button
              key={nombre}
              type="button"
              disabled={i >= paso}
              onClick={() => i < paso && setPaso(i)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-1 py-1 text-xs transition-colors",
                actual && "text-foreground",
                completado && "text-muted-foreground hover:text-foreground",
                !actual && !completado && "text-subtle",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                  actual && "bg-gradient-brand font-medium text-white shadow-sm",
                  completado && "bg-surface-elevated text-secondary",
                  !actual && !completado && "bg-surface-elevated",
                )}
              >
                {completado ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{nombre}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {/* Paso 1 — Servicio */}
        {paso === 0 ? (
          <div className="flex flex-col gap-2">
            {servicios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => elegirServicio(s)}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:bg-surface-elevated hover:shadow-[0_0_30px_-12px_rgba(124,58,237,0.5)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{s.nombre}</span>
                  <span className="shrink-0 rounded-full bg-secondary/10 px-2.5 py-1 text-sm font-semibold text-secondary">
                    {formatearPrecio(s.precio, s.moneda)}
                  </span>
                </div>
                {s.descripcion ? (
                  <span className="text-sm text-muted-foreground">
                    {s.descripcion}
                  </span>
                ) : null}
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-subtle">
                  <Clock className="size-3.5" strokeWidth={1.5} />
                  {s.duracionMinutos} min
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Paso 2 — Día */}
        {paso === 1 ? (
          <div>
            <BotonVolver onClick={() => setPaso(0)} />
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {dias.map((dia) => {
                const valor = format(dia, "yyyy-MM-dd");
                // Hasta que llega la disponibilidad dejamos todo habilitado.
                const sinCupo =
                  diasDisponibles !== null && !diasDisponibles.has(valor);
                return (
                  <button
                    key={valor}
                    type="button"
                    disabled={sinCupo}
                    onClick={() => elegirFecha(valor)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg border border-border bg-background py-2.5 transition-colors",
                      sinCupo
                        ? "cursor-not-allowed opacity-40"
                        : "hover:border-secondary/50",
                    )}
                  >
                    <span className="text-[11px] capitalize text-muted-foreground">
                      {format(dia, "EEE", { locale: es })}
                    </span>
                    <span className="text-base font-medium">
                      {format(dia, "d")}
                    </span>
                    <span className="text-[11px] capitalize text-subtle">
                      {format(dia, "MMM", { locale: es })}
                    </span>
                  </button>
                );
              })}
            </div>
            {diasDisponibles !== null && diasDisponibles.size === 0 ? (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                No hay horarios disponibles en los próximos días.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Paso 3 — Horario */}
        {paso === 2 ? (
          <div>
            <BotonVolver onClick={() => setPaso(1)} />
            {fecha ? (
              <p className="mt-3 text-sm capitalize text-muted-foreground">
                {format(new Date(`${fecha}T12:00:00`), "EEEE d 'de' MMMM", {
                  locale: es,
                })}
              </p>
            ) : null}
            {cargandoSlots ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Buscando horarios…
              </div>
            ) : slots && slots.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s.inicioISO}
                    type="button"
                    onClick={() => elegirSlot(s)}
                    className="rounded-lg border border-border bg-background py-2 text-sm transition-colors hover:border-secondary/50"
                  >
                    {s.etiqueta}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay horarios disponibles este día.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setPaso(1)}
                >
                  Elegir otra fecha
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {/* Paso 4 — Datos */}
        {paso === 3 && servicio && slot && fecha ? (
          <div>
            <BotonVolver onClick={() => setPaso(2)} />
            <div className="mt-3 rounded-lg border border-border bg-background p-3 text-sm">
              <p className="font-medium">{servicio.nombre}</p>
              <p className="mt-0.5 capitalize text-muted-foreground">
                {format(new Date(`${fecha}T12:00:00`), "EEEE d 'de' MMMM", {
                  locale: es,
                })}{" "}
                · {slot.etiqueta}–{slot.finEtiqueta} h
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {formatearPrecio(servicio.precio, servicio.moneda)}
                {servicio.requierePago ? " · Requiere pago" : ""}
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 flex flex-col gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre y apellido</Label>
                <Input
                  id="nombre"
                  {...register("nombre")}
                  aria-invalid={!!errors.nombre}
                  placeholder="Juan Pérez"
                />
                {errors.nombre ? (
                  <p className="text-sm text-destructive">
                    {errors.nombre.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono (WhatsApp)</Label>
                <Input
                  id="telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register("telefono")}
                  aria-invalid={!!errors.telefono}
                  placeholder="+54"
                />
                {errors.telefono ? (
                  <p className="text-sm text-destructive">
                    {errors.telefono.message}
                  </p>
                ) : (
                  <p className="text-xs text-subtle">
                    Con código de país (+54). Podés usar espacios.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  placeholder="juan@example.com"
                />
                {errors.email ? (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notas">Notas (opcional)</Label>
                <Textarea
                  id="notas"
                  rows={2}
                  {...register("notas")}
                  aria-invalid={!!errors.notas}
                  placeholder="Algo que el profesional deba saber."
                />
                {errors.notas ? (
                  <p className="text-sm text-destructive">
                    {errors.notas.message}
                  </p>
                ) : null}
              </div>

              {errorEnvio ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorEnvio}
                </p>
              ) : null}

              <Button type="submit" disabled={enviando}>
                {enviando
                  ? "Reservando…"
                  : servicio.requierePago
                    ? "Reservar y pagar"
                    : "Confirmar reserva"}
              </Button>
              <p className="text-center text-xs text-subtle">
                Te enviamos la confirmación por WhatsApp
                {watchEmail ? " y email" : ""}.
              </p>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BotonVolver({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" strokeWidth={1.5} />
      Volver
    </button>
  );
}
