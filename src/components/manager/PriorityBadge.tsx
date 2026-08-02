import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TaskPriority } from "@/mocks/mockManagerService";
import { ArrowDown, ArrowUp, Flame, Minus } from "lucide-react";

const MAP: Record<TaskPriority, { className: string; icon: React.ReactNode }> = {
  low: { className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300", icon: <ArrowDown className="h-3 w-3" aria-hidden /> },
  medium: { className: "border-border bg-muted text-foreground/80", icon: <Minus className="h-3 w-3" aria-hidden /> },
  high: { className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300", icon: <ArrowUp className="h-3 w-3" aria-hidden /> },
  critical: { className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300", icon: <Flame className="h-3 w-3" aria-hidden /> },
};

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  const { t } = useI18n();
  const s = MAP[priority];
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", s.className, className)}>
      {s.icon}
      {t(`manager.priority.${priority}`)}
    </Badge>
  );
}
