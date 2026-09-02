import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyEmployees, useCompanyProjects } from "@/hooks/useCompanyData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionCard } from "@/components/manager/SectionCard";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { CompanyTeamMemberDialog } from "@/components/company/dialogs/CompanyTeamMemberDialog";
import { notifyError, notifySuccess } from "@/components/feedback/SuccessNotification";
import { companyMutations } from "@/api/companyApi";
import { Search, Mail, Phone, Plus } from "lucide-react";
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
  const { data, loading, refetch } = useCompanyEmployees();
  const { data: projects } = useCompanyProjects();
  const [q, setQ] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const list = (data ?? []).filter((e) => (q ? [e.name, e.role, e.email].join(" ").toLowerCase().includes(q.toLowerCase()) : true));
  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? id;
  const availStyle: Record<CompanyEmployee["availability"], string> = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    on_site: "border-primary/30 bg-primary/10 text-primary",
    off: "border-border bg-muted text-muted-foreground",
  };

  // The Edit Status control only offers Available/Busy; "Busy" maps to this
  // page's existing "on_site" availability value (which the real backend
  // stores as "busy" — see toCompanyBackendAvailability in companyApi.ts).
  const handleAvailabilityChange = async (id: string, availability: CompanyEmployee["availability"]) => {
    if (updatingId) return;
    setUpdatingId(id);
    try {
      await companyMutations.updateEmployeeAvailability(id, availability);
      notifySuccess(t("company.team.statusUpdated") as string);
      await refetch();
    } catch {
      notifyError(t("company.team.statusUpdateFailed") as string);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.team.title")}
        description={t("company.team.description")}
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={(projects ?? []).length === 0}>
            <Plus className="h-4 w-4" />
            {t("company.team.addMember")}
          </Button>
        }
      />
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
              action={
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={`rounded-full text-[10px] ${availStyle[e.availability]}`}>{t(`company.team.states.${e.availability}`)}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={updatingId === e.id}
                        className="text-[10px] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t("company.team.editStatus")}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleAvailabilityChange(e.id, "available")}>
                        {t("company.team.statusAvailable")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleAvailabilityChange(e.id, "on_site")}>
                        {t("company.team.statusBusy")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              }
            >
              <div className="space-y-3 text-sm">
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
      <CompanyTeamMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projects={projects ?? []}
        onSaved={refetch}
      />
    </RoleGuard>
  );
}
