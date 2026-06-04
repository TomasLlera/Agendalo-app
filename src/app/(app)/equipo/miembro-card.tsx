"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2, User } from "lucide-react";
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
import { deleteMiembro } from "./actions";

export type MiembroCardData = {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  servicios: string[];
};

export function MiembroCard({ miembro }: { miembro: MiembroCardData }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onEliminar() {
    startTransition(async () => {
      const res = await deleteMiembro(miembro.id);
      if (res.ok) {
        toast.success("Miembro eliminado.");
        setConfirmOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        {miembro.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={miembro.fotoUrl}
            alt={miembro.nombre}
            className="size-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-secondary/30">
            <User className="size-5 text-muted-foreground" strokeWidth={1.5} />
          </span>
        )}
        <h3 className="min-w-0 truncate font-medium">{miembro.nombre}</h3>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {miembro.servicios.length > 0 ? (
          miembro.servicios.map((nombre) => (
            <Badge key={nombre} variant="outline">
              {nombre}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-subtle">Sin servicios asignados.</span>
        )}
      </div>

      <div className="mt-5 flex gap-2 border-t border-border pt-4">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/equipo/${miembro.id}/editar`} />}
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
            <DialogTitle>Eliminar miembro</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar a “{miembro.nombre}”? Dejará de poder
              recibir turnos nuevos. Los turnos ya agendados no se modifican.
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
