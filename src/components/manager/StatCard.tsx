import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper,
  icon,
  accent = "primary",
  className,
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  accent?: "primary" | "warn" | "danger" | "success" | "muted";
  className?: string;
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    muted: "bg-muted text-muted-foreground",
  }[accent];

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="flex items-start gap-3 p-3 sm:gap-4 sm:p-5">
        {icon && (
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11", accentClass)}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {label}
          </p>
          <div className="mt-0.5 text-xl font-bold text-foreground sm:mt-1 sm:text-2xl">{value}</div>
          {helper && <div className="mt-0.5 text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">{helper}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
