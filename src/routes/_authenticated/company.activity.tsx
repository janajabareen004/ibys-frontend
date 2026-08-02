import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyActivity } from "@/hooks/useCompanyData";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Layers, Camera, FileText, CalendarCheck, CalendarX, CheckCircle2, Inbox } from "lucide-react";
import type { CompanyActivityType } from "@/mocks/mockCompanyService";

const ICONS: Record<CompanyActivityType, React.ReactNode> = {
  stage_updated: <Layers className="h-4 w-4" />,
  photo_uploaded: <Camera className="h-4 w-4" />,
  document_uploaded: <FileText className="h-4 w-4" />,
  meeting_approved: <CalendarCheck className="h-4 w-4" />,
  meeting_rejected: <CalendarX className="h-4 w-4" />,
  request_completed: <CheckCircle2 className="h-4 w-4" />,
  request_received: <Inbox className="h-4 w-4" />,
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
  const list = data ?? [];
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
                <p className="mt-1 text-xs text-muted-foreground">{t(`company.activity.types.${a.type}`)} · {formatDate(a.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </RoleGuard>
  );
}
