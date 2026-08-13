import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerNotifications, managerActions } from "@/hooks/useManagerData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { toast } from "sonner";
import { Search, CheckCheck, Bell } from "lucide-react";
import type { ManagedNotification } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications – IBYS Manager" },
      { name: "description", content: "Every important event across your portfolio." },
    ],
  }),
  component: Page,
});

const CATEGORIES: Array<ManagedNotification["category"] | "all"> = ["all", "project", "task", "meeting", "construction", "system", "request"];

function Page() {
  const { t, formatDate } = useI18n();
  const { data, loading, refetch } = useManagerNotifications();
  const [q, setQ] = React.useState("");
  const unread = (data ?? []).filter((n) => !n.read).length;

  const filter = (cat: (typeof CATEGORIES)[number]) => (data ?? []).filter((n) => {
    const matchQ = q ? [n.title, n.body].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
    const matchC = cat === "all" ? true : n.category === cat;
    return matchQ && matchC;
  });

  const markAll = async () => {
    try {
      await managerActions.markAllNotificationsRead();
      refetch();
      toast.success(t("manager.pm.toasts.allRead"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const toggleRead = async (n: ManagedNotification) => {
    try {
      await managerActions.markNotificationRead(n.id, !n.read);
      refetch();
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.notifications.title")}
        description={t("manager.notifications.description")}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t("manager.notifications.unread", { n: unread })}</Badge>
            <Button size="sm" variant="outline" onClick={markAll}><CheckCheck className="h-4 w-4" />{t("manager.notifications.markAllRead")}</Button>
          </div>
        }
      />

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("manager.notifications.search")} className="ps-9" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          {CATEGORIES.map((c) => <TabsTrigger key={c} value={c}>{c === "all" ? t("manager.notifications.all") : t(`manager.notifications.categories.${c}`)}</TabsTrigger>)}
        </TabsList>
        {CATEGORIES.map((c) => (
          <TabsContent key={c} value={c} className="mt-4">
            {loading ? <InlineLoader /> : filter(c).length === 0 ? <EmptyState title={t("manager.notifications.empty")} /> : (
              <ul className="space-y-2">
                {filter(c).map((n) => (
                  <li key={n.id}>
                    <Card
                      className={`cursor-pointer transition-colors hover:bg-muted/30 ${n.read ? "" : "border-primary/30"}`}
                      onClick={() => toggleRead(n)}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                          <Bell className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                            <span className="text-xs text-muted-foreground">{formatDate(n.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                        </div>
                        {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </RoleGuard>
  );
}
