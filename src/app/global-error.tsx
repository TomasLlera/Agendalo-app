"use client";

import { useEffect } from "react";

/**
 * Boundary global de Next App Router. Captura errores no manejados que rompen
 * el root layout (donde un `error.tsx` por ruta no llega). Debe traer su propio
 * `<html>`/`<body>` porque reemplaza al layout raíz.
 *
 * Estilos inline a propósito: si el bundle de CSS no carga (causa probable del
 * fallo), igual queremos una pantalla legible.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#0A0A0A",
          color: "#FAFAFA",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#A1A1AA",
              margin: 0,
            }}
          >
            Error inesperado
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              margin: "12px 0 0",
              letterSpacing: -0.5,
            }}
          >
            Algo salió mal
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#A1A1AA",
              margin: "12px 0 0",
              lineHeight: 1.5,
            }}
          >
            No pudimos cargar esta página. Probá reintentar o volvé al inicio.
            {error.digest ? (
              <>
                <br />
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                  Código: {error.digest}
                </span>
              </>
            ) : null}
          </p>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "#FAFAFA",
                color: "#0A0A0A",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error reemplaza el root layout; Link depende del App Router que podría ser lo que rompió */}
            <a
              href="/"
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #2A2A2A",
                background: "transparent",
                color: "#FAFAFA",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
