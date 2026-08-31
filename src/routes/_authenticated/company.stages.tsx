import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyStages, useCompanyProjects } from "@/hooks/useCompanyData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StageManagementCard } from "@/components/company/StageManagementCard";
import { CompanyPageHero } from "@/components/company/CompanyPageHero";
import { AddStageDialog } from "@/components/company/dialogs/AddStageDialog";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import stagesHeroImg from "@/assets/hero-manager.jpg";

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
  const { data: stages, loading, refetch } = useCompanyStages();
  const { data: projects } = useCompanyProjects();
  const [projectId, setProjectId] = React.useState<string>("all");
  const [addOpen, setAddOpen] = React.useState(false);

  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name;
  const filtered = (stages ?? []).filter((s) => projectId === "all" ? true : s.projectId === projectId);

  // A stage always belongs to one real project (POST /projects/<id>/progress),
  // so creation is only possible once a specific project is selected — never
  // for the "All projects" filter.
  const canAddStage = projectId !== "all";
  const addStageButton = (
    <Button
      size="sm"
      onClick={() => setAddOpen(true)}
      disabled={!canAddStage}
      title={canAddStage ? undefined : t("company.stages.selectProjectToAdd")}
    >
      <Plus className="h-4 w-4" />
      {t("company.stages.add")}
    </Button>
  );

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <CompanyPageHero
        title={t("company.stages.title")}
        subtitle={t("company.stages.description")}
        image={stagesHeroImg}
      />
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-56"><SelectValue placeholder={t("company.stages.filterProject")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.stages.allProjects")}</SelectItem>
            {(projects ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {addStageButton}
      </div>
      {loading ? <InlineLoader /> : filtered.length === 0 ? (
        <EmptyState title={t("company.stages.empty")} action={addStageButton} />
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <StageManagementCard key={s.id} stage={s} projectName={projectName(s.projectId)} onSaved={refetch} />
          ))}
        </div>
      )}

      <AddStageDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={canAddStage ? projectId : null}
        onSaved={refetch}
      />
    </RoleGuard>
  );
}
