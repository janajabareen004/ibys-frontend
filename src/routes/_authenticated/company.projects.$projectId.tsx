import * as React from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { translateCompanyProject } from "@/lib/i18n/projectI18n";
import {
  useCompanyProject,
  useCompanyProjectStages,
  useCompanyPhotos,
  useCompanyDocuments,
  useCompanyMeetings,
  useCompanyEmployees,
  useCompanyActivity,
  useCompanyProjectManagers,
  useCompanyProjectApartments,
  useCompanyTenants,
} from "@/hooks/useCompanyData";
import { companyMutations } from "@/api/companyApi";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { CompanyProjectStatusBadge } from "@/components/company/CompanyProjectStatusBadge";
import { CompanyStageStatusBadge } from "@/components/company/CompanyStageStatusBadge";
import { SectionCard } from "@/components/manager/SectionCard";
import { ProgressRing } from "@/components/tenant/ProgressRing";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoCard } from "@/components/company/PhotoCard";
import { ProjectDialog } from "@/components/company/dialogs/ProjectDialog";
import { ApartmentDialog } from "@/components/company/dialogs/ApartmentDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Calendar, FileText, User, Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/company/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project – IBYS Company" },
      { name: "description", content: "Complete project overview for the building company." },
    ],
  }),
  component: Page,
});

