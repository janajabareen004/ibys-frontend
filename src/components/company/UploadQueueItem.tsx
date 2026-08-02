import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { UploadItem } from "@/mocks/mockCompanyService";
import { FileText, Image as ImageIcon, RotateCw, X, AlertTriangle, CheckCircle2 } from "lucide-react";

export function UploadQueueItem({ item }: { item: UploadItem }) {
  const { t } = useI18n();
  const Icon = item.kind === "photo" ? ImageIcon : FileText;
  const statusStyle = {
    queued: "border-border bg-muted text-muted-foreground",
    uploading: "border-primary/30 bg-primary/10 text-primary",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    failed: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
  } as const;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{item.fileName}</p>
            <Badge variant="outline" className={`rounded-full text-[10px] font-semibold ${statusStyle[item.status]}`}>
              {item.status === "completed" && <CheckCircle2 className="me-1 h-3 w-3" />}
              {item.status === "failed" && <AlertTriangle className="me-1 h-3 w-3" />}
              {t(`company.upload.status.${item.status}`)}
            </Badge>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.size}</p>
          {item.status !== "completed" && (
            <Progress value={item.progress} className="mt-2 h-1.5" />
          )}
          {item.message && (
            <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{item.message}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {item.status === "failed" && (
            <Button size="sm" variant="outline" className="h-8 gap-1"><RotateCw className="h-3 w-3" />{t("company.upload.retry")}</Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label={t("company.upload.remove")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
