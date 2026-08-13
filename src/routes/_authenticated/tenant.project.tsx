import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin, Phone, Mail, ArrowRight, Layers, CalendarClock } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantProject, useTenantStages } from "@/hooks/useTenantData";
import { ProgressRing } from "@/components/tenant/ProgressRing";
import { StatusBadge } from "@/components/tenant/StatusBadge";
import { InlineLoader } from "@/components/tenant/InlineLoader";

export const Route = createFileRoute("/_authenticated/tenant/project")({
  head: () => ({
    meta: [
      { title: "My Project – IBYS" },
      { name: "description", content: "Overview of your active construction project." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data: project } = useTenantProject();
  const { data: stages } = useTenantStages();
  const currentStage = stages?.find((s) => s.status === "current");

  return (
    <RoleGuard allow="TENANT">
      <PageHeader
        title={t("pages.myProject.title")}
        description={t("pages.myProject.description")}
        actions={<Badge variant="secondary">{project?.building.reference ?? ""}</Badge>}
      />

      {!project ? <InlineLoader /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-2xl">{project.name}</CardTitle>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" aria-hidden />{project.address}
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3.5 w-3.5" aria-hidden />
                  {project.developer}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("tenant.project.description")}</h3>
                <p className="text-sm leading-relaxed text-foreground">{project.description}</p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold uppercase tracking-wide text-muted-foreground">{t("tenant.project.overallProgress")}</span>
                  <span className="font-bold text-foreground">{project.progress}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${project.progress}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("tenant.project.expectedDelivery")}: <strong className="text-foreground">{formatDate(project.expectedDelivery, { dateStyle: "long" })}</strong>
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("tenant.project.buildingInfo")}</h3>
                <div className="grid gap-3 sm:grid-cols-4">
                  <InfoItem label={t("tenant.project.floors")} value={String(project.building.floors)} />
                  <InfoItem label={t("tenant.project.units")} value={String(project.building.units)} />
                  <InfoItem label={t("tenant.project.area")} value={project.building.apartmentArea} />
                  <InfoItem label={t("tenant.project.type")} value={project.building.type} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">{t("tenant.project.overallProgress")}</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-3 pb-6">
                <ProgressRing value={project.progress} size={128} stroke={10} />
                {currentStage && (
                  <div className="w-full rounded-lg border border-border/60 bg-muted/40 p-3 text-center">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("tenant.project.currentStage")}</div>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <Layers className="h-4 w-4 text-primary" aria-hidden />
                      <span className="font-semibold">{t(currentStage.nameKey)}</span>
                    </div>
                    <div className="mt-2"><StatusBadge status={currentStage.status} /></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">{t("tenant.project.manager")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {project.manager.name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold">{project.manager.name}</div>
                    <div className="text-xs text-muted-foreground">{t("roles.PROJECT_MANAGER")}</div>
                  </div>
                </div>
                {project.manager.email && (
                  <a href={`mailto:${project.manager.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                    <Mail className="h-3.5 w-3.5" aria-hidden />{project.manager.email}
                  </a>
                )}
                {project.manager.phone && (
                  <a href={`tel:${project.manager.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                    <Phone className="h-3.5 w-3.5" aria-hidden />{project.manager.phone}
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-3">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">{t("tenant.project.latestUpdate")}</CardTitle>
              <Button asChild size="sm" variant="ghost">
                <Link to="/tenant/timeline">
                  {t("tenant.actions.viewTimeline")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stages ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {stages.filter((s) => s.status !== "pending").slice(0, 4).map((s) => (
                    <li key={s.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{t(s.nameKey)}</span>
                          <StatusBadge status={s.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">{s.latestUpdate}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <InlineLoader />}
            </CardContent>
          </Card>
        </div>
      )}
    </RoleGuard>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
