import * as React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerDocuments, useManagerProjects, managerActions } from "@/hooks/useManagerData";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { DocumentUploadDialog } from "@/components/manager/dialogs/DocumentUploadDialog";
import { Plus, Search, Trash2, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import type { ManagedDocumentCategory } from "@/mocks/mockManagerService";

const CATEGORIES: ManagedDocumentCategory[] = ["contract", "permit", "drawing", "report", "invoice"];

/**
 * Documents manager. Rendered standalone at /manager/documents (with its own
 * header) and embedded inside the Upload Center's "Documents" tab (header hidden).
 */
export function DocumentsManager({ showHeader = true }: { showHeader?: boolean }) {
  const { t, formatDate } = useI18n();
  const { data: docs, loading, refetch } = useManagerDocuments();
  const { data: projects } = useManagerProjects();
  const [q, setQ] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("all");
  const [category, setCategory] = React.useState<ManagedDocumentCategory | "all">("all");
  const [open, setOpen] = React.useState(false);

  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? id;
  const filtered = (docs ?? []).filter((d) => {
    const matchQ = q ? [d.name, d.uploadedBy, projectName(d.projectId)].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
    const matchP = projectId === "all" ? true : d.projectId === projectId;
    const matchC = category === "all" ? true : d.category === category;
    return matchQ && matchP && matchC;
  });

  const remove = async (id: string) => {
    if (!window.confirm(t("manager.pm.documents.deleteConfirm"))) return;
    try {
      await managerActions.deleteDocument(id);
      toast.success(t("manager.pm.toasts.deleted"));
      refetch();
    } catch {
      toast.error(t("common.error"));
    }
  };

  const download = (url: string | undefined) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      toast.info(t("placeholder.comingSoon"));
    }
  };

  const newButton = (
    <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("manager.pm.documents.new")}</Button>
  );

  return (
    <>
      {showHeader ? (
        <PageHeader
          title={t("manager.pm.documents.title")}
          description={t("manager.pm.documents.description")}
          actions={newButton}
        />
      ) : (
        <div className="mb-4 flex justify-end">{newButton}</div>
      )}

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
        <Select value={category} onValueChange={(v) => setCategory(v as ManagedDocumentCategory | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.pm.documents.allCategories")}</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`manager.pm.documents.categories.${c}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <InlineLoader /> : filtered.length === 0 ? <EmptyState title={t("manager.pm.documents.empty")} /> : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start font-semibold">{t("manager.pm.documents.form.name")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("manager.pm.documents.form.project")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("manager.pm.documents.form.category")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("manager.pm.documents.form.size")}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("manager.pm.documents.form.uploadedBy")}</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/40">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <span className="truncate">{d.name}</span>
                        <span className="text-xs text-muted-foreground">{d.version}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{projectName(d.projectId)}</td>
                    <td className="px-3 py-2"><Badge variant="secondary" className="rounded-full">{t(`manager.pm.documents.categories.${d.category}`)}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{d.size}</td>
                    <td className="px-3 py-2 text-muted-foreground">{d.uploadedBy}<div className="text-xs">{formatDate(d.uploadedAt)}</div></td>
                    <td className="px-3 py-2 text-end">
                      <Card className="inline-flex gap-1 p-0 shadow-none">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => download(d.url)} aria-label="Download"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(d.id)} aria-label={t("manager.pm.common.delete")}><Trash2 className="h-4 w-4" /></Button>
                      </Card>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DocumentUploadDialog open={open} onOpenChange={setOpen} projects={projects ?? []} onSaved={refetch} />
    </>
  );
}
