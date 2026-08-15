import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyActivity, useCompanyProjects } from "@/hooks/useCompanyData";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  Layers, Camera, FileText, CalendarCheck, CalendarX, CheckCircle2, Inbox,
  PlusCircle, RefreshCcw, Trash2, CalendarPlus, CalendarClock, Reply, ThumbsUp, ThumbsDown, StickyNote,
} from "lucide-react";
import type { CompanyActivityType } from "@/mocks/mockCompanyService";

const ICONS: Record<CompanyActivityType, React.ReactNode> = {
  // Original mock-only vocabulary.
  stage_updated: <Layers className="h-4 w-4" />,
  photo_uploaded: <Camera className="h-4 w-4" />,
  document_uploaded: <FileText className="h-4 w-4" />,
  meeting_approved: <CalendarCheck className="h-4 w-4" />,
  meeting_rejected: <CalendarX className="h-4 w-4" />,
  request_completed: <CheckCircle2 className="h-4 w-4" />,
  request_received: <Inbox className="h-4 w-4" />,
  // Real public.activity_events vocabulary.
  task_created: <PlusCircle className="h-4 w-4" />,
  task_updated: <RefreshCcw className="h-4 w-4" />,
  task_deleted: <Trash2 className="h-4 w-4" />,
  task_completed: <CheckCircle2 className="h-4 w-4" />,
  meeting_scheduled: <CalendarPlus className="h-4 w-4" />,
  meeting_updated: <CalendarClock className="h-4 w-4" />,
  document_added: <FileText className="h-4 w-4" />,
  request_replied: <Reply className="h-4 w-4" />,
  request_approved: <ThumbsUp className="h-4 w-4" />,
  request_rejected: <ThumbsDown className="h-4 w-4" />,
  note_added: <StickyNote className="h-4 w-4" />,
};

export const Route = createFileRoute("/_authenticated/company/activity")({
  head: () => ({
    meta: [
      { title: "Activity log – IBYS Company" },
      { name: "description", content: "Every event across your projects, newest first." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data, loading } = useCompanyActivity();
  const { data: projects } = useCompanyProjects();
  const projectName = (id?: string) => (id ? projects?.find((p) => p.id === id)?.name : undefined);
  // Defensive re-sort by the real timestamp (the backend already orders by
  // created_at desc; this just guards against any client-side reordering).
  const list = (data ?? []).slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader title={t("company.activity.title")} description={t("company.activity.description")} />
      {loading ? <InlineLoader /> : list.length === 0 ? <EmptyState title={t("company.activity.empty")} /> : (
        <ol className="relative space-y-4 border-s border-border ps-6">
          {list.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -start-[calc(1.5rem+1px)] top-1 grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary/10 text-primary">{ICONS[a.type]}</span>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm text-foreground"><strong className="font-semibold">{a.actor}</strong> {a.message}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t(`company.activity.types.${a.type}`)}</span>
                  {projectName(a.projectId) && <><span>·</span><span>{projectName(a.projectId)}</span></>}
                  <span>·</span>
                  <span>{formatDate(a.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </RoleGuard>
  );
}
