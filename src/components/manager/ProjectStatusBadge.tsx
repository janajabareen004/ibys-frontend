import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ProjectStatus } from "@/mocks/mockManagerService";
import { ShieldCheck, AlertTriangle, TriangleAlert, PauseCircle, CheckCircle2 } from "lucide-react";

const MAP: Record<ProjectStatus, { className: string; icon: React.ReactNode }> = {
  on_track: { className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300", icon: <ShieldCheck className="h-3 w-3" aria-hidden /> },
  at_risk: { className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300", icon: <AlertTriangle className="h-3 w-3" aria-hidden /> },
  delayed: { className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300", icon: <TriangleAlert className="h-3 w-3" aria-hidden /> },
  on_hold: { className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300", icon: <PauseCircle className="h-3 w-3" aria-hidden /> },
  completed: { className: "border-primary/30 bg-primary/10 text-primary", icon: <CheckCircle2 className="h-3 w-3" aria-hidden /> },
};

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const { t } = useI18n();
  const s = MAP[status];
  return (
    <Badge variant="outline" className={cn("gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", s.className, className)}>
      {s.icon}
      {t(`manager.projectStatus.${status}`)}
    </Badge>
  );
}
