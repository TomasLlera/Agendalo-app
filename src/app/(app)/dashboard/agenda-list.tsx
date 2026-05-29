"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Phone,
  Trash2,
  User2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { cancelarTurno, marcarCompletado } from "./actions";

export type AgendaTurno = {
  id: string;
  fechaInicioISO: string;
  diaKey: string;
  etiquetaDia: string;
  hora: string;
  duracionMinutos: number;
  clienteNombre: string;
  clienteTelefono: string;
  servicioId: string;
  servicioNombre: string;
  estado: "CONFIRMADO" | "PENDIENTE_PAGO" | "COMPLETADO";
  pagado: boolean;
};

export type AgendaServicioOpcion = {
  id: string;
  nombre: string;
};

const FILTRO_TODOS = "__all__";

export function AgendaList({
  turnos,
  servicios,
}: {
  turnos: AgendaTurno[];
  servicios: AgendaServicioOpcion[];
}) {
  const [filtroServicio, setFiltroServicio] = useState<string>(FILTRO_TODOS);

  const visibles = useMemo(() => {
    if (filtroServicio === FILTRO_TODOS) return turnos;
    return turnos.filter((t) => t.servicioId === filtroServicio);
  }, [turnos, filtroServicio]);

  const grupos = useMemo(() => agruparPorDia(visibles), [visibles]);

  if (turnos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No tenés turnos confirmados en los próximos 7 días.
        </p>
        <p className="mt-1 text-xs text-subtle">
          Cuando lleguen reservas, las vas a ver acá.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {visibles.length} {visibles.length === 1 ? "turno" : "turnos"}
          {filtroServicio === FILTRO_TODOS ? "" : " · filtrados"}
        </div>
        <Select
          value={filtroServicio}
          onValueChange={(v) => setFiltroServicio(v === null ? FILTRO_TODOS : v)}
        >
          <SelectTrigger size="sm" className="min-w-40">
            <SelectValue placeholder="Servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTRO_TODOS}>Todos los servicios</SelectItem>
            {servicios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted-foreground">
          Sin turnos para ese servicio.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map((g) => (
            <div key={g.diaKey} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {g.etiquetaDia}
              </h3>
              <ul className="overflow-hidden rounded-xl border border-border bg-surface">
                {g.turnos.map((turno, i) => (
                  <li
                    key={turno.id}
                    className={cn(
                      "flex items-start gap-4 px-4 py-3 sm:items-center",
                      i !== 0 && "border-t border-border",
                    )}
                  >
                    <TurnoFila turno={turno} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TurnoFila({ turno }: { turno: AgendaTurno }) {
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onCancelar() {
    startTransition(async () => {
      const res = await cancelarTurno(turno.id);
      if (res.ok) {
        toast.success("Turno cancelado.");
        setConfirmarOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  function onCompletar() {
    startTransition(async () => {
      const res = await marcarCompletado(turno.id);
      if (res.ok) {
        toast.success("Turno marcado como completado.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex w-20 shrink-0 flex-col">
        <span className="text-sm font-semibold">{turno.hora}</span>
        <span className="text-[11px] text-muted-foreground">
          {turno.duracionMinutos} min
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
            <User2 className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="truncate">{turno.clienteNombre}</span>
          </span>
          <EstadoBadge estado={turno.estado} pagado={turno.pagado} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="truncate">{turno.servicioNombre}</span>
          <span className="flex items-center gap-1">
            <Phone className="size-3" strokeWidth={1.5} />
            {turno.clienteTelefono}
          </span>
        </div>
      </div>
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Acciones del turno"
                disabled={pending}
              />
            }
          >
            <MoreVertical strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {turno.estado === "CONFIRMADO" ? (
              <DropdownMenuItem onClick={onCompletar} disabled={pending}>
                <CheckCircle2 strokeWidth={1.5} />
                Marcar completado
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmarOpen(true)}
              disabled={pending}
            >
              <Trash2 strokeWidth={1.5} />
              Cancelar turno
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={confirmarOpen} onOpenChange={setConfirmarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés cancelar el turno de{" "}
              <strong>{turno.clienteNombre}</strong> para{" "}
              <strong>{turno.servicioNombre}</strong>? Si el cliente dejó email,
              le avisamos por mail.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Volver
            </DialogClose>
            <Button
              variant="destructive"
              onClick={onCancelar}
              disabled={pending}
            >
              {pending ? "Cancelando…" : "Cancelar turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EstadoBadge({
  estado,
  pagado,
}: {
  estado: AgendaTurno["estado"];
  pagado: boolean;
}) {
  if (estado === "PENDIENTE_PAGO") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-500">
        <Clock strokeWidth={1.5} />
        Pendiente de pago
      </Badge>
    );
  }
  if (estado === "COMPLETADO") {
    return (
      <Badge variant="outline" className="border-success/40 text-success">
        <CheckCircle2 strokeWidth={1.5} />
        Completado
      </Badge>
    );
  }
  if (pagado) {
    return (
      <Badge variant="secondary">
        <CheckCircle2 strokeWidth={1.5} />
        Pagado
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <XCircle strokeWidth={1.5} className="opacity-0" />
      Confirmado
    </Badge>
  );
}

function agruparPorDia(turnos: AgendaTurno[]): Array<{
  diaKey: string;
  etiquetaDia: string;
  turnos: AgendaTurno[];
}> {
  const grupos = new Map<
    string,
    { diaKey: string; etiquetaDia: string; turnos: AgendaTurno[] }
  >();
  for (const t of turnos) {
    const existente = grupos.get(t.diaKey);
    if (existente) {
      existente.turnos.push(t);
    } else {
      grupos.set(t.diaKey, {
        diaKey: t.diaKey,
        etiquetaDia: t.etiquetaDia,
        turnos: [t],
      });
    }
  }
  return Array.from(grupos.values());
}
