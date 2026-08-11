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
import { uploadProjectDocument, removeProjectDocument } from "@/lib/storage";
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
  onSaved?: () => void;
};

const CATEGORIES: ManagedDocumentCategory[] = ["contract", "permit", "drawing", "report", "invoice"];
const STAGES: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

export function DocumentUploadDialog({ open, onOpenChange, projects, defaultProjectId, onSaved }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [name, setName] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [stageKey, setStageKey] = React.useState<ProjectStageKey | "none">("none");
  const [category, setCategory] = React.useState<ManagedDocumentCategory>("report");
  const [version, setVersion] = React.useState("v1");
  const [file, setFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
    setStageKey("none");
    setCategory("report");
    setVersion("v1");
    setFile(null);
    setFileName("");
  }, [open, defaultProjectId, projects]);

  const submit = async () => {
    if (!projectId || saving) return;
    const displayName = name.trim() || fileName;
    if (!displayName) return;

    const baseInput = {
      projectId,
      stageKey: stageKey === "none" ? undefined : stageKey,
      name: displayName,
      category,
      size: "—",
      version,
      uploadedBy: user?.name ?? "Project Manager",
    };

    // Mock mode keeps the in-memory behaviour and never touches Storage.
    if (USE_MOCK_API) {
      setSaving(true);
      try {
        await managerActions.addDocument(baseInput);
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
      toast.error(t("manager.pm.documents.chooseFile"));
      return;
    }
    setSaving(true);

    // 1) Upload the actual file to Supabase Storage. On failure, stop here so no
    //    orphan database row is created.
    let uploaded: { path: string; publicUrl: string };
    try {
      uploaded = await uploadProjectDocument(file, projectId);
    } catch {
      toast.error(t("manager.pm.documents.uploadFailed"));
      setSaving(false);
      return;
    }

    // 2) Persist the document record with the public URL. If this fails, remove
    //    the just-uploaded object to avoid orphan files, then surface the error.
    try {
      await managerActions.addDocument({ ...baseInput, fileUrl: uploaded.publicUrl });
      toast.success(t("manager.pm.toasts.uploaded"));
      onSaved?.();
      onOpenChange(false);
    } catch {
      await removeProjectDocument(uploaded.path);
      toast.error(t("manager.pm.documents.uploadFailed"));
    } finally {
      setSaving(false);
    }
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
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); setFileName(f?.name ?? ""); }}
            />
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
