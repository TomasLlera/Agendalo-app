import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Error 404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        No encontramos esa página
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Puede que el link esté roto o que el profesional haya cambiado su
        dirección.
      </p>
      <div className="mt-6 flex gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Volver al inicio
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/precios" />}
        >
          Ver precios
        </Button>
      </div>
    </main>
  );
}
