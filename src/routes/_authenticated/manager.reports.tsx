import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/manager/StatCard";
import { SectionCard } from "@/components/manager/SectionCard";
import { ChartPlaceholder } from "@/components/manager/ChartPlaceholder";
import { FileBarChart, TrendingUp, CheckCircle2, AlertTriangle, Clock, Users, ShieldCheck, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manager/reports")({
  head: () => ({
    meta: [
      { title: "Reports – IBYS Manager" },
      { name: "description", content: "Portfolio health, delivery and performance overview." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.reports.title")}
        description={t("manager.reports.description")}
        actions={<Button size="sm" variant="outline"><Download className="h-4 w-4" />{t("manager.reports.export")}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t("manager.reports.overall")} value="64%" helper={t("manager.reports.period")} icon={<TrendingUp className="h-5 w-5" />} accent="primary" />
        <StatCard label={t("manager.reports.completedStages")} value={18} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
        <StatCard label={t("manager.reports.delayedStages")} value={3} icon={<AlertTriangle className="h-5 w-5" />} accent="danger" />
        <StatCard label={t("manager.reports.avgCompletion")} value="42d" icon={<Clock className="h-5 w-5" />} accent="warn" />
        <StatCard label={t("manager.reports.teamPerformance")} value="92%" icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard label={t("manager.reports.projectHealth")} value="A-" icon={<ShieldCheck className="h-5 w-5" />} accent="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("manager.reports.overall")} description={t("manager.reports.period")}>
          <ChartPlaceholder variant="area" height={220} />
        </SectionCard>
        <SectionCard title={t("manager.reports.teamPerformance")}>
          <ChartPlaceholder variant="bars" height={220} />
        </SectionCard>
        <SectionCard title={t("manager.reports.projectHealth")}>
          <ChartPlaceholder variant="donut" height={220} />
        </SectionCard>
        <SectionCard title={t("manager.reports.completedStages")}>
          <ChartPlaceholder variant="bars" height={220} label={t("manager.charts.placeholder")} />
        </SectionCard>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <FileBarChart className="h-4 w-4" aria-hidden />
        {t("placeholder.body")}
      </div>
    </RoleGuard>
  );
}
