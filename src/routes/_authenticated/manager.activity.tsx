import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerActivity, useManagerProjects } from "@/hooks/useManagerData";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { CheckCircle2, PlusCircle, CalendarPlus, CalendarClock, Layers, Image, FileText, Inbox, ThumbsUp, ThumbsDown, StickyNote, Reply, Trash2, RefreshCcw } from "lucide-react";
import type { ActivityEvent } from "@/mocks/mockManagerService";

const ICONS: Record<ActivityEvent["type"], React.ReactNode> = {
  task_completed: <CheckCircle2 className="h-4 w-4" aria-hidden />,
  task_created: <PlusCircle className="h-4 w-4" aria-hidden />,
  task_updated: <RefreshCcw className="h-4 w-4" aria-hidden />,
  task_deleted: <Trash2 className="h-4 w-4" aria-hidden />,
  meeting_scheduled: <CalendarPlus className="h-4 w-4" aria-hidden />,
  meeting_updated: <CalendarClock className="h-4 w-4" aria-hidden />,
  stage_updated: <Layers className="h-4 w-4" aria-hidden />,
  photo_uploaded: <Image className="h-4 w-4" aria-hidden />,
  document_added: <FileText className="h-4 w-4" aria-hidden />,
  request_received: <Inbox className="h-4 w-4" aria-hidden />,
  request_replied: <Reply className="h-4 w-4" aria-hidden />,
  request_approved: <ThumbsUp className="h-4 w-4" aria-hidden />,
  request_rejected: <ThumbsDown className="h-4 w-4" aria-hidden />,
  note_added: <StickyNote className="h-4 w-4" aria-hidden />,
};

export const Route = createFileRoute("/_authenticated/manager/activity")({
  head: () => ({
    meta: [
      { title: "Activity log – IBYS Manager" },
      { name: "description", content: "Everything that has happened across your portfolio." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data, loading } = useManagerActivity();
  const { data: projects } = useManagerProjects();
  const projectName = (id?: string) => (id ? projects?.find((p) => p.id === id)?.name : undefined);

  const sorted = (data ?? []).slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader title={t("manager.activity.title")} description={t("manager.activity.description")} />

      {loading ? <InlineLoader /> : sorted.length === 0 ? <EmptyState title={t("manager.activity.empty")} /> : (
        <ol className="relative ms-3 space-y-4 border-s border-border ps-6">
          {sorted.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -start-9 grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary ring-4 ring-background">{ICONS[e.type]}</span>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-sm text-foreground"><strong className="font-semibold">{e.actor}</strong> {e.message}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t(`manager.activity.types.${e.type}`)}</span>
                  {projectName(e.projectId) && <><span>·</span><span>{projectName(e.projectId)}</span></>}
                  <span>·</span>
                  <span>{formatDate(e.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </RoleGuard>
  );
}
