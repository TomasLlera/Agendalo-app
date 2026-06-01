import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/app/mobile-nav";

export function Topbar({ esPro, nombre }: { esPro: boolean; nombre: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav />
        <span className="truncate text-sm text-muted-foreground">
          Hola, {nombre}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={esPro ? "default" : "outline"}>
          {esPro ? "Pro" : "Free"}
        </Badge>
        <UserButton />
      </div>
    </header>
  );
}
