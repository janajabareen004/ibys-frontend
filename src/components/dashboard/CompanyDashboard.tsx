import { Link } from "@tanstack/react-router";
import {
  FolderKanban,
  Layers,
  Camera,
  FileText,
  Inbox,
  CalendarClock,
  AlertTriangle,
  Bell,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { StatCard } from "@/components/manager/StatCard";
import { SectionCard } from "@/components/manager/SectionCard";
import { CompanyProjectStatusBadge } from "@/components/company/CompanyProjectStatusBadge";
import { CompanyStageStatusBadge } from "@/components/company/CompanyStageStatusBadge";
import { UploadQueueItem } from "@/components/company/UploadQueueItem";
import { RoleHeroArt } from "@/components/dashboard/RoleHeroArt";

import {
  useCompanyProjects,
  useCompanyStages,
  useCompanyUploads,
  useCompanyRequests,
  useCompanyMeetings,
  useCompanyNotifications,
  useCompanyActivity,
  useCompanyEmployees,
} from "@/hooks/useCompanyData";

export function CompanyDashboard() {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const projects = useCompanyProjects();
  const stages = useCompanyStages();
  const uploads = useCompanyUploads();
  const requests = useCompanyRequests();
  const meetings = useCompanyMeetings();
  const notifications = useCompanyNotifications();
  const activity = useCompanyActivity();
  const employees = useCompanyEmployees();

  const projectsList = projects.data ?? [];
  const stagesList = stages.data ?? [];
  const uploadsList = uploads.data ?? [];
  const requestsList = requests.data ?? [];
  const meetingsList = meetings.data ?? [];
  const notifsList = notifications.data ?? [];
  const activityList = activity.data ?? [];
  const employeesList = employees.data ?? [];

  const active = projectsList.filter((p) => p.status !== "completed" && p.status !== "on_hold");
  const inProgress = stagesList.filter((s) => s.status === "current").length;
  const delayed = stagesList.filter((s) => s.status === "delayed").length;
  const pendingPhotoUploads = uploadsList.filter((u) => u.kind === "photo" && (u.status === "uploading" || u.status === "queued")).length;
  const pendingDocUploads = uploadsList.filter((u) => u.kind === "document" && (u.status === "uploading" || u.status === "queued")).length;
  const pendingRequests = requestsList.filter((r) => r.status === "pending").length;
  const upcoming = meetingsList.filter((m) => m.status === "upcoming" || m.status === "today").length;
  const unread = notifsList.filter((n) => !n.read).length;
  const onSite = employeesList.filter((e) => e.availability === "on_site").length;

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
                  {t("company.hero.welcome", { name: user?.name ?? "" })}
                </h1>
                <p className="mt-0.5 max-w-xl text-xs text-primary-foreground/80 sm:text-sm">{t("company.hero.subtitle")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="rounded-xl bg-primary-foreground/10 px-3 py-1.5 backdrop-blur sm:px-4 sm:py-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{t("company.hero.activeProjects")}</p>
                  <p className="text-lg font-bold sm:text-xl">{active.length}</p>
                </div>
                <div className="rounded-xl bg-primary-foreground/10 px-3 py-1.5 backdrop-blur sm:px-4 sm:py-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{t("company.hero.teamOnSite")}</p>
                  <p className="text-lg font-bold sm:text-xl">{onSite}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <RoleHeroArt role="BUILDING_COMPANY" />
          </div>
        </div>
      </div>


      {/* KPI grid */}
      <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("company.kpi.activeProjects")} value={active.length} icon={<FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />} accent="primary" />
        <StatCard label={t("company.kpi.stagesInProgress")} value={inProgress} icon={<Layers className="h-4 w-4 sm:h-5 sm:w-5" />} accent="primary" />
        <StatCard label={t("company.kpi.pendingPhotos")} value={pendingPhotoUploads} icon={<Camera className="h-4 w-4 sm:h-5 sm:w-5" />} accent="warn" />
        <StatCard label={t("company.kpi.pendingDocuments")} value={pendingDocUploads} icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />} accent="warn" />
        <StatCard label={t("company.kpi.tenantRequests")} value={pendingRequests} icon={<Inbox className="h-4 w-4 sm:h-5 sm:w-5" />} accent="warn" />
        <StatCard label={t("company.kpi.upcomingMeetings")} value={upcoming} icon={<CalendarClock className="h-4 w-4 sm:h-5 sm:w-5" />} accent="primary" />
        <StatCard label={t("company.kpi.delayedStages")} value={delayed} icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />} accent="danger" />
        <StatCard label={t("company.kpi.notifications")} value={unread} icon={<Bell className="h-4 w-4 sm:h-5 sm:w-5" />} accent="muted" />
      </div>

      {/* Quick actions */}
      <SectionCard title={t("company.sections.quickActions")}>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link to="/company/documents"><UploadCloud className="h-4 w-4" />{t("company.actions.uploadDocuments")}</Link></Button>
          <Button asChild size="sm" variant="outline"><Link to="/company/stages"><Layers className="h-4 w-4" />{t("company.actions.publishUpdate")}</Link></Button>
          <Button asChild size="sm" variant="ghost"><Link to="/company/assistant"><Sparkles className="h-4 w-4" />{t("nav.assistant")}</Link></Button>
        </div>

      </SectionCard>

      {/* Two-column */}
      <div className="grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 lg:col-span-2">
          <SectionCard
            title={t("company.sections.activeProjects")}
            action={<Button asChild variant="ghost" size="sm"><Link to="/company/projects">{t("company.actions.viewAll")}</Link></Button>}
          >
            <ul className="divide-y divide-border">
              {active.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/company/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="grid items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.projectManager} · {t(`tenant.timeline.stages.${p.currentStage}`)}</p>
                    </div>
                    <div className="hidden w-40 sm:block">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">{p.progress}%</span>
                        <span className="text-muted-foreground">{formatDate(p.expectedCompletion)}</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                    <CompanyProjectStatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.sections.currentStageUpdates")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/stages">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {stagesList.filter((s) => s.status === "current" || s.status === "delayed").slice(0, 4).map((s) => (
                <li key={s.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{t(`tenant.timeline.stages.${s.key}`)}</p>
                    <CompanyStageStatusBadge status={s.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={s.progress} className="h-1.5 flex-1" />
                    <span className="w-10 text-end text-xs font-semibold text-muted-foreground">{s.progress}%</span>
                  </div>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{s.responsibleTeam}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.sections.recentUploadActivity")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/documents">{t("company.actions.viewAll")}</Link></Button>}>
            <div className="space-y-2">
              {uploadsList.slice(0, 4).map((u) => <UploadQueueItem key={u.id} item={u} />)}
            </div>
          </SectionCard>

        </div>

        {/* Right */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          <SectionCard title={t("company.sections.upcomingMeetings")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/meetings">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {meetingsList.filter((m) => m.status === "upcoming" || m.status === "today").slice(0, 4).map((m) => (
                <li key={m.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(m.when, { dateStyle: "medium", timeStyle: "short" })} · {m.location}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.sections.pendingRequests")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/requests">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {requestsList.filter((r) => r.status === "pending").slice(0, 4).map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="truncate text-foreground">{r.description}</p>
                  <p className="text-xs text-muted-foreground">{r.tenantName}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.sections.notifications")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/notifications">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {notifsList.slice(0, 5).map((n) => (
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

          <SectionCard title={t("company.sections.teamOnSite")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/team">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-2">
              {employeesList.filter((e) => e.availability === "on_site").slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-[10px] font-bold text-primary-foreground">{e.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{e.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.sections.recentUploadActivity")}>
            <ul className="space-y-3">
              {activityList.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-foreground"><strong className="font-semibold">{a.actor}</strong> {a.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
