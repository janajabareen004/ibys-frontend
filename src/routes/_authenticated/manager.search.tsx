import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useManagerProjects, useManagerTasks, useManagerMeetings, useManagerRequests, useManagerEmployees } from "@/hooks/useManagerData";
import { Search, FolderKanban, ClipboardList, CalendarClock, Inbox, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manager/search")({
  head: () => ({
    meta: [
      { title: "Search – IBYS Manager" },
      { name: "description", content: "Search across projects, tasks, meetings, documents, requests, and people." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const [q, setQ] = React.useState("");
  const projects = useManagerProjects();
  const tasks = useManagerTasks();
  const meetings = useManagerMeetings();
  const requests = useManagerRequests();
  const employees = useManagerEmployees();

  const match = (s: string) => q.trim() ? s.toLowerCase().includes(q.trim().toLowerCase()) : false;

  const results = React.useMemo(() => {
    if (!q.trim()) return null;
    return {
      projects: (projects.data ?? []).filter((p) => match(`${p.name} ${p.clientName} ${p.address}`)),
      tasks: (tasks.data ?? []).filter((t) => match(`${t.title} ${t.description}`)),
      meetings: (meetings.data ?? []).filter((m) => match(`${m.title} ${m.agenda}`)),
      requests: (requests.data ?? []).filter((r) => match(`${r.description} ${r.tenantName}`)),
      team: (employees.data ?? []).filter((e) => match(`${e.name} ${e.role}`)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, projects.data, tasks.data, meetings.data, requests.data, employees.data]);

  const total = results ? Object.values(results).reduce((s, arr) => s + arr.length, 0) : 0;

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader title={t("manager.search.title")} description={t("manager.search.description")} />

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("manager.search.placeholder")} className="h-12 ps-9 text-base" autoFocus />
      </div>

      {!results ? (
        <p className="text-center text-sm text-muted-foreground">{t("manager.search.empty")}</p>
      ) : total === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("manager.search.noResults", { q })}</p>
      ) : (
        <div className="space-y-6">
          <Group icon={<FolderKanban className="h-4 w-4" />} title={t("manager.search.groups.projects")} items={results.projects.map((p) => ({ id: p.id, primary: p.name, secondary: p.clientName, to: "/manager/projects/$projectId", params: { projectId: p.id } }))} />
          <Group icon={<ClipboardList className="h-4 w-4" />} title={t("manager.search.groups.tasks")} items={results.tasks.map((t) => ({ id: t.id, primary: t.title, secondary: t.description, to: "/manager/tasks/$taskId", params: { taskId: t.id } }))} />
          <Group icon={<CalendarClock className="h-4 w-4" />} title={t("manager.search.groups.meetings")} items={results.meetings.map((m) => ({ id: m.id, primary: m.title, secondary: m.agenda, to: "/manager/meetings" }))} />
          <Group icon={<Inbox className="h-4 w-4" />} title={t("manager.search.groups.requests")} items={results.requests.map((r) => ({ id: r.id, primary: r.description, secondary: r.tenantName, to: "/manager/requests" }))} />
          <Group icon={<Users className="h-4 w-4" />} title={t("manager.search.groups.team")} items={results.team.map((e) => ({ id: e.id, primary: e.name, secondary: e.role, to: "/manager/team" }))} />
        </div>
      )}
    </RoleGuard>
  );
}

type GroupItem = { id: string; primary: string; secondary?: string; to: string; params?: Record<string, string> };
function Group({ icon, title, items }: { icon: React.ReactNode; title: string; items: GroupItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span> {title} <span className="text-muted-foreground/60">({items.length})</span>
      </h2>
      <div className="grid gap-2">
        {items.slice(0, 8).map((item) => (
          <Card key={item.id} className="transition-shadow hover:shadow-sm">
            <CardContent className="p-3">
              <Link to={item.to as never} params={item.params as never} className="block">
                <p className="truncate text-sm font-semibold text-foreground hover:text-primary">{item.primary}</p>
                {item.secondary && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.secondary}</p>}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
