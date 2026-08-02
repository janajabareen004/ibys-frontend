import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TaskStatus } from "@/mocks/mockManagerService";
import { Circle, Loader2, PauseCircle, CheckCircle2, Ban } from "lucide-react";

const MAP: Record<TaskStatus, { className: string; icon: React.ReactNode }> = {
  not_started: { className: "border-border bg-muted text-muted-foreground", icon: <Circle className="h-3 w-3" aria-hidden /> },
  in_progress: { className: "border-primary/30 bg-primary/10 text-primary", icon: <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> },
  waiting: { className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300", icon: <PauseCircle className="h-3 w-3" aria-hidden /> },
  completed: { className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" aria-hidden /> },
  blocked: { className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300", icon: <Ban className="h-3 w-3" aria-hidden /> },
};

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const { t } = useI18n();
  const s = MAP[status];
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", s.className, className)}>
      {s.icon}
      {t(`manager.taskStatus.${status}`)}
    </Badge>
  );
}
