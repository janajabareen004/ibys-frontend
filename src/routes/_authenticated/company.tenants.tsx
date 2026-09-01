import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyTenants, useCompanyApartments, useCompanyProjects } from "@/hooks/useCompanyData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TenantDialog } from "@/components/company/dialogs/TenantDialog";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/company/tenants")({
  head: () => ({
    meta: [
      { title: "Tenants – IBYS Company" },
      { name: "description", content: "Manage tenants and their apartment assignments." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const tenants = useCompanyTenants();
  const apartments = useCompanyApartments();
  const projects = useCompanyProjects();
  const [q, setQ] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const list = React.useMemo(() => (tenants.data ?? []).filter((tn) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [tn.name, tn.email, tn.phone, tn.nationalId ?? ""].some((v) => v.toLowerCase().includes(s));
  }), [tenants.data, q]);

  const apartmentsByTenant = React.useMemo(() => {
    const map = new Map<string, number>();
    (apartments.data ?? []).forEach((a) => { if (a.tenantId) map.set(a.tenantId, (map.get(a.tenantId) ?? 0) + 1); });
    return map;
  }, [apartments.data]);

  // Real relationship only: tenant_id -> apartments.tenant_id -> project_id
  // -> project name. Tenants have no project_id column (never added here);
  // a tenant with apartments in multiple projects shows every project name.
  const projectsByTenant = React.useMemo(() => {
    // Keyed by String(project.id) so a real project_id can never fail to
    // resolve here due to a type mismatch (see company.apartments.tsx for
    // the same pattern on the Apartments page's Project column).
    const projectNameById = new Map((projects.data ?? []).map((p) => [String(p.id), p.name]));
    const map = new Map<string, string[]>();
    (apartments.data ?? []).forEach((a) => {
      if (!a.tenantId) return;
      const name = projectNameById.get(String(a.projectId));
      if (!name) return;
      const existing = map.get(a.tenantId) ?? [];
      if (!existing.includes(name)) map.set(a.tenantId, [...existing, name]);
    });
    return map;
  }, [apartments.data, projects.data]);

  const openCreate = () => { setDialogOpen(true); };
  const handleSaved = () => { tenants.refetch(); apartments.refetch(); };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.pm.tenants.title")}
        description={t("company.pm.tenants.description")}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />{t("company.pm.tenants.new")}</Button>}
      />
      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.pm.tenants.search")} className="ps-9" />
      </div>

      {tenants.loading ? <InlineLoader /> : list.length === 0 ? (
        <EmptyState title={t("company.pm.tenants.empty")} action={<Button onClick={openCreate}>{t("company.pm.tenants.new")}</Button>} />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("company.pm.tenantForm.name")}</TableHead>
                <TableHead>{t("company.pm.tenantForm.email")}</TableHead>
                <TableHead>{t("company.pm.tenantForm.phone")}</TableHead>
                <TableHead>{t("company.pm.tenants.project")}</TableHead>
                <TableHead>{t("company.pm.tenants.apartments")}</TableHead>
                <TableHead>{t("company.pm.tenants.createdAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((tn) => {
                const tenantProjects = projectsByTenant.get(tn.id) ?? [];
                return (
                  <TableRow key={tn.id}>
                    <TableCell className="font-medium">{tn.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{tn.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{tn.phone || "—"}</TableCell>
                    <TableCell>
                      {tenantProjects.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {tenantProjects.map((name) => (
                            <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{apartmentsByTenant.get(tn.id) ?? 0}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{tn.createdAt ? formatDate(tn.createdAt) : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TenantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={projects.data ?? []}
        apartments={apartments.data ?? []}
        apartmentsLoading={apartments.loading}
        onSaved={handleSaved}
      />
    </RoleGuard>
  );
}
