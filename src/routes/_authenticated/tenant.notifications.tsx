import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, Building2, CalendarClock, FileText, HardHat, Cog, Search } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantNotifications } from "@/hooks/useTenantData";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { Notification } from "@/mocks/mockTenantService";

export const Route = createFileRoute("/_authenticated/tenant/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications – IBYS" },
      { name: "description", content: "Everything that has happened on your project." },
    ],
  }),
  component: Page,
});

const CATS: Array<Notification["category"] | "all"> = ["all", "project", "construction", "meeting", "documents", "system"];
const ICONS: Record<Notification["category"], React.ReactNode> = {
  project: <Building2 className="h-4 w-4" />,
  construction: <HardHat className="h-4 w-4" />,
  meeting: <CalendarClock className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
  system: <Cog className="h-4 w-4" />,
};

function Page() {
  const { t, formatDate } = useI18n();
  const { data } = useTenantNotifications();
  const [cat, setCat] = React.useState<Notification["category"] | "all">("all");
  const [query, setQuery] = React.useState("");
  const [list, setList] = React.useState<Notification[] | null>(null);

  React.useEffect(() => { if (data) setList(data); }, [data]);

  const filtered = (list ?? []).filter(
    (n) => (cat === "all" || n.category === cat) && (query === "" || n.title.toLowerCase().includes(query.toLowerCase())),
  );
  const unread = (list ?? []).filter((n) => !n.read).length;

  return (
    <RoleGuard allow="TENANT">
      <PageHeader
        title={t("pages.notifications.title")}
        description={t("pages.notifications.description")}
        actions={
          <>
            {unread > 0 && <Badge variant="secondary">{t("tenant.notifications.unread", { n: unread })}</Badge>}
            <Button size="sm" variant="outline" onClick={() => setList((l) => (l ? l.map((n) => ({ ...n, read: true })) : l))}>
              <CheckCheck className="h-4 w-4" />{t("tenant.notifications.markAllRead")}
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("common.search")} className="ps-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {t(`tenant.notifications.${c}`)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!list ? (
        <InlineLoader />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("tenant.notifications.empty")} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul>
              {filtered.map((n) => (
                <li key={n.id} className={`flex items-start gap-3 border-b border-border/60 p-4 last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{ICONS[n.category]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{n.title}</span>
                          {!n.read && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{n.body}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(n.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <Badge variant="outline" className="mt-2 text-[10px]">{t(`tenant.notifications.${n.category}`)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {!list && <Bell className="hidden" aria-hidden />}
    </RoleGuard>
  );
}
