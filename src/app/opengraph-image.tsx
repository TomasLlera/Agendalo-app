import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Agendalo — Tu agenda online, en menos de 5 minutos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG image dinámica para la landing (`/`). Next genera automáticamente
 * `<meta property="og:image">` apuntando a este endpoint en build/runtime.
 * Diseño consistente con la paleta del blueprint (fondo `#0A0A0A`).
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(60% 60% at 30% 30%, #1C1C1C 0%, #0A0A0A 70%)",
          color: "#FAFAFA",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: -0.5,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#E5E7EB",
              color: "#0A0A0A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            A
          </div>
          Agendalo
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: -2,
              fontWeight: 700,
              maxWidth: 920,
            }}
          >
            Tu agenda online, en menos de 5 minutos
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#A1A1AA",
              maxWidth: 820,
              lineHeight: 1.3,
            }}
          >
            Reservas, recordatorios por WhatsApp y cobros con Mercado Pago.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#A1A1AA",
          }}
        >
          <span>Para profesionales en LATAM</span>
          <span style={{ color: "#10B981" }}>● Gratis para empezar</span>
        </div>
      </div>
    ),
    size,
  );
}
