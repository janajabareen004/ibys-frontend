import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerTask, useManagerEmployee, useManagerProject } from "@/hooks/useManagerData";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { SectionCard } from "@/components/manager/SectionCard";
import { TaskStatusBadge } from "@/components/manager/TaskStatusBadge";
import { PriorityBadge } from "@/components/manager/PriorityBadge";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Paperclip, Send, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manager/tasks/$taskId")({
  head: () => ({
    meta: [
      { title: "Task – IBYS Manager" },
      { name: "description", content: "Task details, comments and activity log." },
    ],
  }),
  component: Page,
});

function Page() {
  const { taskId } = useParams({ from: "/_authenticated/manager/tasks/$taskId" });
  const { t, formatDate } = useI18n();
  const task = useManagerTask(taskId);
  const assignee = useManagerEmployee(task.data?.assignedTo ?? "");
  const project = useManagerProject(task.data?.projectId ?? "");

  if (task.loading) return <InlineLoader />;
  if (!task.data) return null;
  const d = task.data;

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={d.title}
        description={project.data?.name}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/manager/tasks"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("manager.actions.back")}</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={d.status} />
        <PriorityBadge priority={d.priority} />
        {d.tags.map((tag) => <Badge key={tag} variant="secondary" className="rounded-full">#{tag}</Badge>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title={t("manager.taskDetails.description")}>
            <p className="text-sm leading-relaxed text-muted-foreground">{d.description}</p>
          </SectionCard>

          <SectionCard title={t("manager.taskDetails.subtasks")}>
            <ul className="space-y-2">
              {d.subtasks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={s.done} id={s.id} />
                  <label htmlFor={s.id} className={s.done ? "text-muted-foreground line-through" : "text-foreground"}>{s.title}</label>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("manager.taskDetails.comments")}>
            <ul className="space-y-4">
              {d.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-xs font-bold text-primary-foreground">{c.author[0]}</span>
                  <div className="min-w-0 flex-1 rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <strong className="text-foreground">{c.author}</strong>
                      <span className="text-muted-foreground">{formatDate(c.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{c.message}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <Input placeholder={t("manager.taskDetails.addComment")} />
              <Button size="sm"><Send className="h-4 w-4" />{t("manager.taskDetails.post")}</Button>
            </div>
          </SectionCard>

          <SectionCard title={t("manager.taskDetails.attachments")}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {d.attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-sm">
                  <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.size}</p>
                  </div>
                  <Button size="sm" variant="ghost"><FileText className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("manager.taskDetails.activity")}>
            <ul className="space-y-2">
              {d.activity.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div><p className="text-foreground">{a.action}</p><p className="text-xs text-muted-foreground">{a.author} · {formatDate(a.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p></div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title={t("manager.taskDetails.progress")}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{d.progress}%</span></div>
              <Progress value={d.progress} className="h-2" />
            </div>
          </SectionCard>
          <SectionCard title={t("manager.taskDetails.assigned")}>
            {assignee.data ? (
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-xs font-bold text-primary-foreground">{assignee.data.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                <div><p className="text-sm font-semibold text-foreground">{assignee.data.name}</p><p className="text-xs text-muted-foreground">{assignee.data.role}</p></div>
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </SectionCard>
          <SectionCard title={t("manager.taskDetails.timeline")}>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center justify-between"><span className="text-muted-foreground">{t("manager.taskDetails.created")}</span><strong className="text-foreground">{formatDate(d.createdAt)}</strong></li>
              <li className="flex items-center justify-between"><span className="text-muted-foreground">{t("manager.taskDetails.due")}</span><strong className="text-foreground">{formatDate(d.dueDate)}</strong></li>
            </ul>
          </SectionCard>
          <SectionCard title={t("manager.taskDetails.relatedProject")}>
            {project.data ? (
              <Link to="/manager/projects/$projectId" params={{ projectId: project.data.id }} className="block rounded-xl border border-border/60 bg-card p-3 hover:border-primary/40"><p className="text-sm font-semibold text-foreground">{project.data.name}</p><p className="text-xs text-muted-foreground">{project.data.clientName}</p></Link>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </SectionCard>
          {d.stageKey && (
            <SectionCard title={t("manager.taskDetails.relatedStage")}>
              <Badge variant="secondary" className="rounded-full">{t(`tenant.timeline.stages.${d.stageKey}`)}</Badge>
            </SectionCard>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
