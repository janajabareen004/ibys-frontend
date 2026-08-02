import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerEmployees, useManagerProjects } from "@/hooks/useManagerData";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { Search, Mail, Phone, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manager/team")({
  head: () => ({
    meta: [
      { title: "Team – IBYS Manager" },
      { name: "description", content: "Employees, workload and availability across every project." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data: employees, loading } = useManagerEmployees();
  const { data: projects } = useManagerProjects();
  const [q, setQ] = React.useState("");

  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? id;
  const filtered = (employees ?? []).filter((e) => q ? [e.name, e.role, e.email].join(" ").toLowerCase().includes(q.toLowerCase()) : true);

  const availabilityStyle = { available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300", busy: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300", off: "border-border bg-muted text-muted-foreground" } as const;

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader title={t("manager.team.title")} description={t("manager.team.description")} />

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("manager.team.search")} className="ps-9" />
      </div>

      {loading ? <InlineLoader /> : filtered.length === 0 ? <EmptyState title={t("manager.team.empty")} /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-sm font-bold text-primary-foreground">{e.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.role}</p>
                  </div>
                  <Badge variant="outline" className={`rounded-full text-[10px] ${availabilityStyle[e.availability]}`}>{t(`manager.team.availabilityStates.${e.availability}`)}</Badge>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">{t("manager.team.workload")}</span><span className="font-semibold text-foreground">{e.workload}%</span></div>
                  <Progress value={e.workload} className="h-1.5" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {e.projectIds.map((id) => <Badge key={id} variant="secondary" className="rounded-full text-[10px]">{projectName(id)}</Badge>)}
                </div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" aria-hidden />{e.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" aria-hidden />{e.phone}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" aria-hidden />{t("manager.team.lastActive")}: {formatDate(e.lastActive, { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </RoleGuard>
  );
}
