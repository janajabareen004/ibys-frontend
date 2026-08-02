import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { CompanyProjectStatus } from "@/mocks/mockCompanyService";
import { Clock, PlayCircle, PauseCircle, TriangleAlert, CheckCircle2 } from "lucide-react";

const MAP: Record<CompanyProjectStatus, { className: string; icon: React.ReactNode }> = {
  planning: { className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300", icon: <Clock className="h-3 w-3" aria-hidden /> },
  in_progress: { className: "border-primary/30 bg-primary/10 text-primary", icon: <PlayCircle className="h-3 w-3" aria-hidden /> },
  on_hold: { className: "border-border bg-muted text-muted-foreground", icon: <PauseCircle className="h-3 w-3" aria-hidden /> },
  delayed: { className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300", icon: <TriangleAlert className="h-3 w-3" aria-hidden /> },
  completed: { className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" aria-hidden /> },
};

export function CompanyProjectStatusBadge({ status, className }: { status: CompanyProjectStatus; className?: string }) {
  const { t } = useI18n();
  const s = MAP[status];
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.className, className)}>
      {s.icon}
      {t(`company.projectStatus.${status}`)}
    </Badge>
  );
}