function Page() {
  const { projectId } = useParams({ from: "/_authenticated/company/projects/$projectId" });
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const project = useCompanyProject(projectId);
  const stages = useCompanyProjectStages(projectId);
  const photos = useCompanyPhotos();
  const documents = useCompanyDocuments();
  const meetings = useCompanyMeetings();
  const employees = useCompanyEmployees();
  const activity = useCompanyActivity();
  const managers = useCompanyProjectManagers();
  const apartments = useCompanyProjectApartments(projectId);
  const tenants = useCompanyTenants();

  const [editOpen, setEditOpen] = React.useState(false);
  const [aptDialogOpen, setAptDialogOpen] = React.useState(false);

  if (project.loading) return <InlineLoader />;
  if (!project.data) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {t("company.projects.empty")}
      </div>
    );
  }

  const p = translateCompanyProject(t, project.data);
  const projectPhotos = (photos.data ?? []).filter((ph) => ph.projectId === projectId).slice(0, 6);
  const projectDocs = (documents.data ?? []).filter((d) => d.projectId === projectId).slice(0, 5);
  const projectMeetings = (meetings.data ?? []).filter((m) => m.projectId === projectId && (m.status === "upcoming" || m.status === "today")).slice(0, 4);
  const team = (employees.data ?? []).filter((e) => p.team.includes(e.id));
  const projectActivity = (activity.data ?? []).filter((a) => a.projectId === projectId).slice(0, 5);
  const tenantMap = new Map((tenants.data ?? []).map((tn) => [tn.id, tn]));

  const deleteProject = () => {
    if (!window.confirm(t("company.pm.confirmDeleteProject"))) return;
    companyMutations.deleteProject(projectId);
    toast.success(t("company.pm.toasts.projectDeleted"));
    navigate({ to: "/company/projects" });
  };

  const assignManager = (managerId: string) => {
    companyMutations.assignProjectManager(projectId, managerId);
    toast.success(t("company.pm.toasts.pmAssigned"));
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={p.name}
        description={p.clientName}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/company/projects"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("company.actions.back")}</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" />{t("company.pm.common.edit")}</Button>
            <Button variant="destructive" size="sm" onClick={deleteProject}><Trash2 className="h-4 w-4" />{t("company.pm.common.delete")}</Button>
          </div>
        }
      />


      <div className="mb-6 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-6">
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <ProgressRing value={p.progress} label={t("company.projectDetails.header")} />
          <div className="space-y-2">
            <CompanyProjectStatusBadge status={p.status} />
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden />{p.address}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><User className="h-4 w-4" aria-hidden />{t("company.projectDetails.manager")}: {p.projectManager}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Calendar className="h-4 w-4" aria-hidden />{t("company.projectDetails.lastUpdated")}: {formatDate(p.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("company.projectDetails.currentStage")}</p>
              <p className="font-semibold text-foreground">{t(`tenant.timeline.stages.${p.currentStage}`)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("company.projects.expectedCompletion")}</p>
              <p className="font-semibold text-foreground">{formatDate(p.expectedCompletion)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title={t("company.projectDetails.description")}>
            <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
          </SectionCard>

          <SectionCard title={t("company.projectDetails.constructionProgress")}>
            <ul className="space-y-3">
              {(stages.data ?? []).map((s) => (
                <li key={s.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link to="/company/stages/$stageId" params={{ stageId: s.id }} className="text-sm font-semibold text-foreground hover:text-primary">
                      {t(`tenant.timeline.stages.${s.key}`)}
                    </Link>
                    <CompanyStageStatusBadge status={s.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={s.progress} className="h-1.5 flex-1" />
                    <span className="w-10 text-end text-xs font-semibold text-muted-foreground">{s.progress}%</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{s.responsibleTeam} · {t("company.stages.estimated")} {formatDate(s.estimatedCompletion)}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.projectDetails.recentPhotos")}>
            {projectPhotos.length ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {projectPhotos.map((ph) => <PhotoCard key={ph.id} photo={ph} />)}
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </SectionCard>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard title={t("company.projectDetails.recentDocuments")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/documents">{t("company.actions.viewAll")}</Link></Button>}>
              <ul className="space-y-2 text-sm">
                {projectDocs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="truncate">{d.name}</span>
                    <Badge variant="secondary" className="ms-auto text-[10px]">{d.version}</Badge>
                  </li>
                ))}
                {projectDocs.length === 0 && <li className="text-muted-foreground">—</li>}
              </ul>
            </SectionCard>
            <SectionCard title={t("company.projectDetails.recentUpdates")}>
              <ul className="space-y-2 text-sm">
                {projectActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <div className="min-w-0"><p className="truncate"><strong>{a.actor}</strong> {a.message}</p><p className="text-xs text-muted-foreground">{formatDate(a.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p></div>
                  </li>
                ))}
                {projectActivity.length === 0 && <li className="text-muted-foreground">—</li>}
              </ul>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title={t("company.projectDetails.assignedTeam")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/team">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {team.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-xs font-bold text-primary-foreground">{e.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{e.name}</p><p className="truncate text-xs text-muted-foreground">{e.role}</p></div>
                  <Badge variant="secondary" className="text-[10px]">{e.workload}%</Badge>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.projectDetails.upcomingMeetings")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/meetings">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-3">
              {projectMeetings.map((m) => (
                <li key={m.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(m.when, { dateStyle: "medium", timeStyle: "short" })} · {m.location}</p>
                </li>
              ))}
              {projectMeetings.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.projectDetails.timelinePreview")}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" aria-hidden />
              {formatDate(p.expectedCompletion, { dateStyle: "full" })}
            </div>
          </SectionCard>

          <SectionCard title={t("company.pm.projectDetails.managerAssignment")}>
            <Select value={(managers.data ?? []).find((m) => m.name === p.projectManager)?.id ?? ""} onValueChange={assignManager}>
              <SelectTrigger><SelectValue placeholder={p.projectManager} /></SelectTrigger>
              <SelectContent>
                {(managers.data ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </SectionCard>
        </div>
      </div>

      <div className="mt-6">
        <SectionCard
          title={t("company.pm.projectDetails.apartments")}
          action={<Button size="sm" onClick={() => setAptDialogOpen(true)}><Plus className="h-4 w-4" />{t("company.pm.apartments.new")}</Button>}
        >
          {(apartments.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-2 text-start">{t("company.pm.apartments.location")}</th>
                    <th className="p-2 text-start">{t("company.pm.apartmentForm.rooms")}</th>
                    <th className="p-2 text-start">{t("company.pm.apartmentForm.sizeSqm")}</th>
                    <th className="p-2 text-start">{t("company.pm.apartmentForm.status")}</th>
                    <th className="p-2 text-start">{t("company.pm.apartmentForm.tenant")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(apartments.data ?? []).map((a) => (
                    <tr key={a.id} className="border-b border-border/60">
                      <td className="p-2 font-medium">{t("company.pm.apartments.locationFormat", { building: a.building, entrance: a.entrance, floor: a.floor, number: a.number })}</td>
                      <td className="p-2">{a.rooms}</td>
                      <td className="p-2">{a.sizeSqm} m²</td>
                      <td className="p-2"><Badge variant="secondary">{t(`company.pm.apartmentStatus.${a.status}`)}</Badge></td>
                      <td className="p-2 text-muted-foreground">{a.tenantId ? tenantMap.get(a.tenantId)?.name ?? "—" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project.data}
        managers={managers.data ?? []}
        onSaved={project.refetch}
      />
      <ApartmentDialog
        open={aptDialogOpen}
        onOpenChange={setAptDialogOpen}
        apartment={null}
        projects={project.data ? [project.data] : []}
        tenants={tenants.data ?? []}
        defaultProjectId={projectId}
      />
    </RoleGuard>
  );
}

