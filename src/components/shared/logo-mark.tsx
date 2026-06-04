/**
 * Isotipo de Agendalo: la "A"-cinta del ícono de marca, en versión flat
 * (vectorial, sin glow ni 3D) para leerse nítida en cualquier tamaño —
 * favicon, logo en la UI, fondo claro u oscuro.
 *
 * Forma: dos piernas que se unen en el ápice (izquierda violeta, derecha cian)
 * + un "valle" curvo abajo que da el efecto de cinta. Colores del gradiente de
 * marca (#7C3AED → #A78BFA y #06B6D4 → #22D3EE).
 *
 * Nota: para store / OG / redes conviene usar el render 3D en PNG; este SVG es
 * la versión de producto.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      role="img"
      aria-label="Agendalo"
    >
      <defs>
        <linearGradient
          id="agendalo-mark-violet"
          x1="6.5"
          y1="25.5"
          x2="16"
          y2="6.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient
          id="agendalo-mark-cyan"
          x1="25.5"
          y1="25.5"
          x2="16"
          y2="6.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#06B6D4" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient
          id="agendalo-mark-valle"
          x1="10.8"
          y1="20"
          x2="21.2"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Pierna izquierda (violeta). */}
      <path
        d="M6.5 25.5 L16 6.5"
        stroke="url(#agendalo-mark-violet)"
        strokeWidth="4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pierna derecha (cian). */}
      <path
        d="M25.5 25.5 L16 6.5"
        stroke="url(#agendalo-mark-cyan)"
        strokeWidth="4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Valle curvo (cinta). */}
      <path
        d="M10.8 17 Q16 24 21.2 17"
        stroke="url(#agendalo-mark-valle)"
        strokeWidth="4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
