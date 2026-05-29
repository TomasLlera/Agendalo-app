import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Crown, Users, DollarSign, type LucideIcon } from "lucide-react";
import { getAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { PRECIO_PRO_ARS } from "@/lib/plan";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin — Agendalo",
};

export default async function AdminPage() {
  const email = await getAdminEmail();
  if (!email) notFound();

  const [total, pro, free, recientes] = await Promise.all([
    prisma.profesional.count(),
    prisma.profesional.count({ where: { plan: "PRO" } }),
    prisma.profesional.count({ where: { plan: "FREE" } }),
    prisma.profesional.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        nombre: true,
        email: true,
        slug: true,
        plan: true,
        createdAt: true,
        _count: { select: { turnos: true } },
      },
    }),
  ]);

  const mrr = pro * PRECIO_PRO_ARS;
  const mrrStr = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(mrr);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-6 py-10">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Panel de Agendalo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Salud del SaaS — visible solo para {email}.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat icon={Users} label="Profesionales" valor={String(total)} />
        <Stat icon={Crown} label="Plan Pro" valor={String(pro)} />
        <Stat icon={Users} label="Plan Free" valor={String(free)} />
        <Stat icon={DollarSign} label="MRR" valor={mrrStr} />
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium">Últimos 50 registros</h2>
        </div>

        {recientes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Todavía no hay profesionales registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <Th>Profesional</Th>
                  <Th>Slug</Th>
                  <Th>Plan</Th>
                  <Th className="text-right">Turnos</Th>
                  <Th>Alta</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recientes.map((p) => (
                  <tr key={p.id} className="hover:bg-background/30">
                    <Td>
                      <div className="font-medium">{p.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.email}
                      </div>
                    </Td>
                    <Td>
                      <code className="text-xs text-secondary">/p/{p.slug}</code>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2 py-0.5 text-xs",
                          p.plan === "PRO"
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {p.plan === "PRO" ? "Pro" : "Free"}
                      </span>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {p._count.turnos}
                    </Td>
                    <Td className="text-muted-foreground">
                      {format(p.createdAt, "d MMM yyyy", { locale: es })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  valor,
}: {
  icon: LucideIcon;
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-secondary" strokeWidth={1.5} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{valor}</p>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn("px-5 py-3 text-left font-medium", className)}
      scope="col"
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-5 py-3", className)}>{children}</td>;
}
