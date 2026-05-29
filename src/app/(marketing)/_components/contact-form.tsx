"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactoSchema = z.object({
  nombre: z.string().trim().min(2, "Tu nombre"),
  apellido: z.string().trim().min(2, "Tu apellido"),
  telefono: z
    .string()
    .trim()
    .min(6, "Tu teléfono"),
  email: z.string().trim().email("Email inválido"),
  descripcion: z
    .string()
    .trim()
    .min(10, "Contanos un poco más (mínimo 10 caracteres)")
    .max(1000, "Máximo 1000 caracteres"),
});

type ContactoForm = z.infer<typeof contactoSchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactoForm>({
    resolver: zodResolver(contactoSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      descripcion: "",
    },
  });

  const onSubmit = async (data: ContactoForm) => {
    setServerError(null);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setServerError(body?.error ?? "No pudimos enviar el mensaje.");
        return;
      }
      reset();
      setSent(true);
    } catch {
      setServerError("Error de red. Probá de nuevo.");
    }
  };

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="size-6 text-success" strokeWidth={1.75} />
        </span>
        <h3 className="mt-4 text-lg font-semibold">¡Mensaje enviado!</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Te respondo lo antes posible al mail que dejaste. Mientras tanto
          podés ir creando tu agenda gratis.
        </p>
        <Button
          className="mt-5"
          variant="outline"
          size="sm"
          onClick={() => setSent(false)}
        >
          Enviar otro
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto grid w-full max-w-[640px] gap-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Nombre"
          error={errors.nombre?.message}
          input={
            <input
              {...register("nombre")}
              type="text"
              autoComplete="given-name"
              placeholder="Mara"
              className={inputClass}
            />
          }
        />
        <Campo
          label="Apellido"
          error={errors.apellido?.message}
          input={
            <input
              {...register("apellido")}
              type="text"
              autoComplete="family-name"
              placeholder="López"
              className={inputClass}
            />
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Email"
          error={errors.email?.message}
          input={
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="mara@correo.com"
              className={inputClass}
            />
          }
        />
        <Campo
          label="Teléfono / WhatsApp"
          error={errors.telefono?.message}
          input={
            <input
              {...register("telefono")}
              type="tel"
              autoComplete="tel"
              placeholder="+54 11 5555 5555"
              className={inputClass}
            />
          }
        />
      </div>
      <Campo
        label="Contanos brevemente"
        error={errors.descripcion?.message}
        input={
          <textarea
            {...register("descripcion")}
            rows={4}
            placeholder="A qué te dedicás, qué buscás resolver, dudas sobre el plan, etc."
            className={`${inputClass} resize-none`}
          />
        }
      />
      {serverError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {serverError}
        </p>
      ) : null}
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          <Send className="size-4" strokeWidth={1.75} />
          {isSubmitting ? "Enviando..." : "Enviar mensaje"}
        </Button>
      </div>
      <p className="text-center text-[11px] text-subtle">
        Si tenes mas dudas, no dudes en escribirnos tambien a nuestras otras redes.
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-subtle outline-none transition-colors focus:border-foreground focus:ring-2 focus:ring-ring/30";

function Campo({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {input}
      {error ? (
        <span className="text-[11px] text-destructive">{error}</span>
      ) : null}
    </label>
  );
}
