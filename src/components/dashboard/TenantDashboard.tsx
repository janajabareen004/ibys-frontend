import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  TrendingUp,
  Layers,
  CalendarClock,
  Bell,
  Sparkles,
  Camera,
  FileText,
  MessageSquare,
  ArrowRight,
  MapPin,
  ClockIcon,
  DoorOpen,
  Building,
  Home,
  User,
  Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { DashboardCard } from "./DashboardCard";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  useTenantProject,
  useTenantStages,
  useTenantPhotos,
  useTenantMeetings,
  useTenantNotifications,
  useTenantComments,
  useTenantDocuments,
  useTenantRequests,
} from "@/hooks/useTenantData";
import { StageTimeline } from "@/components/tenant/StageTimeline";
import { StatusBadge } from "@/components/tenant/StatusBadge";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { SectionNav, TENANT_DASHBOARD_SECTIONS } from "./SectionNav";
import { RoleHeroArt } from "./RoleHeroArt";


function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function PropertyChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-primary-foreground/90">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary-foreground/70 sm:h-4 sm:w-4" aria-hidden />
      <span className="text-primary-foreground/70">{label}:</span>
      <span className="truncate font-semibold text-primary-foreground">{value}</span>
    </span>
  );
}

export function TenantDashboard() {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();

  const { data: project } = useTenantProject();
  const { data: stages } = useTenantStages();
  const { data: photos } = useTenantPhotos();
  const { data: meetings } = useTenantMeetings();
  const { data: notifications } = useTenantNotifications();
  const { data: comments } = useTenantComments();
  const { data: docs } = useTenantDocuments();
  const { data: requests } = useTenantRequests();

  const currentStage = stages?.find((s) => s.status === "current");
  const nextMeeting = meetings?.filter((m) => m.status === "upcoming").sort((a, b) => +new Date(a.when) - +new Date(b.when))[0];
  const unread = notifications?.filter((n) => !n.read).length ?? 0;
  const pendingRequests = requests?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div className="space-y-3 sm:space-y-5 lg:space-y-6 [&_[data-section]]:scroll-mt-32">
      <PageHeader
        title={t("dashboard.welcome", { name: user?.name ?? "" })}
        description={formatDate(new Date(), { dateStyle: "full" })}
        actions={<Badge variant="secondary">{t("roles.TENANT")}</Badge>}
      />

      <SectionNav items={TENANT_DASHBOARD_SECTIONS} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-md sm:shadow-lg">
        <div className="grid md:grid-cols-[minmax(0,62%)_38%] md:items-stretch">
          <div className="order-2 p-3 sm:p-5 lg:p-7 md:order-1">
            <div className="grid gap-3 md:gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0 space-y-1.5 sm:space-y-2 lg:space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-widest text-primary-foreground/70 sm:text-xs">
                  {t("tenant.hero.currentProject")}
                </div>
                <h2 className="text-lg font-bold sm:text-2xl lg:text-3xl">
                  {user?.property?.projectName ?? project?.name ?? "…"}
                </h2>
                {user?.property && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl bg-white/10 p-2.5 text-xs backdrop-blur-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 sm:bg-transparent sm:p-0 sm:text-sm sm:backdrop-blur-none">
                    <PropertyChip icon={Building} label={t("tenant.property.building")} value={user.property.buildingNumber} />
                    <PropertyChip icon={DoorOpen} label={t("tenant.property.entrance")} value={user.property.entranceNumber} />
                    <PropertyChip icon={Layers} label={t("tenant.property.floor")} value={user.property.floorNumber} />
                    <PropertyChip icon={Home} label={t("tenant.property.apartment")} value={user.property.apartmentNumber} />
                    <PropertyChip icon={User} label={t("tenant.property.tenant")} value={user.name} />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-primary-foreground/80 sm:text-sm sm:gap-x-3 sm:gap-y-1">
                  {project && (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                        {project.address}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                        {currentStage ? t(currentStage.nameKey) : "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                        {formatDate(project.expectedDelivery)}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5 sm:pt-1">
                  <Button asChild size="default" variant="secondary" className="h-10">
                    <Link to="/tenant/project">
                      <Building2 className="h-4 w-4" />
                      {t("nav.myProject")}
                    </Link>
                  </Button>
                  <Button asChild size="default" variant="outline" className="h-10 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                    <Link to="/tenant/timeline">
                      <CalendarClock className="h-4 w-4" />
                      {t("tenant.actions.viewTimeline")}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid w-full min-w-0 max-w-none grid-cols-[auto_1fr] items-center gap-3 rounded-2xl bg-primary-foreground/10 p-3 backdrop-blur sm:flex sm:max-w-[16rem] sm:flex-col sm:gap-4 sm:p-5">
                  <div className="text-center sm:w-full">
                    <div className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
                      {project?.progress ?? 0}%
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-foreground/70 sm:text-xs">
                      {t("tenant.hero.overallProgress")}
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1.5 sm:space-y-2 sm:w-full">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/20 sm:h-2">
                      <div
                        className="absolute top-0 start-0 h-full rounded-full bg-primary-foreground transition-all duration-500"
                        style={{ width: `${project?.progress ?? 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-primary-foreground/90 sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_rgba(110,231,183,0.6)] sm:h-2 sm:w-2" />
                      {t("tenant.hero.onTrack")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <RoleHeroArt role="TENANT" />
          </div>
        </div>
      </section>

      {/* Stat cards — equal height row */}
      <section className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label={t("tenant.stats.progress")} value={`${project?.progress ?? 0}%`} tone="primary" />
        <StatCard icon={<Layers className="h-4 w-4" />} label={t("tenant.stats.currentStage")} value={currentStage ? t(currentStage.nameKey) : "—"} />
        <StatCard icon={<ClockIcon className="h-4 w-4" />} label={t("tenant.stats.daysRemaining")} value={project ? String(daysUntil(project.expectedDelivery)) : "—"} tone="accent" />
        <StatCard icon={<Bell className="h-4 w-4" />} label={t("tenant.stats.unread")} value={String(unread)} />
      </section>

      {/* Quick actions — dedicated section */}
      <section id="section-quick-actions" data-section>
        <DashboardCard title={t("tenant.stats.quickActions")} icon={<Sparkles className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <QuickAction to="/tenant/timeline" icon={<CalendarClock className="h-5 w-5" />} label={t("tenant.actions.viewTimeline")} />
            <QuickAction to="/tenant/requests" icon={<Camera className="h-5 w-5" />} label={t("tenant.actions.requestPhotos")} badge={pendingRequests > 0 ? String(pendingRequests) : undefined} />
            <QuickAction to="/tenant/meetings" icon={<CalendarClock className="h-5 w-5" />} label={t("tenant.actions.scheduleMeeting")} />
            <QuickAction to="/tenant/documents" icon={<FileText className="h-5 w-5" />} label={t("tenant.actions.openDocuments")} badge={docs ? String(docs.length) : undefined} />
            <QuickAction to="/tenant/assistant" icon={<Sparkles className="h-5 w-5" />} label={t("tenant.actions.askAssistant")} />
          </div>
        </DashboardCard>
      </section>

      {/* Main 12-col grid: left 8 / right 4 */}
      <section className="grid grid-cols-1 gap-3 lg:gap-4 lg:grid-cols-12">
        {/* LEFT */}
        <div className="flex flex-col gap-3 lg:gap-4 lg:col-span-8">
          <div id="section-timeline" data-section>
            <DashboardCard
              title={t("tenant.sections.timelinePreview")}
              icon={<CalendarClock className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/tenant/timeline">
                    {t("tenant.actions.viewAll")}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                </Button>
              }
            >
              {stages ? <StageTimeline stages={stages.slice(0, 3)} compact /> : <InlineLoader />}
            </DashboardCard>
          </div>

          <div id="section-photos" data-section>
            <DashboardCard
              title={t("tenant.sections.recentPhotos")}
              icon={<Camera className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/tenant/photos">
                    {t("tenant.actions.viewAll")}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                </Button>
              }
            >
              {photos ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                  {photos.slice(0, 4).map((p) => (
                    <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={p.url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              ) : <InlineLoader />}
            </DashboardCard>
          </div>

          <div id="section-updates" data-section>
            <DashboardCard
              title={t("tenant.sections.latestUpdates")}
              icon={<Sparkles className="h-4 w-4" />}
            >
              {stages ? (
                <ul className="space-y-2 sm:space-y-3">
                  {stages.filter((s) => s.status !== "pending").slice(0, 4).map((s) => (
                    <li key={s.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-2.5 sm:p-3">
                      <span className="mt-0.5"><StatusBadge status={s.status} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground">{t(s.nameKey)}</div>
                        <p className="text-xs text-muted-foreground">{s.latestUpdate}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <InlineLoader />}
            </DashboardCard>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-3 lg:gap-4 lg:col-span-4">
          <div id="section-meetings" data-section>
            <DashboardCard
              title={t("tenant.sections.upcomingMeetings")}
              icon={<CalendarClock className="h-4 w-4" />}
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link to="/tenant/meetings"><ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></Link>
                </Button>
              }
            >
              {nextMeeting ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="text-sm font-semibold">{nextMeeting.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDate(nextMeeting.when, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{nextMeeting.location}</div>
                </div>
              ) : <p className="text-sm text-muted-foreground">—</p>}
            </DashboardCard>
          </div>

          <div id="section-notifications" data-section>
            <DashboardCard title={t("tenant.sections.notifications")} icon={<Bell className="h-4 w-4" />}>
              {notifications ? (
                <ul className="space-y-2 text-sm">
                  {notifications.slice(0, 4).map((n) => (
                    <li key={n.id} className="flex items-start gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      {!n.read && <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{n.title}</div>
                        <div className="text-xs text-muted-foreground">{n.body}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <InlineLoader />}
            </DashboardCard>
          </div>

          <div id="section-comments" data-section>
            <DashboardCard title={t("tenant.sections.recentComments")} icon={<MessageSquare className="h-4 w-4" />}>
              {comments ? (
                <ul className="space-y-3">
                  {comments.slice(0, 3).map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        {c.author.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs">
                          <span className="font-semibold text-foreground">{c.author}</span>{" "}
                          <span className="text-muted-foreground">· {t(`roles.${c.role}`)}</span>
                        </div>
                        <p className="text-sm text-foreground/90">{c.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <InlineLoader />}
            </DashboardCard>
          </div>

          <div id="section-assistant" data-section>
            <DashboardCard title={t("tenant.sections.aiPreview")} icon={<Sparkles className="h-4 w-4" />}>
              <div className="space-y-2">
                <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {t("tenant.assistant.welcome")}
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/tenant/assistant">
                    <Sparkles className="h-4 w-4" />
                    {t("tenant.actions.askAssistant")}
                  </Link>
                </Button>
              </div>
            </DashboardCard>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon, label, value, tone,
}: {
  icon: React.ReactNode; label: string; value: string; tone?: "primary" | "accent";
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "accent"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        : "bg-muted text-foreground";
  return (
    <div className="flex h-full items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md sm:gap-3 sm:p-4">
      <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-10 sm:w-10 ${toneCls}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground sm:text-xs">{label}</div>
        <div className="truncate text-sm font-bold text-foreground sm:text-base lg:text-lg">{value}</div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <Link
      to={to}
      className="group relative flex h-full min-h-[5rem] flex-col items-start justify-between gap-1.5 rounded-xl border border-border bg-card p-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:min-h-[6.5rem] sm:gap-2 sm:p-3 lg:min-h-[7rem] lg:p-4"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:h-10 sm:w-10">
        {icon}
      </span>
      <span className="pe-8 text-xs font-semibold leading-tight text-foreground sm:text-sm">{label}</span>
      {badge && (
        <Badge variant="secondary" className="absolute end-2 top-2 text-[10px] sm:end-3 sm:top-3">{badge}</Badge>
      )}
    </Link>
  );
}
