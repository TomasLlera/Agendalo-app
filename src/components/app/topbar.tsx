import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

export function Topbar({ esPro, nombre }: { esPro: boolean; nombre: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <span className="truncate text-sm text-muted-foreground">Hola, {nombre}</span>
      <div className="flex items-center gap-3">
        <Badge variant={esPro ? "default" : "outline"}>
          {esPro ? "Pro" : "Free"}
        </Badge>
        <UserButton />
      </div>
    </header>
  );
}
