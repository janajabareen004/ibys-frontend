import { Check, Loader2, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { StageStatus } from "@/mocks/mockTenantService";

const STYLE: Record<StageStatus, { className: string; icon: React.ReactNode }> = {
  completed: {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300",
    icon: <Check className="h-3 w-3" aria-hidden />,
  },
  current: {
    className:
      "border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/15",
    icon: <Loader2 className="h-3 w-3 animate-spin" aria-hidden />,
  },
  pending: {
    className: "border-border bg-muted text-muted-foreground",
    icon: <Clock className="h-3 w-3" aria-hidden />,
  },
  delayed: {
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300",
    icon: <AlertTriangle className="h-3 w-3" aria-hidden />,
  },
};

export function StatusBadge({ status, className }: { status: StageStatus; className?: string }) {
  const { t } = useI18n();
  const s = STYLE[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.className, className)}
    >
      {s.icon}
      {t(`tenant.timeline.status.${status}`)}
    </Badge>
  );
}
