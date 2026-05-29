import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Wordmark de Agendalo. Por default linkea a la landing. */
export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <CalendarCheck className="size-5 text-primary" strokeWidth={1.5} />
      <span className="text-base">Agendalo</span>
    </Link>
  );
}
