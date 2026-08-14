import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyDocuments, useCompanyProjects } from "@/hooks/useCompanyData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { CompanyDocumentUploadDialog } from "@/components/company/dialogs/CompanyDocumentUploadDialog";
import { Search, Download, Eye, FileText, Plus } from "lucide-react";
import type { DocumentCategory } from "@/mocks/mockCompanyService";

/**
 * Guards date formatting against empty/invalid values — real document rows can
 * have no upload_date, and new Date("") is an Invalid Date that would otherwise
 * make Intl.DateTimeFormat throw RangeError (same failure class fixed on the
 * Construction Stages page).
 */
function safeFormatDocumentDate(
  formatDate: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) => string,
  value: string | undefined | null,
): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : formatDate(d);
}

export const Route = createFileRoute("/_authenticated/company/documents")({
  head: () => ({
    meta: [
      { title: "Documents – IBYS Company" },
      { name: "description", content: "Contracts, permits, drawings, and reports." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data, loading, refetch } = useCompanyDocuments();
  const { data: projects } = useCompanyProjects();
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<DocumentCategory | "all">("all");
  const [projectId, setProjectId] = React.useState("all");
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const filtered = (data ?? []).filter((d) => {
    const okQ = q ? [d.name, d.uploadedBy].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
    const okC = category === "all" ? true : d.category === category;
    const okP = projectId === "all" ? true : String(d.projectId) === String(projectId);
    return okQ && okC && okP;
  });
  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? "—";

  const openDocument = (url: string | undefined) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.documents.title")}
        description={t("company.documents.description")}
        actions={<Button size="sm" onClick={() => setUploadOpen(true)}><Plus className="h-4 w-4" />{t("company.documents.new")}</Button>}
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.documents.search")} className="ps-9" />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory | "all")}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("company.documents.allCategories")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.documents.allCategories")}</SelectItem>
            {(["contract", "permit", "drawing", "report", "invoice"] as const).map((k) => (
              <SelectItem key={k} value={k}>{t(`company.documents.categories.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("company.documents.project")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.photos.allProjects")}</SelectItem>
            {(projects ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {loading ? <InlineLoader /> : filtered.length === 0 ? <EmptyState title={t("company.documents.empty")} /> : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("company.documents.name")}</TableHead>
                <TableHead>{t("company.documents.category")}</TableHead>
                <TableHead>{t("company.documents.project")}</TableHead>
                <TableHead>{t("company.documents.version")}</TableHead>
                <TableHead>{t("company.documents.size")}</TableHead>
                <TableHead>{t("company.documents.uploadedAt")}</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.name}</span></TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{t(`company.documents.categories.${d.category}`)}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{projectName(d.projectId)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{d.version}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.size}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{safeFormatDocumentDate(formatDate, d.uploadedAt)}</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" disabled={!d.url} onClick={() => openDocument(d.url)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" disabled={!d.url} onClick={() => openDocument(d.url)}><Download className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <CompanyDocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projects={projects ?? []}
        onSaved={refetch}
      />
    </RoleGuard>
  );
}
