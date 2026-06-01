"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { NAV, esRutaActiva, navLinkClassName } from "./nav-items";

/**
 * Navegación para mobile: el `Sidebar` está oculto (`md:flex`), así que en
 * pantallas chicas la única forma de moverse entre secciones es este drawer.
 * Se abre con la hamburguesa del `Topbar` y se cierra al elegir un destino.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Abrir menú"
          />
        }
      >
        <Menu className="size-5" strokeWidth={1.5} />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 gap-0 p-0">
        <SheetHeader className="h-14 justify-center px-5">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <Logo href="/dashboard" />
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={navLinkClassName(esRutaActiva(pathname, href))}
            >
              <Icon className="size-4" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
