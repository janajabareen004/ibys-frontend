import * as React from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  useManagerProject,
  useManagerProjectStages,
  useManagerTasks,
  useManagerRequests,
  useManagerMeetings,
  useManagerEmployees,
  useManagerPhotos,
  useManagerDocuments,
  useManagerNotes,
  useManagerTenants,
  useManagerActivity,
  managerActions,
} from "@/hooks/useManagerData";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { ProjectStatusBadge } from "@/components/manager/ProjectStatusBadge";
import { StatusBadge } from "@/components/tenant/StatusBadge";
import { TaskStatusBadge } from "@/components/manager/TaskStatusBadge";
import { PriorityBadge } from "@/components/manager/PriorityBadge";
import { SectionCard } from "@/components/manager/SectionCard";
import { ProgressRing } from "@/components/tenant/ProgressRing";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TaskDialog } from "@/components/manager/dialogs/TaskDialog";
import { MeetingDialog } from "@/components/manager/dialogs/MeetingDialog";
import { PhotoUploadDialog } from "@/components/manager/dialogs/PhotoUploadDialog";
import { DocumentUploadDialog } from "@/components/manager/dialogs/DocumentUploadDialog";
import { StageUpdateDialog } from "@/components/manager/dialogs/StageUpdateDialog";
import { RequestCard } from "@/components/manager/RequestCard";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Calendar, Wallet, FileText, Image as ImageIcon,
  CalendarClock, Plus, Trash2, Building, DoorOpen, Layers, Home, Phone, Mail, StickyNote,
} from "lucide-react";
import type { ManagedStage } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project – IBYS Manager" },
      { name: "description", content: "Complete project overview for the project manager." },
    ],
  }),
  component: Page,
});

