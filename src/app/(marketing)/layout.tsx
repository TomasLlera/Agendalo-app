import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { MeshGradientBg } from "./_components/mesh-gradient-bg";
import { WhatsappFab } from "./_components/whatsapp-fab";

/** Atajos a las secciones de la landing (in-page, scroll suave). */
const ATAJOS = [
  { label: "Funciones", href: "/#features" },
  { label: "Equipo", href: "/#equipo" },
  { label: "Pantallas", href: "/#screens" },
  { label: "Precios", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
] as const;

/**
 * Layout marketing con snap scroll vertical.
 *
 * Estructura:
 *  - `AuroraBg` fixed detrás de todo (-z-10)
 *  - `<header>` fixed top con backdrop-blur — no consume altura de las secciones
 *  - `<main>` es el contenedor scrollable: `snap-y snap-mandatory`, altura
 *    completa del viewport. Cada sección de la landing usa `snap-start` y
 *    `min-h-screen` para encajar como "página" individual.
 *  - El `Footer` va dentro del main como última snap section.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const estaLogueado = Boolean(userId);

  return (
    <div className="relative h-screen overflow-hidden">
      <MeshGradientBg />
      <header className="fixed inset-x-0 top-0 z-30 bg-background/40 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-6">
          <Logo />
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {ATAJOS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {a.label}
              </Link>
            ))}
          </nav>
          <nav className="flex items-center gap-2">
            {estaLogueado ? (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/dashboard" />}
                >
                  Ir al dashboard
                </Button>
                <UserButton />
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/sign-in" />}
                >
                  Ingresar
                </Button>
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/sign-up" />}
                >
                  Empezar gratis
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
        {children}
      </main>
      <WhatsappFab />
    </div>
  );
}
