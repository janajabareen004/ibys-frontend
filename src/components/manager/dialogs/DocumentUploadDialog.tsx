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
import type {
  ManagedDocumentCategory,
  ManagedProject,
  ProjectStageKey,
} from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ManagedProject[];
  defaultProjectId?: string;
};

const CATEGORIES: ManagedDocumentCategory[] = ["contract", "permit", "drawing", "report", "invoice"];
const STAGES: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

export function DocumentUploadDialog({ open, onOpenChange, projects, defaultProjectId }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [name, setName] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [stageKey, setStageKey] = React.useState<ProjectStageKey | "none">("none");
  const [category, setCategory] = React.useState<ManagedDocumentCategory>("report");
  const [version, setVersion] = React.useState("v1");

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
    setStageKey("none");
    setCategory("report");
    setVersion("v1");
  }, [open, defaultProjectId, projects]);

  const submit = () => {
    if (!name.trim() || !projectId) return;
    managerActions.addDocument({
      projectId,
      stageKey: stageKey === "none" ? undefined : stageKey,
      name: name.trim(),
      category,
      size: "1.2 MB",
      version,
      uploadedBy: user?.name ?? "Project Manager",
    });
    toast.success(t("manager.pm.toasts.uploaded"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("manager.pm.documents.new")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.documents.form.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.documents.form.project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.documents.form.category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ManagedDocumentCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`manager.pm.documents.categories.${c}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.documents.form.stage")}</Label>
              <Select value={stageKey} onValueChange={(v) => setStageKey(v as ProjectStageKey | "none")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{t(`tenant.timeline.stages.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.documents.form.version")}</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} maxLength={20} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.photos.form.pick")}</Label>
            <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
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
