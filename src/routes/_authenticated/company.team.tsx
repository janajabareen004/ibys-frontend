import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyEmployees, useCompanyProjects } from "@/hooks/useCompanyData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/manager/SectionCard";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Search, Mail, Phone } from "lucide-react";
import type { CompanyEmployee } from "@/mocks/mockCompanyService";

export const Route = createFileRoute("/_authenticated/company/team")({
  head: () => ({
    meta: [
      { title: "Team – IBYS Company" },
      { name: "description", content: "Employees, availability, workload, and assigned projects." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data, loading } = useCompanyEmployees();
  const { data: projects } = useCompanyProjects();
  const [q, setQ] = React.useState("");
  const list = (data ?? []).filter((e) => (q ? [e.name, e.role, e.email].join(" ").toLowerCase().includes(q.toLowerCase()) : true));
  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? id;
  const availStyle: Record<CompanyEmployee["availability"], string> = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    on_site: "border-primary/30 bg-primary/10 text-primary",
    off: "border-border bg-muted text-muted-foreground",
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader title={t("company.team.title")} description={t("company.team.description")} />
      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.team.search")} className="ps-9" />
      </div>
      {loading ? <InlineLoader /> : list.length === 0 ? <EmptyState title={t("company.team.empty")} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => (
            <SectionCard
              key={e.id}
              title={e.name}
              description={e.role}
              action={<Badge variant="outline" className={`rounded-full text-[10px] ${availStyle[e.availability]}`}>{t(`company.team.states.${e.availability}`)}</Badge>}
            >
              <div className="space-y-3 text-sm">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("company.team.workload")}</span>
                    <span className="font-semibold text-foreground">{e.workload}%</span>
                  </div>
                  <Progress value={e.workload} className="h-1.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("company.team.projects")}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {e.projectIds.map((id) => <Badge key={id} variant="secondary" className="text-[10px]">{projectName(id)}</Badge>)}
                  </div>
                </div>
                {e.currentStage && (
                  <p className="text-xs text-muted-foreground">{t("company.team.stage")}: <span className="font-semibold text-foreground">{t(`tenant.timeline.stages.${e.currentStage}`)}</span></p>
                )}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{e.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{e.phone}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">{t("company.team.lastActive")}: {formatDate(e.lastActive, { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </RoleGuard>
  );
}
