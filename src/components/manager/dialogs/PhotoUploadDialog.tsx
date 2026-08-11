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
import { USE_MOCK_API } from "@/api/config";
import { uploadProjectImage, removeProjectImage } from "@/lib/storage";
import type { ManagedProject, ProjectStageKey } from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ManagedProject[];
  defaultProjectId?: string;
  defaultStage?: ProjectStageKey;
  onSaved?: () => void;
};

const STAGES: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

export function PhotoUploadDialog({ open, onOpenChange, projects, defaultProjectId, defaultStage, onSaved }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [stageKey, setStageKey] = React.useState<ProjectStageKey>("structural");
  const [file, setFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle("");
    setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
    setStageKey(defaultStage ?? "structural");
    setFile(null);
    setFileName("");
  }, [open, defaultProjectId, defaultStage, projects]);

  const submit = async () => {
    if (!projectId || saving) return;
    const displayTitle = title.trim() || fileName || `${t("manager.pm.photos.title")} — ${new Date().toLocaleDateString()}`;

    // Mock mode keeps the in-memory behaviour and never touches Storage.
    if (USE_MOCK_API) {
      setSaving(true);
      try {
        await managerActions.addPhoto({
          projectId,
          stageKey,
          title: displayTitle,
          uploadedBy: user?.name ?? "Project Manager",
        });
        toast.success(t("manager.pm.toasts.uploaded"));
        onSaved?.();
        onOpenChange(false);
      } catch {
        toast.error(t("common.error"));
      } finally {
        setSaving(false);
      }
      return;
    }

    // Live mode: a real file is required — it is uploaded to Storage first.
    if (!file) {
      toast.error(t("manager.pm.photos.chooseFile"));
      return;
    }
    setSaving(true);

    // 1) Upload the actual file to Supabase Storage. On failure, stop here so no
    //    orphan database row is created.
    let uploaded: { path: string; publicUrl: string };
    try {
      uploaded = await uploadProjectImage(file, projectId);
    } catch {
      toast.error(t("manager.pm.photos.uploadFailed"));
      setSaving(false);
      return;
    }

    // 2) Persist the image record with the public URL. If this fails, remove the
    //    just-uploaded object to avoid orphan files, then surface the error.
    try {
      await managerActions.addPhoto({
        projectId,
        stageKey,
        title: displayTitle,
        uploadedBy: user?.name ?? "Project Manager",
        imageUrl: uploaded.publicUrl,
      });
      toast.success(t("manager.pm.toasts.uploaded"));
      onSaved?.();
      onOpenChange(false);
    } catch {
      await removeProjectImage(uploaded.path);
      toast.error(t("manager.pm.photos.uploadFailed"));
    } finally {
      setSaving(false);
    }
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
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setFileName(f?.name ?? ""); }} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("manager.pm.common.cancel")}</Button>
          <Button onClick={submit} disabled={saving}>{t("manager.pm.common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
