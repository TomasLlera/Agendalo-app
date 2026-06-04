import { getCurrentProfesional } from "@/lib/auth";
import { isPro } from "@/lib/plan";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El proxy de Clerk ya garantiza sesión en estas rutas; acá obtenemos
  // (o creamos al vuelo) el Profesional asociado.
  const profesional = await getCurrentProfesional();

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar esPro={isPro(profesional)} nombre={profesional.nombre} />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8">
          {children}
        </main>
      </div>
      <Toaster theme="dark" />
    </div>
  );
}
