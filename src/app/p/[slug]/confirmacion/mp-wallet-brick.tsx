"use client";

import { useEffect, useRef, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

type Props = {
  publicKey: string;
  preferenceId: string;
  /** URL del checkout externo, usada como fallback si el Brick falla. */
  initPoint: string | null;
};

/**
 * Inicializa el SDK una sola vez por carga. `initMercadoPago` es idempotente
 * con la misma key, pero usamos un ref para evitar llamarlo de más en HMR.
 */
function useInitMp(publicKey: string) {
  const inicializadoRef = useRef<string | null>(null);
  useEffect(() => {
    if (inicializadoRef.current === publicKey) return;
    initMercadoPago(publicKey, { locale: "es-AR" });
    inicializadoRef.current = publicKey;
  }, [publicKey]);
}

export function MpWalletBrick({ publicKey, preferenceId, initPoint }: Props) {
  useInitMp(publicKey);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
        <p className="font-medium text-warning">
          No pudimos cargar el botón de pago acá.
        </p>
        {initPoint ? (
          <a
            href={initPoint}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Pagar en Mercado Pago
          </a>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Refrescá la página o probá de nuevo en unos minutos.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Wallet
        initialization={{ preferenceId }}
        onError={(err) => {
          console.error("[mp-wallet-brick] error", err);
          setError(true);
        }}
      />
    </div>
  );
}
