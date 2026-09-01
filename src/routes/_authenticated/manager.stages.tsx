import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerAllStages, useManagerProjects, managerActions } from "@/hooks/useManagerData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/tenant/StatusBadge";
import { SectionCard } from "@/components/manager/SectionCard";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { StageUpdateDialog } from "@/components/manager/dialogs/StageUpdateDialog";
import { PhotoUploadDialog } from "@/components/manager/dialogs/PhotoUploadDialog";
import { AddStageDialog } from "@/components/company/dialogs/AddStageDialog";
import { AlertTriangle, Camera, FileText, MessageSquare, Plus, UploadCloud } from "lucide-react";
import type { ManagedStage, ProjectStageKey } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/stages")({
  head: () => ({
    meta: [
      { title: "Construction stages – IBYS Manager" },
      { name: "description", content: "Manage every construction stage across all projects." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const stages = useManagerAllStages();
  const projects = useManagerProjects();
  const [projectId, setProjectId] = React.useState<string>("all");
  const [editing, setEditing] = React.useState<ManagedStage | null>(null);
  const [uploadFor, setUploadFor] = React.useState<{ projectId: string; stage: ProjectStageKey } | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  const projectName = (id: string) => projects.data?.find((p) => p.id === id)?.name ?? "";
  const filtered = (stages.data ?? []).filter((s) => (projectId === "all" ? true : s.projectId === projectId));
  const existingStageNames = (stages.data ?? [])
    .filter((s) => s.projectId === projectId)
    .map((s) => s.taskName)
    .filter((n): n is string => Boolean(n));

  // A stage always belongs to one real project (POST /projects/<id>/progress),
  // so creation is only possible once a specific project is selected — never
  // for the "All projects" filter. Mirrors company.stages.tsx's canAddStage.
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
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.stages.title")}
        description={t("manager.stages.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-56"><SelectValue placeholder={t("manager.stages.filterProject")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("manager.stages.allProjects")}</SelectItem>
                {(projects.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {addStageButton}
          </div>
        }
      />

      {stages.loading ? <InlineLoader /> : filtered.length === 0 ? (
        <EmptyState title={t("company.stages.empty")} action={addStageButton} />
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <SectionCard
              key={s.id}
              title={`${t(`tenant.timeline.stages.${s.key}`)} · ${projectName(s.projectId)}`}
              description={s.notes}
              action={<div className="flex items-center gap-2"><StatusBadge status={s.status} />{s.delayDays > 0 && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"><AlertTriangle className="me-1 h-3 w-3" />{t("manager.stages.delayDays", { n: s.delayDays })}</Badge>}</div>}
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="text-muted-foreground">{t("manager.pm.stageForm.progress")}</span><span className="font-semibold text-foreground">{s.progress}%</span></div>
                    <Progress value={s.progress} className="h-2" />
                  </div>
                  <div className="grid gap-2 text-xs sm:grid-cols-3">
                    <div><p className="text-muted-foreground">{t("manager.stages.responsible")}</p><p className="font-semibold text-foreground">{s.responsibleCompany}</p></div>
                    <div><p className="text-muted-foreground">{t("manager.stages.estimated")}</p><p className="font-semibold text-foreground">{formatDate(s.estimatedCompletion)}</p></div>
                    <div><p className="text-muted-foreground">{t("manager.stages.actual")}</p><p className="font-semibold text-foreground">{s.actualCompletion ? formatDate(s.actualCompletion) : "—"}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="rounded-full"><Camera className="me-1 h-3 w-3" />{s.photosCount} {t("manager.stages.photos")}</Badge>
                    <Badge variant="secondary" className="rounded-full"><FileText className="me-1 h-3 w-3" />{s.documentsCount} {t("manager.stages.documents")}</Badge>
                    <Badge variant="secondary" className="rounded-full"><MessageSquare className="me-1 h-3 w-3" />{s.commentsCount} {t("manager.stages.comments")}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:min-w-40">
                  <Button size="sm" onClick={() => setEditing(s)}>{t("manager.stages.update")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setUploadFor({ projectId: s.projectId, stage: s.key })}><UploadCloud className="h-4 w-4" />{t("manager.stages.uploadProgress")}</Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <StageUpdateDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} stage={editing} onSaved={stages.refetch} />
      <PhotoUploadDialog
        open={!!uploadFor}
        onOpenChange={(o) => !o && setUploadFor(null)}
        projects={projects.data ?? []}
        defaultProjectId={uploadFor?.projectId}
        defaultStage={uploadFor?.stage}
      />
      <AddStageDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={canAddStage ? projectId : null}
        existingStageNames={existingStageNames}
        onCreate={managerActions.createStage}
        onSaved={stages.refetch}
      />
    </RoleGuard>
  );
}
