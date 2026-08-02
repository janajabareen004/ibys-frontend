import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  useCompanyProjects,
  useCompanyStages,
  useCompanyPhotos,
  useCompanyDocuments,
  useCompanyMeetings,
  useCompanyRequests,
  useCompanyEmployees,
} from "@/hooks/useCompanyData";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SectionCard } from "@/components/manager/SectionCard";
import { EmptyState } from "@/components/feedback/EmptyState";

export const Route = createFileRoute("/_authenticated/company/search")({
  head: () => ({
    meta: [
      { title: "Global search – IBYS Company" },
      { name: "description", content: "Search across projects, stages, photos, documents, meetings, and team." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const projects = useCompanyProjects();
  const stages = useCompanyStages();
  const photos = useCompanyPhotos();
  const docs = useCompanyDocuments();
  const meetings = useCompanyMeetings();
  const requests = useCompanyRequests();
  const team = useCompanyEmployees();
  const [q, setQ] = React.useState("");

  const query = q.trim().toLowerCase();
  const match = (s: string) => s.toLowerCase().includes(query);

  const results = React.useMemo(() => {
    if (!query) return null;
    return {
      projects: (projects.data ?? []).filter((p) => match(p.name) || match(p.address) || match(p.clientName)),
      stages: (stages.data ?? []).filter((s) => match(s.responsibleTeam) || match(s.notes)),
      photos: (photos.data ?? []).filter((p) => match(p.title) || match(p.uploadedBy)),
      documents: (docs.data ?? []).filter((d) => match(d.name) || match(d.uploadedBy)),
      meetings: (meetings.data ?? []).filter((m) => match(m.title) || match(m.agenda)),
      requests: (requests.data ?? []).filter((r) => match(r.description) || match(r.tenantName)),
      team: (team.data ?? []).filter((e) => match(e.name) || match(e.role)),
    };
  }, [query, projects.data, stages.data, photos.data, docs.data, meetings.data, requests.data, team.data]);

  const total = results ? Object.values(results).reduce((n, arr) => n + arr.length, 0) : 0;

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader title={t("company.search.title")} description={t("company.search.description")} />
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.search.placeholder")} className="ps-9" autoFocus />
      </div>

      {!results ? (
        <EmptyState title={t("company.search.empty")} />
      ) : total === 0 ? (
        <EmptyState title={t("company.search.noResults", { q })} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.projects.length > 0 && (
            <SectionCard title={t("company.search.groups.projects")}>
              <ul className="space-y-1 text-sm">
                {results.projects.map((p) => <li key={p.id}><Link to="/company/projects/$projectId" params={{ projectId: p.id }} className="text-foreground hover:text-primary">{p.name} <span className="text-muted-foreground">· {p.address}</span></Link></li>)}
              </ul>
            </SectionCard>
          )}
          {results.stages.length > 0 && (
            <SectionCard title={t("company.search.groups.stages")}>
              <ul className="space-y-1 text-sm">
                {results.stages.map((s) => <li key={s.id}><Link to="/company/stages/$stageId" params={{ stageId: s.id }} className="text-foreground hover:text-primary">{t(`tenant.timeline.stages.${s.key}`)} <span className="text-muted-foreground">· {s.responsibleTeam}</span></Link></li>)}
              </ul>
            </SectionCard>
          )}
          {results.photos.length > 0 && (
            <SectionCard title={t("company.search.groups.photos")}>
              <ul className="space-y-1 text-sm">{results.photos.map((p) => <li key={p.id} className="text-foreground">{p.title} <span className="text-muted-foreground">· {p.uploadedBy}</span></li>)}</ul>
            </SectionCard>
          )}
          {results.documents.length > 0 && (
            <SectionCard title={t("company.search.groups.documents")}>
              <ul className="space-y-1 text-sm">{results.documents.map((d) => <li key={d.id} className="text-foreground">{d.name}</li>)}</ul>
            </SectionCard>
          )}
          {results.meetings.length > 0 && (
            <SectionCard title={t("company.search.groups.meetings")}>
              <ul className="space-y-1 text-sm">{results.meetings.map((m) => <li key={m.id} className="text-foreground">{m.title}</li>)}</ul>
            </SectionCard>
          )}
          {results.requests.length > 0 && (
            <SectionCard title={t("company.search.groups.requests")}>
              <ul className="space-y-1 text-sm">{results.requests.map((r) => <li key={r.id} className="text-foreground">{r.description} <span className="text-muted-foreground">· {r.tenantName}</span></li>)}</ul>
            </SectionCard>
          )}
          {results.team.length > 0 && (
            <SectionCard title={t("company.search.groups.team")}>
              <ul className="space-y-1 text-sm">{results.team.map((e) => <li key={e.id} className="text-foreground">{e.name} <span className="text-muted-foreground">· {e.role}</span></li>)}</ul>
            </SectionCard>
          )}
        </div>
      )}
    </RoleGuard>
  );
}
