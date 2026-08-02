import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/context/AuthProvider";
import { managerActions } from "@/hooks/useManagerData";
import type { ManagedProject, ProjectStageKey } from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ManagedProject[];
  defaultProjectId?: string;
  defaultStage?: ProjectStageKey;
};

const STAGES: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

export function PhotoUploadDialog({ open, onOpenChange, projects, defaultProjectId, defaultStage }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [stageKey, setStageKey] = React.useState<ProjectStageKey>("structural");
  const [fileName, setFileName] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setTitle("");
    setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
    setStageKey(defaultStage ?? "structural");
    setFileName("");
  }, [open, defaultProjectId, defaultStage, projects]);

  const submit = () => {
    if (!projectId) return;
    const displayTitle = title.trim() || fileName || `${t("manager.pm.photos.title")} — ${new Date().toLocaleDateString()}`;
    managerActions.addPhoto({
      projectId,
      stageKey,
      title: displayTitle,
      uploadedBy: user?.name ?? "Project Manager",
    });
    toast.success(t("manager.pm.toasts.uploaded"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("manager.pm.photos.new")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.photos.form.title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.photos.form.project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.photos.form.stage")}</Label>
              <Select value={stageKey} onValueChange={(v) => setStageKey(v as ProjectStageKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{t(`tenant.timeline.stages.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.photos.form.pick")}</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("manager.pm.common.cancel")}</Button>
          <Button onClick={submit}>{t("manager.pm.common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
