import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerPhotos, useManagerProjects, managerActions } from "@/hooks/useManagerData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { PhotoUploadDialog } from "@/components/manager/dialogs/PhotoUploadDialog";
import { Plus, Search, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { ProjectStageKey } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/photos")({
  head: () => ({
    meta: [
      { title: "Site photos – IBYS Manager" },
      { name: "description", content: "Site photos organised by project and construction stage." },
    ],
  }),
  component: Page,
});

const STAGES: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

function Page() {
  const { t, formatDate } = useI18n();
  const { data: photos, loading } = useManagerPhotos();
  const { data: projects } = useManagerProjects();
  const [q, setQ] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("all");
  const [stageKey, setStageKey] = React.useState<ProjectStageKey | "all">("all");
  const [open, setOpen] = React.useState(false);

  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? id;
  const filtered = (photos ?? []).filter((p) => {
    const matchQ = q ? [p.title, p.uploadedBy, projectName(p.projectId)].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
    const matchP = projectId === "all" ? true : p.projectId === projectId;
    const matchS = stageKey === "all" ? true : p.stageKey === stageKey;
    return matchQ && matchP && matchS;
  });

  const remove = (id: string) => {
    if (!window.confirm(t("manager.pm.photos.deleteConfirm"))) return;
    managerActions.deletePhoto(id);
    toast.success(t("manager.pm.toasts.deleted"));
  };

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.pm.photos.title")}
        description={t("manager.pm.photos.description")}
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("manager.pm.photos.new")}</Button>}
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("manager.tasks.search")} className="ps-9" />
        </div>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.stages.allProjects")}</SelectItem>
            {(projects ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageKey} onValueChange={(v) => setStageKey(v as ProjectStageKey | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.filters.any")}</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s}>{t(`tenant.timeline.stages.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <InlineLoader /> : filtered.length === 0 ? <EmptyState title={t("manager.pm.photos.empty")} /> : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative aspect-[4/3] w-full" style={{ background: `linear-gradient(135deg, ${photo.color}, ${photo.color}bb)` }}>
                <ImageIcon className="absolute inset-0 m-auto h-10 w-10 text-white/70" aria-hidden />
                <Badge className="absolute end-2 top-2 rounded-full bg-black/40 text-white backdrop-blur">{t(`tenant.timeline.stages.${photo.stageKey}`)}</Badge>
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-sm font-semibold text-foreground">{photo.title}</p>
                <p className="text-xs text-muted-foreground">{projectName(photo.projectId)}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{photo.uploadedBy} · {formatDate(photo.uploadedAt, { dateStyle: "medium" })}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(photo.id)} aria-label={t("manager.pm.common.delete")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PhotoUploadDialog open={open} onOpenChange={setOpen} projects={projects ?? []} />
    </RoleGuard>
  );
}
