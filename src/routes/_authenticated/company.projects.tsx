import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyProjects, useCompanyProjectManagers } from "@/hooks/useCompanyData";
import { CompanyProjectCard } from "@/components/company/CompanyProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, LayoutGrid, List as ListIcon, Plus } from "lucide-react";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ProjectDialog } from "@/components/company/dialogs/ProjectDialog";
import type { CompanyProjectStatus } from "@/mocks/mockCompanyService";

export const Route = createFileRoute("/_authenticated/company/projects")({
  head: () => ({
    meta: [
      { title: "Projects – IBYS Company" },
      { name: "description", content: "All assigned construction projects for the building company." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const { data, loading } = useCompanyProjects();
  const managers = useCompanyProjectManagers();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<CompanyProjectStatus | "all">("all");
  const [sort, setSort] = React.useState<"updated" | "name" | "progress" | "completion">("updated");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const list = (data ?? []).filter((p) => {
      const matchQ = q ? [p.name, p.address, p.clientName, p.projectManager].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
      const matchS = status === "all" ? true : p.status === status;
      return matchQ && matchS;
    });
    return [...list].sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name);
        case "progress": return b.progress - a.progress;
        case "completion": return +new Date(a.expectedCompletion) - +new Date(b.expectedCompletion);
        default: return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }
    });
  }, [data, q, status, sort]);

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.projects.title")}
        description={t("company.projects.description")}
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" />{t("company.pm.projects.new")}</Button>}
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.projects.search")} className="ps-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as CompanyProjectStatus | "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t("company.projects.allStatuses")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.projects.allStatuses")}</SelectItem>
            {(["planning", "in_progress", "on_hold", "delayed", "completed"] as const).map((s) => (
              <SelectItem key={s} value={s}>{t(`company.projectStatus.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("company.projects.sortBy")} /></SelectTrigger>
          <SelectContent>
            {(["updated", "name", "progress", "completion"] as const).map((k) => (
              <SelectItem key={k} value={k}>{t(`company.projects.sort.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="inline-flex gap-1 rounded-lg border border-border p-1">
          <Button variant={layout === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setLayout("grid")} aria-label={t("company.projects.grid")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant={layout === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setLayout("list")} aria-label={t("company.projects.list")}><ListIcon className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? <InlineLoader /> : filtered.length === 0 ? <EmptyState title={t("company.projects.empty")} /> : layout === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <CompanyProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => <CompanyProjectCard key={p.id} project={p} layout="list" />)}
        </div>
      )}

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={null} managers={managers.data ?? []} />
    </RoleGuard>
  );
}

