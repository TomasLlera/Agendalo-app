import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Sitemap dinámico. Incluye landing + precios (siempre) y una entrada por cada
 * profesional con página pública activa. Si la query a la DB falla (build
 * preview sin DB, etc.) cae al subset estático para no romper el build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fijos: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_URL}/precios`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const profesionales = await prisma.profesional.findMany({
      select: { slug: true, updatedAt: true },
    });
    const publicos: MetadataRoute.Sitemap = profesionales.map((p) => ({
      url: `${APP_URL}/p/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...fijos, ...publicos];
  } catch (err) {
    console.error("[sitemap] fallo query profesionales", err);
    return fijos;
  }
}
