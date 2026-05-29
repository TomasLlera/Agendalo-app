"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Banner discreto con el link público del profesional + acciones rápidas
 * (copiar y abrir). Pensado para vivir al pie del hero del dashboard.
 */
export function ShareLinkCard({
  slug,
  urlCompleto,
  urlVisible,
}: {
  slug: string;
  urlCompleto: string;
  urlVisible: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(urlCompleto);
      setCopiado(true);
      toast.success("Link copiado");
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      toast.error("No se pudo copiar el link.");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-2.5">
      <Link2 className="size-4 shrink-0 text-secondary" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Tu link público
        </p>
        <p className="truncate text-sm text-foreground">{urlVisible}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={copiar}>
        {copiado ? (
          <Check strokeWidth={1.5} />
        ) : (
          <Copy strokeWidth={1.5} />
        )}
        {copiado ? "Copiado" : "Copiar"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<a href={`/p/${slug}`} target="_blank" rel="noreferrer" />}
      >
        <ExternalLink strokeWidth={1.5} />
        Abrir
      </Button>
    </div>
  );
}
