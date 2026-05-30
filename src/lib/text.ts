/**
 * Normalizadores de texto para inputs de formulario.
 *
 * Se aplican como `.transform()` en los schemas Zod para garantizar
 * consistencia en la DB independientemente de cómo escriba el usuario
 * ("JUAN PEREZ", "juan pérez", "JuAn PeReZ" → "Juan Pérez").
 */

/**
 * Title Case: capitaliza la primera letra de cada palabra y baja el resto.
 *
 * Útil para nombres de personas, nombres de servicios, títulos.
 *
 * - Respeta los caracteres con acentos (María, Núñez, etc.).
 * - Trata `-`, `'` y espacios como separadores ("d'Argento" → "D'Argento").
 * - Strings vacíos pasan tal cual.
 */
export function tituloCase(s: string): string {
  if (s === "") return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep: string, letra: string) =>
      sep + letra.toLocaleUpperCase("es"),
    );
}

/**
 * Sentence Case: primera letra en mayúscula, resto en minúscula.
 *
 * Útil para descripciones, motivos, notas — cualquier texto libre que
 * idealmente arranque como una oración.
 */
export function sentenceCase(s: string): string {
  if (s === "") return s;
  const lower = s.toLowerCase();
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

/** Email normalizado a minúsculas. RFC 5321 § 2.4: la parte local es
 *  case-sensitive pero en la práctica todos los proveedores la tratan como
 *  case-insensitive. Mejor guardar minúscula para evitar duplicados. */
export function normalizarEmail(s: string): string {
  return s.toLowerCase();
}
