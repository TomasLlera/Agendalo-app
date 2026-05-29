import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Bucket público de Supabase Storage para las fotos de perfil. */
const BUCKET = "perfiles";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let cliente: SupabaseClient | null = null;

/**
 * Cliente de Supabase con la service-role key. Solo se usa en el servidor
 * (la key nunca llega al navegador) y opera el Storage saltándose RLS.
 */
function getStorageClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }
  cliente ??= createClient(url, key, { auth: { persistSession: false } });
  return cliente;
}

export type ResultadoSubida =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Sube la foto de perfil de un profesional al bucket público `perfiles` y
 * devuelve su URL pública. La ruta es estable por profesional
 * (`<id>/foto.<ext>`) con `upsert`, de modo que cada subida reemplaza la
 * anterior; se agrega un query param de versión para evitar caché obsoleta.
 */
export async function subirFotoPerfil(
  profesionalId: string,
  file: File,
): Promise<ResultadoSubida> {
  const ext = TIPOS_PERMITIDOS[file.type];
  if (!ext) {
    return { ok: false, error: "La foto debe ser JPG, PNG o WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "La foto no puede superar los 2 MB." };
  }

  const supabase = getStorageClient();
  const path = `${profesionalId}/foto.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) {
    return {
      ok: false,
      error: "No se pudo subir la foto. Intentá de nuevo en un momento.",
    };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: `${data.publicUrl}?v=${Date.now()}` };
}
