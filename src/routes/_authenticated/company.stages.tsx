import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyStages, useCompanyProjects } from "@/hooks/useCompanyData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StageManagementCard } from "@/components/company/StageManagementCard";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";

export const Route = createFileRoute("/_authenticated/company/stages")({
  head: () => ({
    meta: [
      { title: "Construction stages – IBYS Company" },
      { name: "description", content: "Manage every construction stage across your projects." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const { data: stages, loading } = useCompanyStages();
  const { data: projects } = useCompanyProjects();
  const [projectId, setProjectId] = React.useState<string>("all");

  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name;
  const filtered = (stages ?? []).filter((s) => projectId === "all" ? true : s.projectId === projectId);

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.stages.title")}
        description={t("company.stages.description")}
        actions={
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-56"><SelectValue placeholder={t("company.stages.filterProject")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("company.stages.allProjects")}</SelectItem>
              {(projects ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      {loading ? <InlineLoader /> : filtered.length === 0 ? <EmptyState title={t("company.stages.empty")} /> : (
        <div className="space-y-4">
          {filtered.map((s) => <StageManagementCard key={s.id} stage={s} projectName={projectName(s.projectId)} />)}
        </div>
      )}
    </RoleGuard>
  );
}
