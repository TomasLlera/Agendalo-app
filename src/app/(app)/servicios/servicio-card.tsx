"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteServicio } from "./actions";

export type ServicioCardData = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionMinutos: number;
  precio: string;
  moneda: string;
  requierePago: boolean;
};

function formatearPrecio(precio: string, moneda: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
  }).format(Number(precio));
}

export function ServicioCard({ servicio }: { servicio: ServicioCardData }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onEliminar() {
    startTransition(async () => {
      const res = await deleteServicio(servicio.id);
      if (res.ok) {
        toast.success("Servicio eliminado.");
        setConfirmOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{servicio.nombre}</h3>
        {servicio.requierePago ? (
          <Badge variant="outline">Requiere pago</Badge>
        ) : null}
      </div>

      {servicio.descripcion ? (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {servicio.descripcion}
        </p>
      ) : null}

      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-4" strokeWidth={1.5} />
          {servicio.duracionMinutos} min
        </span>
        <span className="font-medium">
          {formatearPrecio(servicio.precio, servicio.moneda)}
        </span>
      </div>

      <div className="mt-5 flex gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/servicios/${servicio.id}/editar`} />}
        >
          <Pencil strokeWidth={1.5} />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 strokeWidth={1.5} />
          Eliminar
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar servicio</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar “{servicio.nombre}”? Dejará de
              aparecer en tu página pública. Los turnos ya agendados no se
              modifican.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={onEliminar}
              disabled={isPending}
            >
              {isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
