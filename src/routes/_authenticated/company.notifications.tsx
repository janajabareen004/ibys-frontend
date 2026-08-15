import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyNotifications } from "@/hooks/useCompanyData";
import { companyMutations } from "@/api/companyApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import { Search, CheckCheck, Building2, Hammer, UploadCloud, CalendarClock, Inbox, Cog } from "lucide-react";
import type { CompanyNotification, CompanyNotificationCategory } from "@/mocks/mockCompanyService";

const ICONS: Record<CompanyNotificationCategory, React.ReactNode> = {
  project: <Building2 className="h-4 w-4" />,
  construction: <Hammer className="h-4 w-4" />,
  upload: <UploadCloud className="h-4 w-4" />,
  meeting: <CalendarClock className="h-4 w-4" />,
  request: <Inbox className="h-4 w-4" />,
  system: <Cog className="h-4 w-4" />,
};

export const Route = createFileRoute("/_authenticated/company/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications – IBYS Company" },
      { name: "description", content: "Every important event across your projects." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data, loading, refetch } = useCompanyNotifications();
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<CompanyNotificationCategory | "all">("all");
  const list = (data ?? []).filter((n) => {
    const okQ = q ? [n.title, n.body].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
    const okC = cat === "all" ? true : n.category === cat;
    return okQ && okC;
  });
  const unread = (data ?? []).filter((n) => !n.read).length;

  const markAll = async () => {
    try {
      await companyMutations.markAllNotificationsRead();
      refetch();
      notifySuccess(t("company.notifications.markAllRead") as string);
    } catch {
      notifyError(t("common.error") as string);
    }
  };

  const toggleRead = async (n: CompanyNotification) => {
    try {
      await companyMutations.markNotificationRead(n.id, !n.read);
      refetch();
    } catch {
      notifyError(t("common.error") as string);
    }
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.notifications.title")}
        description={t("company.notifications.description")}
        actions={<Button size="sm" variant="outline" onClick={markAll}><CheckCheck className="h-4 w-4" />{t("company.notifications.markAllRead")}</Button>}
      />
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.notifications.search")} className="ps-9" />
        </div>
        <Badge variant="secondary">{t("company.notifications.unread", { n: unread })}</Badge>
      </div>
      <Tabs value={cat} onValueChange={(v) => setCat(v as CompanyNotificationCategory | "all")}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">{t("company.notifications.all")}</TabsTrigger>
          {(["project", "construction", "upload", "meeting", "request", "system"] as const).map((k) => (
            <TabsTrigger key={k} value={k}>{t(`company.notifications.categories.${k}`)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mt-4">
        {loading ? <InlineLoader /> : list.length === 0 ? <EmptyState title={t("company.notifications.empty")} /> : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {list.map((n) => (
              <li
                key={n.id}
                className="flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-muted/30"
                onClick={() => toggleRead(n)}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{ICONS[n.category]}</span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${n.read ? "text-foreground" : "font-semibold text-foreground"}`}>{n.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(n.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-hidden />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </RoleGuard>
  );
}
