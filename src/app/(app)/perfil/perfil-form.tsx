"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TIMEZONES_AR } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import { perfilSchema, type PerfilFormValues } from "./schema";
import { updatePerfil } from "./actions";
import { AvatarCropper } from "./avatar-cropper";

type PerfilFormProps = {
  perfil: {
    nombre: string;
    slug: string;
    descripcion: string | null;
    timezone: string;
    fotoUrl: string | null;
  };
  /** Base pública para previsualizar la URL del profesional. */
  appUrl: string;
};

const DESCRIPCION_MAX = 280;

/** Inicial para el fallback del avatar cuando no hay foto. */
function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}

export function PerfilForm({ perfil, appUrl }: PerfilFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: perfil.nombre,
      slug: perfil.slug,
      descripcion: perfil.descripcion ?? "",
      timezone: perfil.timezone,
    },
  });

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(perfil.fotoUrl);
  // Imagen original elegida (sin recortar) para poder reabrir el editor.
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [editorAbierto, setEditorAbierto] = useState(false);

  const slug = useWatch({ control, name: "slug" }) ?? "";
  const descripcion = useWatch({ control, name: "descripcion" }) ?? "";
  const dominio = appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo más tarde.
    e.target.value = "";
    if (!file) return;
    setOriginalSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setEditorAbierto(true);
  }

  function onRecorteAplicado(file: File) {
    setFotoFile(file);
    setFotoPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setEditorAbierto(false);
  }

  function onSubmit(values: PerfilFormValues) {
    const formData = new FormData();
    formData.set("nombre", values.nombre);
    formData.set("slug", values.slug);
    formData.set("descripcion", values.descripcion);
    formData.set("timezone", values.timezone);
    if (fotoFile) formData.set("foto", fotoFile);

    startTransition(async () => {
      const res = await updatePerfil(formData);
      if (res.ok) {
        setFotoFile(null);
        toast.success("Perfil actualizado.");
      } else if (res.field === "slug") {
        setError("slug", { message: res.error });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Información pública</CardTitle>
          <CardDescription>
            Estos datos arman tu página de reservas en{" "}
            {dominio || "tu dominio"}/p/{slug || "tu-slug"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16">
              {fotoPreview ? (
                <AvatarImage src={fotoPreview} alt={perfil.nombre} />
              ) : null}
              <AvatarFallback className="text-lg">
                {inicial(perfil.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera strokeWidth={1.5} />
                  Cambiar foto
                </Button>
                {originalSrc ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditorAbierto(true)}
                  >
                    Acomodar
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-subtle">
                JPG, PNG o WebP. Máximo 2 MB.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFotoChange}
            />
          </div>

          {/* Nombre */}
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              aria-invalid={!!errors.nombre}
              placeholder="Tu nombre o el de tu negocio"
            />
            {errors.nombre ? (
              <p className="text-sm text-destructive">
                {errors.nombre.message}
              </p>
            ) : null}
          </div>

          {/* Slug */}
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug (URL pública)</Label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">
                {dominio || "tu-dominio"}/p/
              </span>
              <Input
                id="slug"
                {...register("slug")}
                aria-invalid={!!errors.slug}
                placeholder="tu-slug"
              />
            </div>
            {errors.slug ? (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            ) : (
              <p className="text-xs text-subtle">
                Solo minúsculas, números y guiones.
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="descripcion">Descripción</Label>
              <span
                className={cn(
                  "text-xs text-subtle",
                  descripcion.length > DESCRIPCION_MAX && "text-destructive",
                )}
              >
                {descripcion.length}/{DESCRIPCION_MAX}
              </span>
            </div>
            <Textarea
              id="descripcion"
              rows={3}
              {...register("descripcion")}
              aria-invalid={!!errors.descripcion}
              placeholder="Contales a tus clientes qué ofrecés."
            />
            {errors.descripcion ? (
              <p className="text-sm text-destructive">
                {errors.descripcion.message}
              </p>
            ) : null}
          </div>

          {/* Timezone */}
          <div className="grid gap-2">
            <Label htmlFor="timezone">Zona horaria</Label>
            <select
              id="timezone"
              {...register("timezone")}
              aria-invalid={!!errors.timezone}
              className="h-8 w-full rounded-lg border border-input bg-surface px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            >
              {TIMEZONES_AR.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-subtle">
              Define cómo se interpretan los horarios de tus turnos.
            </p>
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>

      {editorAbierto && originalSrc ? (
        <AvatarCropper
          src={originalSrc}
          onApply={onRecorteAplicado}
          onCancel={() => setEditorAbierto(false)}
        />
      ) : null}
    </form>
  );
}
