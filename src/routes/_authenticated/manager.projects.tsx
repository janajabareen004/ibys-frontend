import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerProjects } from "@/hooks/useManagerData";
import { ProjectCard } from "@/components/manager/ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, LayoutGrid, List as ListIcon } from "lucide-react";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { ProjectStatus } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/projects")({
  head: () => ({
    meta: [
      { title: "Projects – IBYS Manager" },
      { name: "description", content: "All construction projects across your portfolio." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const { data, loading } = useManagerProjects();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus | "all">("all");
  const [sort, setSort] = React.useState<"name" | "progress" | "completion" | "updated">("updated");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");

  const filtered = React.useMemo(() => {
    const list = (data ?? []).filter((p) => {
      const matchQ = q ? [p.name, p.clientName, p.address].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
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
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.projects.title")}
        description={t("manager.projects.description")}
      />
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("manager.projects.search")} className="ps-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus | "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t("manager.projects.allStatuses")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.projects.allStatuses")}</SelectItem>
            {(["on_track", "at_risk", "delayed", "on_hold", "completed"] as const).map((s) => (
              <SelectItem key={s} value={s}>{t(`manager.projectStatus.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("manager.projects.sortBy")} /></SelectTrigger>
          <SelectContent>
            {(["updated", "name", "progress", "completion"] as const).map((k) => (
              <SelectItem key={k} value={k}>{t(`manager.projects.sort.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="inline-flex gap-1 rounded-lg border border-border p-1">
          <Button variant={layout === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setLayout("grid")} aria-label={t("manager.projects.grid")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant={layout === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setLayout("list")} aria-label={t("manager.projects.list")}><ListIcon className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <InlineLoader />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("manager.projects.empty")} />
      ) : layout === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} layout="list" />)}
        </div>
      )}
    </RoleGuard>
  );
}
