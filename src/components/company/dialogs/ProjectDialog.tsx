import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations } from "@/api/companyApi";
import type { CompanyProject, CompanyProjectStatus, ProjectManagerPerson } from "@/api/companyApi";
import type { ProjectStageKey } from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: CompanyProject | null;
  managers: ProjectManagerPerson[];
  /** Called after a successful create/update/delete so the caller can refetch its real project list. */
  onSaved?: () => void;
};

const STATUSES: CompanyProjectStatus[] = ["planning", "in_progress", "on_hold", "delayed", "completed"];
const STAGES: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

function toDateInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ProjectDialog({ open, onOpenChange, project, managers, onSaved }: Props) {
  const { t } = useI18n();
  const isEdit = !!project;

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [projectManagerId, setProjectManagerId] = React.useState("");
  const [status, setStatus] = React.useState<CompanyProjectStatus>("planning");
  const [progress, setProgress] = React.useState(0);
  const [currentStage, setCurrentStage] = React.useState<ProjectStageKey>("structural");
  const [expectedCompletion, setExpectedCompletion] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setAddress(project?.address ?? "");
    setClientName(project?.clientName ?? "");
    setProjectManagerId(project?.projectManagerId ?? managers[0]?.id ?? "");
    setStatus(project?.status ?? "planning");
    setProgress(project?.progress ?? 0);
    setCurrentStage(project?.currentStage ?? "structural");
    setExpectedCompletion(toDateInput(project?.expectedCompletion) || toDateInput(new Date(Date.now() + 180 * 86400000).toISOString()));
    setDescription(project?.description ?? "");
  }, [open, project, managers]);

  const submit = async () => {
    if (saving) return;
    if (!name.trim() || !address.trim()) {
      toast.error(t("common.error"));
      return;
    }
    const selectedManagerId = projectManagerId || managers[0]?.id || "";
    const selectedManagerName = managers.find((m) => m.id === selectedManagerId)?.name ?? "";
    const payload = {
      name: name.trim(),
      address: address.trim(),
      clientName: clientName.trim(),
      projectManager: selectedManagerName,
      projectManagerId: selectedManagerId,
      status,
      progress,
      currentStage,
      expectedCompletion: expectedCompletion ? new Date(expectedCompletion).toISOString() : new Date().toISOString(),
      description: description.trim(),
      team: project?.team ?? [],
    };
    setSaving(true);
    try {
      if (isEdit && project) {
        await companyMutations.updateProject(project.id, payload);
        toast.success(t("company.pm.toasts.projectUpdated"));
      } else {
        await companyMutations.createProject(payload);
        toast.success(t("company.pm.toasts.projectCreated"));
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!project) return;
    if (!window.confirm(t("company.pm.confirmDeleteProject"))) return;
    setSaving(true);
    try {
      await companyMutations.deleteProject(project.id);
      toast.success(t("company.pm.toasts.projectDeleted"));
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("company.pm.projectForm.editTitle") : t("company.pm.projectForm.createTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{t("company.pm.projectForm.unsavedFieldsNote")}</p>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>{t("company.pm.projectForm.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} /></div>
          <div className="grid gap-1.5"><Label>{t("company.pm.projectForm.address")}</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>{t("company.pm.projectForm.client")}</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
            <div className="grid gap-1.5">
              <Label>{t("company.pm.projectForm.manager")}</Label>
              <Select value={projectManagerId} onValueChange={setProjectManagerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name || m.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("company.pm.projectForm.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CompanyProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`company.projectStatus.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("company.pm.projectForm.currentStage")}</Label>
              <Select value={currentStage} onValueChange={(v) => setCurrentStage(v as ProjectStageKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{t(`tenant.timeline.stages.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>{t("company.pm.projectForm.expectedCompletion")}</Label><Input type="date" value={expectedCompletion} onChange={(e) => setExpectedCompletion(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>{t("company.pm.projectForm.progress")} — {progress}%</Label><Input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} /></div>
          </div>
          <div className="grid gap-1.5"><Label>{t("company.pm.projectForm.description")}</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} /></div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit ? <Button variant="destructive" onClick={remove} disabled={saving}>{t("company.pm.common.delete")}</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("company.pm.common.cancel")}</Button>
            <Button onClick={submit} disabled={saving}>{t("company.pm.common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
