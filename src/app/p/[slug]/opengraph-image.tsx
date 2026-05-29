import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Reservá tu turno online en Agendalo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ slug: string }> };

/**
 * OG image dinámica por profesional. Next la asocia automáticamente como
 * `og:image` en `/p/[slug]` y se compone con la metadata de `page.tsx`.
 * Runtime Node porque Prisma + adapter-pg no corre en edge.
 */
export default async function OpenGraphImage({ params }: Params) {
  const { slug } = await params;

  const profesional = await prisma.profesional.findUnique({
    where: { slug },
    select: { nombre: true, descripcion: true, fotoUrl: true },
  });

  const nombre = profesional?.nombre ?? "Agendalo";
  const descripcion =
    profesional?.descripcion ?? "Reservá un turno online en segundos.";
  const inicial = nombre.charAt(0).toUpperCase();

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
            gap: 14,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: -0.5,
            color: "#A1A1AA",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#E5E7EB",
              color: "#0A0A0A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            A
          </div>
          Agendalo
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          {profesional?.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profesional.fotoUrl}
              alt=""
              width={140}
              height={140}
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                objectFit: "cover",
                border: "2px solid #2A2A2A",
              }}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                background: "#1C1C1C",
                color: "#FAFAFA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                fontWeight: 700,
                border: "2px solid #2A2A2A",
              }}
            >
              {inicial}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 820,
            }}
          >
            <div
              style={{
                fontSize: 66,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                fontWeight: 700,
              }}
            >
              {nombre}
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#A1A1AA",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {descripcion}
            </div>
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
          <span style={{ color: "#10B981" }}>● Reservá tu turno online</span>
          <span>agendalo.app/p/{slug}</span>
        </div>
      </div>
    ),
    size,
  );
}
