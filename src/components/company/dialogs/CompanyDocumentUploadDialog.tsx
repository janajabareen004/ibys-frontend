import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { USE_MOCK_API } from "@/api/config";
import { companyMutations, type CompanyProject, type DocumentCategory } from "@/api/companyApi";
import { uploadProjectDocument, removeProjectDocument } from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already-owned projects only (from useCompanyProjects()) — never pass an unfiltered project list here. */
  projects: CompanyProject[];
  onSaved?: () => void;
};

const CATEGORIES: DocumentCategory[] = ["contract", "permit", "drawing", "report", "invoice"];

/**
 * Building Company document upload dialog. Mirrors the Manager
 * DocumentUploadDialog's real Storage-then-metadata flow (src/lib/storage.ts
 * is generic and reused as-is), but only exposes the fields the backend
 * `documents` table actually has: name/project/category + the file itself.
 * No stage/version/uploadedBy fields — those have no real backend source for
 * documents and must never be fabricated or sent to the API.
 */
export function CompanyDocumentUploadDialog({ open, onOpenChange, projects, onSaved }: Props) {
  const { t } = useI18n();
  const [name, setName] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [category, setCategory] = React.useState<DocumentCategory>("report");
  const [file, setFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setProjectId(projects[0]?.id ?? "");
    setCategory("report");
    setFile(null);
    setFileName("");
  }, [open, projects]);

  const submit = async () => {
    if (saving) return;
    if (!projectId) {
      toast.error(t("company.documents.chooseProject"));
      return;
    }
    const displayName = name.trim() || fileName;
    if (!displayName) {
      toast.error(t("company.documents.chooseFile"));
      return;
    }

    const baseInput = { projectId, name: displayName, category };

    // Mock mode keeps the in-memory behaviour and never touches Storage.
    if (USE_MOCK_API) {
      setSaving(true);
      try {
        await companyMutations.createDocument(baseInput);
        toast.success(t("company.documents.uploaded") as string);
        onSaved?.();
        onOpenChange(false);
      } catch {
        toast.error(t("common.error") as string);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Live mode: a real file is required — it is uploaded to Storage first.
    if (!file) {
      toast.error(t("company.documents.chooseFile"));
      return;
    }
    setSaving(true);

    // 1) Upload the actual file to Supabase Storage. On failure, stop here so no
    //    orphan database row is created.
    let uploaded: { path: string; publicUrl: string };
    try {
      uploaded = await uploadProjectDocument(file, projectId);
    } catch {
      toast.error(t("company.documents.uploadFailed") as string);
      setSaving(false);
      return;
    }

    // 2) Persist the document record with the public URL. If this fails, remove
    //    the just-uploaded object to avoid an orphan file, then surface the error.
    try {
      await companyMutations.createDocument({ ...baseInput, fileUrl: uploaded.publicUrl });
      toast.success(t("company.documents.uploaded") as string);
      onSaved?.();
      onOpenChange(false);
    } catch {
      await removeProjectDocument(uploaded.path);
      toast.error(t("company.documents.uploadFailed") as string);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("company.documents.new")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("company.documents.form.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("company.documents.form.project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("company.documents.form.category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`company.documents.categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.upload.dropDocuments")}</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                setFileName(f?.name ?? "");
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
