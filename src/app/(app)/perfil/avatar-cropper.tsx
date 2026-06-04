"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Lado del área de recorte en pantalla (px). */
const DISPLAY = 280;
/** Resolución del archivo de salida (px, cuadrado). */
const OUTPUT = 512;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

type Pos = { left: number; top: number };

/**
 * Editor de avatar: permite arrastrar y hacer zoom sobre la imagen dentro de
 * un círculo guía y exporta el recorte como un `File` WebP cuadrado. Trabaja
 * 100% en el cliente (canvas), así que no necesita cambios en el backend.
 */
export function AvatarCropper({
  src,
  onApply,
  onCancel,
}: {
  src: string;
  onApply: (file: File) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Pos>({ left: 0, top: 0 });
  const [procesando, setProcesando] = useState(false);
  const drag = useRef<{ px: number; py: number; left: number; top: number } | null>(
    null,
  );

  const baseScale = nat ? DISPLAY / Math.min(nat.w, nat.h) : 1;
  const scale = baseScale * zoom;
  const dW = nat ? nat.w * scale : DISPLAY;
  const dH = nat ? nat.h * scale : DISPLAY;

  /** Mantiene la imagen cubriendo el cuadro: `left/top` nunca dejan huecos. */
  function clamp(left: number, top: number, w: number, h: number): Pos {
    return {
      left: Math.min(0, Math.max(DISPLAY - w, left)),
      top: Math.min(0, Math.max(DISPLAY - h, top)),
    };
  }

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    setNat({ w, h });
    const bs = DISPLAY / Math.min(w, h);
    const iw = w * bs;
    const ih = h * bs;
    // Centrado inicial.
    setPos({ left: (DISPLAY - iw) / 2, top: (DISPLAY - ih) / 2 });
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, left: pos.left, top: pos.top };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const next = clamp(
      drag.current.left + (e.clientX - drag.current.px),
      drag.current.top + (e.clientY - drag.current.py),
      dW,
      dH,
    );
    setPos(next);
  }

  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* el puntero ya pudo haberse liberado */
    }
  }

  function onZoom(e: React.ChangeEvent<HTMLInputElement>) {
    if (!nat) return;
    const nuevoZoom = Number(e.target.value);
    const nuevaEscala = baseScale * nuevoZoom;
    const nw = nat.w * nuevaEscala;
    const nh = nat.h * nuevaEscala;
    // Mantener fijo el punto del centro del cuadro al hacer zoom.
    const cx = DISPLAY / 2;
    const cy = DISPLAY / 2;
    const imgX = (cx - pos.left) / scale;
    const imgY = (cy - pos.top) / scale;
    const left = cx - imgX * nuevaEscala;
    const top = cy - imgY * nuevaEscala;
    setZoom(nuevoZoom);
    setPos(clamp(left, top, nw, nh));
  }

  function aplicar() {
    const img = imgRef.current;
    if (!img || !nat) return;
    setProcesando(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setProcesando(false);
      return;
    }
    const sSize = DISPLAY / scale;
    const sx = -pos.left / scale;
    const sy = -pos.top / scale;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setProcesando(false);
          return;
        }
        onApply(new File([blob], "foto.webp", { type: "image/webp" }));
      },
      "image/webp",
      0.9,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="ring-gradient-brand w-full max-w-sm rounded-2xl border border-border/70 bg-surface p-5 shadow-xl">
        <h2 className="text-base font-semibold">Acomodá tu foto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrastrá para mover y usá el zoom para encuadrar.
        </p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-lg bg-background active:cursor-grabbing"
          style={{ width: DISPLAY, height: DISPLAY }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={onImgLoad}
            className="pointer-events-none absolute max-w-none select-none"
            style={{ left: pos.left, top: pos.top, width: dW, height: dH }}
          />
          {/* Máscara circular: oscurece fuera del círculo de recorte. */}
          <div className="pointer-events-none absolute inset-0 shadow-[0_0_0_999px_rgba(5,5,16,0.6)] [clip-path:circle(50%_at_50%_50%)] [mask:radial-gradient(circle_at_center,transparent_calc(50%-1px),#000_50%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/40 [clip-path:circle(50%_at_50%_50%)]" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-subtle">Zoom</span>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={onZoom}
            className="h-1.5 flex-1 cursor-pointer accent-secondary"
            aria-label="Zoom"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={aplicar}
            disabled={!nat || procesando}
          >
            {procesando ? "Aplicando…" : "Aplicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
