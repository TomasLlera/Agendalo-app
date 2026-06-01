"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { NAV, esRutaActiva, navLinkClassName } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center px-5">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={navLinkClassName(esRutaActiva(pathname, href))}
          >
            <Icon className="size-4" strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
