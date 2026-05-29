/**
 * Zonas horarias IANA de Argentina ofrecidas en el perfil del profesional.
 * La DB guarda los turnos en UTC; este valor define cómo se interpretan y
 * muestran las franjas horarias del profesional.
 */
export const TIMEZONES_AR = [
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  { value: "America/Argentina/Cordoba", label: "Córdoba" },
  { value: "America/Argentina/Mendoza", label: "Mendoza" },
  { value: "America/Argentina/Salta", label: "Salta" },
  { value: "America/Argentina/Tucuman", label: "Tucumán" },
  { value: "America/Argentina/Jujuy", label: "Jujuy" },
  { value: "America/Argentina/Catamarca", label: "Catamarca" },
  { value: "America/Argentina/La_Rioja", label: "La Rioja" },
  { value: "America/Argentina/San_Juan", label: "San Juan" },
  { value: "America/Argentina/San_Luis", label: "San Luis" },
  { value: "America/Argentina/Rio_Gallegos", label: "Río Gallegos" },
  { value: "America/Argentina/Ushuaia", label: "Ushuaia" },
] as const;

export const TIMEZONE_VALUES: string[] = TIMEZONES_AR.map((tz) => tz.value);

export function esTimezoneValida(value: string): boolean {
  return TIMEZONE_VALUES.includes(value);
}
