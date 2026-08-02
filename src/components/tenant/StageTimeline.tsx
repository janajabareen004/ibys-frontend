import { Link } from "@tanstack/react-router";
import { ChevronRight, Camera, FileText, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { StatusBadge } from "./StatusBadge";
import type { Stage } from "@/mocks/mockTenantService";

export function StageTimeline({
  stages,
  compact = false,
}: {
  stages: Stage[];
  compact?: boolean;
}) {
  const { t, formatDate } = useI18n();

  return (
    <ol className="relative">
      <span
        aria-hidden
        className="absolute inset-y-0 start-[15px] w-px bg-gradient-to-b from-primary/40 via-border to-border"
      />
      {stages.map((stage) => {
        const isCurrent = stage.status === "current";
        const isCompleted = stage.status === "completed";
        return (
          <li key={stage.id} className="relative ps-10 pb-6 last:pb-0">
            <span
              aria-hidden
              className={cn(
                "absolute start-0 top-1 grid h-8 w-8 place-items-center rounded-full border-2 bg-background text-xs font-bold ring-4 ring-background",
                isCompleted && "border-emerald-500 text-emerald-600",
                isCurrent && "border-primary text-primary shadow-md shadow-primary/20",
                stage.status === "pending" && "border-border text-muted-foreground",
                stage.status === "delayed" && "border-amber-500 text-amber-600",
              )}
            >
              {stage.order}
            </span>

            <Link
              to="/tenant/timeline/$stageId"
              params={{ stageId: stage.id }}
              className={cn(
                "block rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                isCurrent && "border-primary/30 bg-primary/5 shadow-sm",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{t(stage.nameKey)}</h3>
                    <StatusBadge status={stage.status} />
                  </div>
                  {!compact && (
                    <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
                  )}
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("tenant.timeline.labels.progress")}</span>
                  <span className="font-semibold text-foreground">{stage.progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isCompleted && "bg-emerald-500",
                      isCurrent && "bg-primary",
                      stage.status === "delayed" && "bg-amber-500",
                      stage.status === "pending" && "bg-muted-foreground/30",
                    )}
                    style={{ width: `${Math.max(stage.progress, 3)}%` }}
                  />
                </div>
              </div>

              {!compact && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {stage.completionDate
                      ? `${t("tenant.timeline.labels.completed")}: ${formatDate(stage.completionDate)}`
                      : `${t("tenant.timeline.labels.estimated")}: ${formatDate(stage.estimatedDate)}`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Camera className="h-3 w-3" aria-hidden /> {stage.photosCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3 w-3" aria-hidden /> {stage.documentsCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" aria-hidden /> {stage.commentsCount}
                  </span>
                  {stage.delayReason && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      {stage.delayReason}
                    </span>
                  )}
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
