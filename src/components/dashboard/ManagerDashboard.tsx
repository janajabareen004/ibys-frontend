import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  FolderKanban, AlertTriangle, CalendarClock, FileBarChart, Plus, ClipboardList,
  Sparkles, Bell, CheckCircle2, TrendingUp, ArrowRight, Inbox, FileText, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { StatCard } from "@/components/manager/StatCard";
import { SectionCard } from "@/components/manager/SectionCard";
import { ProjectStatusBadge } from "@/components/manager/ProjectStatusBadge";
import { PriorityBadge } from "@/components/manager/PriorityBadge";
import { TaskStatusBadge } from "@/components/manager/TaskStatusBadge";
import { ChartPlaceholder } from "@/components/manager/ChartPlaceholder";
import { RoleHeroArt } from "./RoleHeroArt";

import { TaskDialog } from "@/components/manager/dialogs/TaskDialog";
import { MeetingDialog } from "@/components/manager/dialogs/MeetingDialog";
import {
  useManagerProjects,
  useManagerTasks,
  useManagerRequests,
  useManagerMeetings,
  useManagerNotifications,
  useManagerActivity,
  useManagerPhotos,
  useManagerDocuments,
  useManagerEmployees,
} from "@/hooks/useManagerData";

export function ManagerDashboard() {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const projects = useManagerProjects();
  const tasks = useManagerTasks();
  const requests = useManagerRequests();
  const meetings = useManagerMeetings();
  const notifications = useManagerNotifications();
  const activity = useManagerActivity();
  const photos = useManagerPhotos();
  const documents = useManagerDocuments();
  const employees = useManagerEmployees();

  const [taskOpen, setTaskOpen] = React.useState(false);
  const [meetingOpen, setMeetingOpen] = React.useState(false);


  const projectsList = projects.data ?? [];
  const tasksList = tasks.data ?? [];
  const requestsList = requests.data ?? [];
  const meetingsList = meetings.data ?? [];
  const notificationsList = notifications.data ?? [];
  const activityList = activity.data ?? [];

  const activeProjects = projectsList.filter((p) => p.status !== "completed" && p.status !== "on_hold");
  const atRisk = projectsList.filter((p) => p.status === "at_risk" || p.status === "delayed").length;
  const delayedTasks = tasksList.filter((t) => new Date(t.dueDate).getTime() < Date.now() && t.status !== "completed").length;
  const pendingRequests = requestsList.filter((r) => r.status === "pending").length;
  const upcoming = meetingsList.filter((m) => m.status === "upcoming" || m.status === "today").length;
  const completedThisWeek = tasksList.filter((t) => t.status === "completed").length;
  const unread = notificationsList.filter((n) => !n.read).length;
  const portfolioProgress = projectsList.length
    ? Math.round(projectsList.reduce((s, p) => s + p.progress, 0) / projectsList.length)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-sm">
        <div className="grid md:grid-cols-[minmax(0,62%)_38%] md:items-stretch">
          <div className="order-2 p-4 sm:p-6 lg:p-8 md:order-1">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70 sm:text-xs">
                  {formatDate(new Date(), { dateStyle: "full" })}
                </p>
                <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                  {t("manager.hero.welcome", { name: user?.name ?? "" })}
                </h1>
                <p className="mt-0.5 max-w-xl text-xs text-primary-foreground/80 sm:text-sm">
                  {t("manager.hero.subtitle")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="rounded-xl bg-primary-foreground/10 px-3 py-1.5 backdrop-blur sm:px-4 sm:py-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{t("manager.hero.activeProjects")}</p>
                  <p className="text-lg font-bold sm:text-xl">{activeProjects.length}</p>
                </div>
                <div className="rounded-xl bg-primary-foreground/10 px-3 py-1.5 backdrop-blur sm:px-4 sm:py-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{t("manager.hero.teamMembers")}</p>
                  <p className="text-lg font-bold sm:text-xl">6</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <RoleHeroArt role="PROJECT_MANAGER" />
          </div>
        </div>
      </div>


      {/* KPI grid */}
      <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("manager.kpi.activeProjects")} value={activeProjects.length} icon={<FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />} accent="primary" />
        <StatCard label={t("manager.kpi.atRisk")} value={atRisk} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} accent="warn" />
        <StatCard label={t("manager.kpi.delayedTasks")} value={delayedTasks} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} accent="danger" />
        <StatCard label={t("manager.kpi.pendingRequests")} value={pendingRequests} icon={<Inbox className="h-4 w-4 sm:h-5 sm:w-5" />} accent="warn" />
        <StatCard label={t("manager.kpi.upcomingMeetings")} value={upcoming} icon={<CalendarClock className="h-4 w-4 sm:h-5 sm:w-5" />} accent="primary" />
        <StatCard label={t("manager.kpi.completedThisWeek")} value={completedThisWeek} icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />} accent="success" />
        <StatCard label={t("manager.kpi.portfolioProgress")} value={`${portfolioProgress}%`} icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />} accent="primary" />
        <StatCard label={t("manager.kpi.newNotifications")} value={unread} icon={<Bell className="h-4 w-4 sm:h-5 sm:w-5" />} accent="muted" />
      </div>

      {/* Quick actions */}
      <SectionCard title={t("manager.sections.quickActions")}>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link to="/manager/projects"><Plus className="h-4 w-4" />{t("manager.actions.newProject")}</Link></Button>
          <Button size="sm" variant="secondary" onClick={() => setTaskOpen(true)}><ClipboardList className="h-4 w-4" />{t("manager.actions.newTask")}</Button>
          <Button size="sm" variant="outline" onClick={() => setMeetingOpen(true)}><CalendarClock className="h-4 w-4" />{t("manager.actions.scheduleMeeting")}</Button>
          <Button asChild size="sm" variant="ghost"><Link to="/manager/reports"><FileBarChart className="h-4 w-4" />{t("manager.actions.generateReport")}</Link></Button>
          <Button asChild size="sm" variant="ghost"><Link to="/manager/assistant"><Sparkles className="h-4 w-4" />{t("nav.assistant")}</Link></Button>
        </div>
      </SectionCard>

      {/* Two columns */}
      <div className="grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 lg:col-span-2">
          <SectionCard
            title={t("manager.sections.portfolio")}
            action={<Button asChild variant="ghost" size="sm"><Link to="/manager/reports">{t("manager.actions.viewAll")}</Link></Button>}
          >
            <ChartPlaceholder variant="area" height={180} />
          </SectionCard>

          <SectionCard
            title={t("manager.sections.activeProjects")}
            action={<Button asChild variant="ghost" size="sm"><Link to="/manager/projects">{t("manager.actions.viewAll")}</Link></Button>}
          >
            <ul className="divide-y divide-border">
              {activeProjects.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link to="/manager/projects/$projectId" params={{ projectId: p.id }} className="grid items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.clientName} · {t(`tenant.timeline.stages.${p.currentStage}`)}</p>
                    </div>
                    <div className="hidden w-40 sm:block">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{p.progress}%</span>
                        <span className="text-muted-foreground">{p.expectedCompletion ? formatDate(p.expectedCompletion) : "—"}</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
              {activeProjects.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">{t("manager.projects.empty")}</li>}
            </ul>
          </SectionCard>

          <SectionCard title={t("manager.sections.activityFeed")} action={<Button asChild variant="ghost" size="sm"><Link to="/manager/activity">{t("manager.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {activityList.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground"><strong className="font-semibold">{e.actor}</strong> {e.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("manager.sections.stageProgress")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["structural", "electrical", "plaster", "windows", "finishing", "handover"] as const).map((s, i) => {
                const value = [95, 82, 58, 22, 15, 5][i];
                return (
                  <div key={s} className="rounded-xl border border-border/60 bg-card p-3">
                    <p className="text-xs font-semibold text-foreground">{t(`tenant.timeline.stages.${s}`)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={value} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold text-muted-foreground">{value}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right col */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          <SectionCard title={t("manager.sections.upcomingMeetings")} action={<Button asChild variant="ghost" size="sm"><Link to="/manager/meetings">{t("manager.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {meetingsList.filter((m) => m.status === "upcoming" || m.status === "today").slice(0, 4).map((m) => (
                <li key={m.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(m.when, { dateStyle: "medium", timeStyle: "short" })} · {m.location}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("manager.sections.pendingApprovals")} action={<Button asChild variant="ghost" size="sm"><Link to="/manager/requests">{t("manager.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {requestsList.filter((r) => r.status === "pending").slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground">{r.tenantName}</p>
                  </div>
                  <PriorityBadge priority={r.priority} />
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("manager.sections.teamTasks")} action={<Button asChild variant="ghost" size="sm"><Link to="/manager/tasks">{t("manager.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {tasksList.slice(0, 4).map((task) => (
                <li key={task.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(task.dueDate)}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("manager.sections.notifications")} action={<Button asChild variant="ghost" size="sm"><Link to="/manager/notifications">{t("manager.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {notificationsList.slice(0, 4).map((n) => (
                <li key={n.id} className="flex items-start gap-2 text-sm">
                  <Badge variant={n.read ? "outline" : "default"} className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full p-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                  </div>
                  <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* Bonus widget row */}
      <div className="grid gap-4 sm:gap-5 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SectionCard title={t("manager.pm.widgets.recentDocuments")} action={<Button asChild variant="ghost" size="sm"><Link to="/manager/documents">{t("manager.actions.viewAll")}</Link></Button>}>
          <ul className="space-y-2 text-sm">
            {(documents.data ?? []).slice(0, 5).map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1"><p className="truncate font-medium text-foreground">{d.name}</p><p className="text-xs text-muted-foreground">{d.uploadedBy} · {formatDate(d.uploadedAt)}</p></div>
                <Badge variant="secondary" className="rounded-full text-[10px]">{t(`manager.pm.documents.categories.${d.category}`)}</Badge>
              </li>
            ))}
            {(documents.data ?? []).length === 0 && <li className="text-sm text-muted-foreground">—</li>}
          </ul>
        </SectionCard>

        <SectionCard title={t("manager.pm.widgets.recentPhotos")} action={<Button asChild variant="ghost" size="sm"><Link to="/manager/photos">{t("manager.actions.viewAll")}</Link></Button>}>
          <div className="grid grid-cols-3 gap-2">
            {(photos.data ?? []).slice(0, 6).map((ph) => (
              <div key={ph.id} className="relative aspect-square overflow-hidden rounded-lg" style={{ background: `linear-gradient(135deg, ${ph.color}, ${ph.color}bb)` }}>
                <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-white/70" aria-hidden />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t("manager.pm.widgets.teamActivity")}>
          <ul className="space-y-2 text-sm">
            {(employees.data ?? []).slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-[10px] font-bold text-primary-foreground">{e.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                <div className="min-w-0 flex-1"><p className="truncate font-medium text-foreground">{e.name}</p><p className="truncate text-xs text-muted-foreground">{e.role}</p></div>
                <Badge variant="outline" className="text-[10px]">{e.workload}%</Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} task={null} projects={projectsList} employees={employees.data ?? []} />
      <MeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} meeting={null} projects={projectsList} onSaved={meetings.refetch} />
    </div>
  );
}
