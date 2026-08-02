import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { PhotoAsset } from "@/mocks/mockCompanyService";
import { Camera } from "lucide-react";

export function PhotoCard({ photo, projectName }: { photo: PhotoAsset; projectName?: string }) {
  const { t, formatDate } = useI18n();
  const statusStyle = {
    published: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    pending_review: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    flagged: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
  } as const;
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <div
        className="relative grid aspect-[4/3] place-items-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, hsl(${photo.hue} 60% 82%), hsl(${(photo.hue + 60) % 360} 55% 68%))` }}
        aria-hidden
      >
        <Camera className="h-8 w-8 text-white/80" />
        <Badge variant="outline" className={`absolute end-2 top-2 rounded-full bg-background/85 text-[10px] font-semibold ${statusStyle[photo.status]}`}>
          {t(`company.photos.statuses.${photo.status}`)}
        </Badge>
      </div>
      <CardContent className="space-y-1 p-3">
        <p className="truncate text-sm font-semibold text-foreground">{photo.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {projectName ? `${projectName} · ` : ""}{t(`tenant.timeline.stages.${photo.stageKey}`)}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {photo.uploadedBy} · {formatDate(photo.uploadedAt, { dateStyle: "medium" })}
        </p>
      </CardContent>
    </Card>
  );
}
