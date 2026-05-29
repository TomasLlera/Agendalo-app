import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <section className="flex flex-col gap-8">
      <header>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </section>
  );
}
