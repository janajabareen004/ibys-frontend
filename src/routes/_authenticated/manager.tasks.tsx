import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerTasks, useManagerEmployees, useManagerProjects, managerActions } from "@/hooks/useManagerData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskCard } from "@/components/manager/TaskCard";
import { TaskStatusBadge } from "@/components/manager/TaskStatusBadge";
import { PriorityBadge } from "@/components/manager/PriorityBadge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { TaskDialog } from "@/components/manager/dialogs/TaskDialog";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ManagedTask, TaskStatus, TaskPriority } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks – IBYS Manager" },
      { name: "description", content: "Plan, assign and track work across every project." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data: tasks, loading } = useManagerTasks();
  const { data: employees } = useManagerEmployees();
  const { data: projects } = useManagerProjects();

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus | "all">("all");
  const [priority, setPriority] = React.useState<TaskPriority | "all">("all");
  const [projectId, setProjectId] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ManagedTask | null>(null);

  const empName = (id: string) => employees?.find((e) => e.id === id)?.name ?? "";
  const projName = (id: string) => projects?.find((p) => p.id === id)?.name ?? "";

  const filtered = React.useMemo(() => {
    return (tasks ?? []).filter((task) => {
      const matchQ = q ? [task.title, task.description, empName(task.assignedTo)].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
      const matchS = status === "all" ? true : task.status === status;
      const matchP = priority === "all" ? true : task.priority === priority;
      const matchProj = projectId === "all" ? true : task.projectId === projectId;
      return matchQ && matchS && matchP && matchProj;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, q, status, priority, projectId, employees, projects]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (task: ManagedTask) => { setEditing(task); setDialogOpen(true); };
  const remove = (task: ManagedTask) => {
    if (!window.confirm(t("manager.pm.taskForm.confirmDelete"))) return;
    managerActions.deleteTask(task.id);
    toast.success(t("manager.pm.toasts.deleted"));
  };

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.tasks.title")}
        description={t("manager.tasks.description")}
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />{t("manager.tasks.new")}</Button>}
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("manager.tasks.search")} className="ps-9" />
        </div>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("manager.filters.project")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.filters.any")}</SelectItem>
            {(projects ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus | "all")}>
          <SelectTrigger className="w-36"><SelectValue placeholder={t("manager.filters.status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.filters.any")}</SelectItem>
            {(["not_started", "in_progress", "waiting", "completed", "blocked"] as const).map((s) => (
              <SelectItem key={s} value={s}>{t(`manager.taskStatus.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority | "all")}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t("manager.filters.priority")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.filters.any")}</SelectItem>
            {(["low", "medium", "high", "critical"] as const).map((s) => (
              <SelectItem key={s} value={s}>{t(`manager.priority.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">{t("manager.tasks.view.cards")}</TabsTrigger>
          <TabsTrigger value="table">{t("manager.tasks.view.table")}</TabsTrigger>
        </TabsList>
        <TabsContent value="cards" className="mt-4">
          {loading ? <InlineLoader /> : filtered.length === 0 ? <EmptyState title={t("manager.tasks.empty")} /> : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((task) => (
                <div key={task.id} className="group relative">
                  <TaskCard task={task} assigneeName={empName(task.assignedTo)} projectName={projName(task.projectId)} />
                  <div className="pointer-events-none absolute end-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                    <Button variant="secondary" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); openEdit(task); }} aria-label={t("manager.pm.common.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="secondary" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); remove(task); }} aria-label={t("manager.pm.common.delete")}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-start font-semibold">{t("manager.tasks.columns.title")}</th>
                    <th className="px-3 py-2 text-start font-semibold">{t("manager.tasks.columns.project")}</th>
                    <th className="px-3 py-2 text-start font-semibold">{t("manager.tasks.columns.assignee")}</th>
                    <th className="px-3 py-2 text-start font-semibold">{t("manager.tasks.columns.due")}</th>
                    <th className="px-3 py-2 text-start font-semibold">{t("manager.tasks.columns.priority")}</th>
                    <th className="px-3 py-2 text-start font-semibold">{t("manager.tasks.columns.status")}</th>
                    <th className="px-3 py-2 text-start font-semibold">{t("manager.tasks.columns.progress")}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filtered.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/40">
                      <td className="px-3 py-2"><Link to="/manager/tasks/$taskId" params={{ taskId: task.id }} className="font-medium text-foreground hover:text-primary">{task.title}</Link></td>
                      <td className="px-3 py-2 text-muted-foreground">{projName(task.projectId)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{empName(task.assignedTo)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(task.dueDate)}</td>
                      <td className="px-3 py-2"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-3 py-2"><TaskStatusBadge status={task.status} /></td>
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><Progress value={task.progress} className="h-1.5 w-20" /><span className="text-xs">{task.progress}%</span></div></td>
                      <td className="px-3 py-2 text-end">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)} aria-label={t("manager.pm.common.edit")}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(task)} aria-label={t("manager.pm.common.delete")}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">{t("manager.tasks.empty")}</div>}
          </div>
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        projects={projects ?? []}
        employees={employees ?? []}
      />
    </RoleGuard>
  );
}
