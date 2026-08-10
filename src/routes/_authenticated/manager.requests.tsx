import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerRequests, useManagerProjects, useManagerEmployees } from "@/hooks/useManagerData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RequestCard } from "@/components/manager/RequestCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { Search } from "lucide-react";
import type { TenantRequestCategory } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/requests")({
  head: () => ({
    meta: [
      { title: "Tenant requests – IBYS Manager" },
      { name: "description", content: "All incoming tenant requests across your projects." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const { data: requests, loading, refetch } = useManagerRequests();
  const { data: projects } = useManagerProjects();
  const { data: employees } = useManagerEmployees();
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<TenantRequestCategory | "all">("all");

  const filter = (status: string) => (requests ?? []).filter((r) => {
    const matchQ = q ? [r.description, r.tenantName].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
    const matchC = category === "all" ? true : r.category === category;
    const matchS = status === "all" ? true : r.status === status;
    return matchQ && matchC && matchS;
  });

  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name;
  const employeeName = (id?: string) => (id ? employees?.find((e) => e.id === id)?.name : undefined);

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader title={t("manager.requests.title")} description={t("manager.requests.description")} />

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("manager.requests.search")} className="ps-9" />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as TenantRequestCategory | "all")}>
          <SelectTrigger className="w-56"><SelectValue placeholder={t("manager.requests.allCategories")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("manager.requests.allCategories")}</SelectItem>
            {(["photo", "meeting", "question", "document"] as const).map((c) => (
              <SelectItem key={c} value={c}>{t(`manager.requestCategory.${c}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {(["all", "pending", "approved", "rejected", "archived"] as const).map((s) => (
            <TabsTrigger key={s} value={s}>{s === "all" ? t("manager.notifications.all") : t(`manager.requestStatus.${s}`)}</TabsTrigger>
          ))}
        </TabsList>
        {(["all", "pending", "approved", "rejected", "archived"] as const).map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            {loading ? <InlineLoader /> : (
              filter(s).length === 0 ? <EmptyState title={t("manager.requests.empty")} /> : (
                <div className="grid gap-3">
                  {filter(s).map((r) => (
                    <RequestCard key={r.id} request={r} projectName={projectName(r.projectId)} assigneeName={employeeName(r.assignedTo)} onUpdated={refetch} />
                  ))}
                </div>
              )
            )}
          </TabsContent>
        ))}
      </Tabs>
    </RoleGuard>
  );
}
