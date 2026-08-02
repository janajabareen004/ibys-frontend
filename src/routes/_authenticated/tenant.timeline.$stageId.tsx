import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Camera, FileText, MessageSquare, AlertTriangle, Building2, CalendarClock } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantStage, useTenantPhotos, useTenantDocuments, useTenantComments } from "@/hooks/useTenantData";
import { StatusBadge } from "@/components/tenant/StatusBadge";
import { ProgressRing } from "@/components/tenant/ProgressRing";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import type { StageId } from "@/mocks/mockTenantService";

const VALID_STAGES: StageId[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

export const Route = createFileRoute("/_authenticated/tenant/timeline/$stageId")({
  parseParams: ({ stageId }) => {
    if (!VALID_STAGES.includes(stageId as StageId)) throw notFound();
    return { stageId: stageId as StageId };
  },
  head: () => ({
    meta: [
      { title: "Stage details – IBYS" },
      { name: "description", content: "Full details for the selected construction stage." },
    ],
  }),
  component: Page,
});

function Page() {
  const { stageId } = Route.useParams();
  const { t, formatDate } = useI18n();
  const { data: stage } = useTenantStage(stageId);
  const { data: photos } = useTenantPhotos();
  const { data: docs } = useTenantDocuments();
  const { data: comments } = useTenantComments();

  const stagePhotos = photos?.filter((p) => p.stageId === stageId).slice(0, 6) ?? [];
  const stageComments = comments?.filter((c) => c.stageId === stageId) ?? [];

  return (
    <RoleGuard allow="TENANT">
      <PageHeader
        title={stage ? t(stage.nameKey) : t("common.loading")}
        description={stage?.description}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/tenant/timeline">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t("tenant.actions.backToTimeline")}
            </Link>
          </Button>
        }
      />

      {!stage ? <InlineLoader /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">{t("tenant.stage.overview")}</CardTitle>
                <StatusBadge status={stage.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm leading-relaxed text-foreground">{stage.description}</p>
              {stage.delayReason && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <div>
                    <div className="font-semibold">{t("tenant.timeline.labels.delayWarning")}</div>
                    <div>{stage.delayReason}</div>
                  </div>
                </div>
              )}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t("tenant.timeline.labels.progress")}</span>
                  <span className="font-bold text-foreground">{stage.progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${stage.progress}%` }} />
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("tenant.stage.latestUpdate")}</div>
                <p className="mt-1 text-sm">{stage.latestUpdate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">{t("tenant.timeline.labels.progress")}</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pb-6">
              <ProgressRing value={stage.progress} size={128} stroke={10} />
              <div className="grid w-full grid-cols-3 gap-2 text-center">
                <MiniStat icon={<Camera className="h-4 w-4" />} label={t("tenant.timeline.labels.photos")} value={stage.photosCount} />
                <MiniStat icon={<FileText className="h-4 w-4" />} label={t("tenant.timeline.labels.documents")} value={stage.documentsCount} />
                <MiniStat icon={<MessageSquare className="h-4 w-4" />} label={t("tenant.timeline.labels.comments")} value={stage.commentsCount} />
              </div>
              <div className="w-full space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" aria-hidden />{stage.responsibleCompany}</div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  {stage.completionDate
                    ? `${t("tenant.timeline.labels.completed")}: ${formatDate(stage.completionDate)}`
                    : `${t("tenant.timeline.labels.estimated")}: ${formatDate(stage.estimatedDate)}`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">{t("tenant.stage.gallery")}</CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link to="/tenant/photos">{t("tenant.actions.viewAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stagePhotos.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {stagePhotos.map((p) => (
                    <div key={p.id} className="group overflow-hidden rounded-lg border border-border">
                      <img src={p.url} alt={p.title} loading="lazy" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">{t("tenant.photos.empty")}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">{t("tenant.stage.documents")}</CardTitle></CardHeader>
            <CardContent>
              {docs ? (
                <ul className="space-y-2 text-sm">
                  {docs.slice(0, 4).map((d) => (
                    <li key={d.id} className="flex items-start gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(d.updatedAt)} · {d.size}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <InlineLoader />}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle className="text-sm">{t("tenant.stage.comments")}</CardTitle></CardHeader>
            <CardContent>
              {stageComments.length ? (
                <ul className="space-y-3">
                  {stageComments.map((c) => (
                    <li key={c.id} className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {c.author.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs">
                          <span className="font-semibold text-foreground">{c.author}</span>
                          <span className="text-muted-foreground"> · {t(`roles.${c.role}`)} · {formatDate(c.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                        <p className="text-sm">{c.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">{t("common.empty")}</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </RoleGuard>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
      <span className="mx-auto mb-1 grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