function Page() {
  const { projectId } = useParams({ from: "/_authenticated/manager/projects/$projectId" });
  const { t, formatDate, formatNumber } = useI18n();
  const project = useManagerProject(projectId);
  const stages = useManagerProjectStages(projectId);
  const tasksAll = useManagerTasks();
  const requestsAll = useManagerRequests();
  const meetingsAll = useManagerMeetings();
  const employees = useManagerEmployees();
  const photosAll = useManagerPhotos();
  const docsAll = useManagerDocuments();
  const notesAll = useManagerNotes();
  const tenantsAll = useManagerTenants();
  const activityAll = useManagerActivity();

  const [taskOpen, setTaskOpen] = React.useState(false);
  const [meetingOpen, setMeetingOpen] = React.useState(false);
  const [photoOpen, setPhotoOpen] = React.useState(false);
  const [docOpen, setDocOpen] = React.useState(false);
  const [stageEditing, setStageEditing] = React.useState<ManagedStage | null>(null);
  const [note, setNote] = React.useState("");

  if (project.loading) return <InlineLoader />;
  if (!project.data) return <EmptyProject />;

  const p = project.data;
  const tasks = (tasksAll.data ?? []).filter((x) => x.projectId === projectId);
  const requests = (requestsAll.data ?? []).filter((r) => r.projectId === projectId);
  const meetings = (meetingsAll.data ?? []).filter((m) => m.projectId === projectId);
  const team = (employees.data ?? []).filter((e) => p.team.includes(e.id));
  const photos = (photosAll.data ?? []).filter((ph) => ph.projectId === projectId);
  const docs = (docsAll.data ?? []).filter((d) => d.projectId === projectId);
  const notes = (notesAll.data ?? []).filter((n) => n.projectId === projectId);
  const tenants = (tenantsAll.data ?? []).filter((tn) => tn.projectId === projectId);
  const activity = (activityAll.data ?? []).filter((a) => a.projectId === projectId);

  const budgetRemaining = p.budget.planned - p.budget.spent;

  const addNote = () => {
    if (!note.trim()) return;
    managerActions.addNote(projectId, note.trim(), "You");
    setNote("");
    toast.success(t("manager.pm.toasts.noteAdded"));
  };

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={p.name}
        description={p.clientName}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/manager/projects"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("manager.actions.back")}</Link>
          </Button>
        }
      />

      {/* Header card */}
      <div className="mb-6 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6">
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <ProgressRing value={p.progress} label={t("manager.projectDetails.overview")} />
          <div className="space-y-2">
            <ProjectStatusBadge status={p.status} />
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden />{p.address}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Building className="h-4 w-4" aria-hidden />{t("manager.pm.building")}: {p.building} · {t("manager.pm.entrance")}: {p.entrance}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Calendar className="h-4 w-4" aria-hidden />{t("manager.projectDetails.lastUpdated")}: {formatDate(p.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("manager.projectDetails.currentStage")}</p>
              <p className="font-semibold text-foreground">{t(`tenant.timeline.stages.${p.currentStage}`)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("manager.projects.expectedCompletion")}</p>
              <p className="font-semibold text-foreground">{formatDate(p.expectedCompletion)}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          {(["overview", "tenants", "tasks", "stages", "photos", "documents", "meetings", "requests", "notes", "activity"] as const).map((k) => (
            <TabsTrigger key={k} value={k}>{t(`manager.pm.tabs.${k}`)}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <SectionCard title={t("manager.projectDetails.description")}>
                <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </SectionCard>
              <SectionCard title={t("manager.projectDetails.constructionStatus")}>
                <ul className="space-y-3">
                  {(stages.data ?? []).map((s) => (
                    <li key={s.id} className="rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{t(`tenant.timeline.stages.${s.key}`)}</p>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={s.progress} className="h-1.5 flex-1" />
                        <span className="w-10 text-end text-xs font-semibold text-muted-foreground">{s.progress}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>
            <div className="space-y-6">
              <SectionCard title={t("manager.projectDetails.budget")}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground"><Wallet className="me-1 inline h-4 w-4 align-[-2px]" aria-hidden />{t("manager.projectDetails.budgetPlanned")}</span><strong className="text-foreground">{formatNumber(p.budget.planned, { style: "currency", currency: p.budget.currency })}</strong></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t("manager.projectDetails.budgetSpent")}</span><strong className="text-foreground">{formatNumber(p.budget.spent, { style: "currency", currency: p.budget.currency })}</strong></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t("manager.projectDetails.budgetRemaining")}</span><strong className="text-foreground">{formatNumber(budgetRemaining, { style: "currency", currency: p.budget.currency })}</strong></div>
                  <Progress value={(p.budget.spent / p.budget.planned) * 100} className="h-2" />
                </div>
              </SectionCard>
              <SectionCard title={t("manager.projectDetails.assignedTeam")}>
                <ul className="space-y-3">
                  {team.map((e) => (
                    <li key={e.id} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-xs font-bold text-primary-foreground">{e.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{e.name}</p><p className="truncate text-xs text-muted-foreground">{e.role}</p></div>
                      <Badge variant="secondary" className="text-[10px]">{e.workload}%</Badge>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title={t("manager.projectDetails.timeline")}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                  {formatDate(p.expectedCompletion, { dateStyle: "full" })}
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tenants">
          {tenants.length === 0 ? <EmptyState title={t("manager.pm.tenantsPanel.empty")} /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tn) => (
                <SectionCard key={tn.id} title={tn.name}>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building className="h-3 w-3" />{tn.building}</span>
                    <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" />{tn.entrance}</span>
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{tn.floor}</span>
                    <span className="flex items-center gap-1"><Home className="h-3 w-3" />{tn.apartment}</span>
                  </div>
                  <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{tn.email}</p>
                    <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{tn.phone}</p>
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => setTaskOpen(true)}><Plus className="h-4 w-4" />{t("manager.tasks.new")}</Button></div>
          {tasks.length === 0 ? <EmptyState title={t("manager.tasks.empty")} /> : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link to="/manager/tasks/$taskId" params={{ taskId: task.id }} className="truncate font-medium text-foreground hover:text-primary">{task.title}</Link>
                    <p className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="stages">
          <div className="space-y-3">
            {(stages.data ?? []).map((s) => (
              <SectionCard
                key={s.id}
                title={t(`tenant.timeline.stages.${s.key}`)}
                action={<Button size="sm" variant="outline" onClick={() => setStageEditing(s)}>{t("manager.stages.update")}</Button>}
              >
                <div className="flex items-center justify-between"><StatusBadge status={s.status} /><span className="text-sm font-semibold">{s.progress}%</span></div>
                <Progress value={s.progress} className="mt-2 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">{s.notes}</p>
              </SectionCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="photos">
          <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => setPhotoOpen(true)}><Plus className="h-4 w-4" />{t("manager.pm.photos.new")}</Button></div>
          {photos.length === 0 ? <EmptyState title={t("manager.pm.photos.empty")} /> : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((ph) => (
                <div key={ph.id} className="group relative overflow-hidden rounded-xl border border-border">
                  <div className="aspect-square" style={{ background: `linear-gradient(135deg, ${ph.color}, ${ph.color}bb)` }}>
                    <ImageIcon className="mx-auto mt-8 h-10 w-10 text-white/70" />
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-1 text-xs font-medium">{ph.title}</p>
                    <p className="text-[10px] text-muted-foreground">{t(`tenant.timeline.stages.${ph.stageKey}`)}</p>
                  </div>
                  <Button variant="secondary" size="icon" className="absolute end-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100" onClick={async () => { try { await managerActions.deletePhoto(ph.id); toast.success(t("manager.pm.toasts.deleted")); photosAll.refetch(); } catch { toast.error(t("common.error")); } }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => setDocOpen(true)}><Plus className="h-4 w-4" />{t("manager.pm.documents.new")}</Button></div>
          {docs.length === 0 ? <EmptyState title={t("manager.pm.documents.empty")} /> : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.size} · {formatDate(d.uploadedAt)}</p></div>
                  <Badge variant="secondary" className="rounded-full">{t(`manager.pm.documents.categories.${d.category}`)}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => { try { await managerActions.deleteDocument(d.id); toast.success(t("manager.pm.toasts.deleted")); docsAll.refetch(); } catch { toast.error(t("common.error")); } }}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="meetings">
          <div className="mb-3 flex justify-end"><Button size="sm" onClick={() => setMeetingOpen(true)}><Plus className="h-4 w-4" />{t("manager.meetings.new")}</Button></div>
          {meetings.length === 0 ? <EmptyState title={t("manager.meetings.empty")} /> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {meetings.map((m) => (
                <SectionCard key={m.id} title={m.title} description={m.location}>
                  <p className="text-xs text-muted-foreground">{formatDate(m.when, { dateStyle: "medium", timeStyle: "short" })} · {m.durationMin} {t("manager.meetings.minutes")}</p>
                </SectionCard>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {requests.length === 0 ? <EmptyState title={t("manager.requests.empty")} /> : (
            <div className="grid gap-3">
              {requests.map((r) => (
                <RequestCard key={r.id} request={r} projectName={p.name} assigneeName={(employees.data ?? []).find((e) => e.id === r.assignedTo)?.name} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <SectionCard title={t("manager.pm.notes.title")}>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("manager.pm.notes.placeholder")} rows={3} />
            <div className="mt-2 flex justify-end"><Button size="sm" onClick={addNote} disabled={!note.trim()}><StickyNote className="h-4 w-4" />{t("manager.pm.notes.add")}</Button></div>
          </SectionCard>
          {notes.length === 0 ? <EmptyState title={t("manager.pm.notes.empty")} /> : (
            <ul className="mt-4 space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold">{n.author}</p><span className="text-xs text-muted-foreground">{formatDate(n.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <div className="mt-1 text-end"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { managerActions.deleteNote(n.id); toast.success(t("manager.pm.toasts.deleted")); }}><Trash2 className="h-3.5 w-3.5" /></Button></div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {activity.length === 0 ? <EmptyState title={t("manager.activity.empty")} /> : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground"><strong>{a.actor}</strong> {a.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} task={null} projects={project.data ? [project.data] : []} employees={employees.data ?? []} defaultProjectId={projectId} />
      <MeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} meeting={null} projects={project.data ? [project.data] : []} defaultProjectId={projectId} onSaved={meetingsAll.refetch} />
      <PhotoUploadDialog open={photoOpen} onOpenChange={setPhotoOpen} projects={project.data ? [project.data] : []} defaultProjectId={projectId} onSaved={photosAll.refetch} />
      <DocumentUploadDialog open={docOpen} onOpenChange={setDocOpen} projects={project.data ? [project.data] : []} defaultProjectId={projectId} onSaved={docsAll.refetch} />
      <StageUpdateDialog open={!!stageEditing} onOpenChange={(o) => !o && setStageEditing(null)} stage={stageEditing} />
    </RoleGuard>
  );
}

function EmptyProject() {
  const { t } = useI18n();
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {t("manager.projects.empty")}
    </div>
  );
}
