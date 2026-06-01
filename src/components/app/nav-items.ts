import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CalendarX,
  Clock,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ítems de navegación de la app. Compartidos entre el `Sidebar` (desktop) y
 * el `MobileNav` (drawer en mobile) para que no se desincronicen.
 */
export const NAV = [
  { href: "/dashboard", label: "Agenda", icon: CalendarDays },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/cancelados", label: "Cancelados", icon: CalendarX },
  { href: "/servicios", label: "Servicios", icon: Briefcase },
  { href: "/horarios", label: "Horarios", icon: Clock },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/configuracion", label: "Configuración", icon: Settings },
] as const;

/** Marca un ítem como activo si la ruta actual coincide o es descendiente. */
export function esRutaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Clases del link de navegación, según esté activo o no. */
export function navLinkClassName(active: boolean): string {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
    active
      ? "bg-surface-elevated text-foreground ring-1 ring-secondary/30"
      : "text-foreground/75 hover:bg-surface-elevated hover:text-foreground",
  );
}
