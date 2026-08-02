import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyApartments, useCompanyProjects, useCompanyTenants } from "@/hooks/useCompanyData";
import { companyMutations } from "@/api/companyApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ApartmentDialog } from "@/components/company/dialogs/ApartmentDialog";
import { Plus, Pencil, Search } from "lucide-react";
import type { Apartment, ApartmentStatus } from "@/api/companyApi";

export const Route = createFileRoute("/_authenticated/company/apartments")({
  head: () => ({
    meta: [
      { title: "Apartments – IBYS Company" },
      { name: "description", content: "Manage buildings, entrances, floors, and apartment assignments." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const apartments = useCompanyApartments();
  const projects = useCompanyProjects();
  const tenants = useCompanyTenants();

  const [q, setQ] = React.useState("");
  const [projectFilter, setProjectFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<ApartmentStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editApt, setEditApt] = React.useState<Apartment | null>(null);

  const projectMap = React.useMemo(() => new Map((projects.data ?? []).map((p) => [p.id, p])), [projects.data]);
  const tenantMap = React.useMemo(() => new Map((tenants.data ?? []).map((tn) => [tn.id, tn])), [tenants.data]);

  const list = React.useMemo(() => (apartments.data ?? []).filter((a) => {
    if (projectFilter !== "all" && a.projectId !== projectFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      const label = `${a.building} ${a.entrance} ${a.floor} ${a.number}`.toLowerCase();
      const tenantName = a.tenantId ? tenantMap.get(a.tenantId)?.name.toLowerCase() ?? "" : "";
      if (!label.includes(s) && !tenantName.includes(s)) return false;
    }
    return true;
  }), [apartments.data, q, projectFilter, statusFilter, tenantMap]);

  const openCreate = () => { setEditApt(null); setDialogOpen(true); };
  const openEdit = (a: Apartment) => { setEditApt(a); setDialogOpen(true); };

  const assign = (apartmentId: string, tenantId: string) => {
    companyMutations.assignTenantToApartment(apartmentId, tenantId === "none" ? null : tenantId);
    toast.success(t("company.pm.toasts.apartmentAssigned"));
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.pm.apartments.title")}
        description={t("company.pm.apartments.description")}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />{t("company.pm.apartments.new")}</Button>}
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.pm.apartments.search")} className="ps-9" />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.pm.apartments.allProjects")}</SelectItem>
            {(projects.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApartmentStatus | "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.pm.apartments.allStatuses")}</SelectItem>
            {(["vacant", "assigned", "sold", "reserved"] as ApartmentStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{t(`company.pm.apartmentStatus.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {apartments.loading ? <InlineLoader /> : list.length === 0 ? (
        <EmptyState title={t("company.pm.apartments.empty")} action={<Button onClick={openCreate}>{t("company.pm.apartments.new")}</Button>} />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("company.pm.apartmentForm.project")}</TableHead>
                <TableHead>{t("company.pm.apartments.location")}</TableHead>
                <TableHead>{t("company.pm.apartmentForm.rooms")}</TableHead>
                <TableHead>{t("company.pm.apartmentForm.sizeSqm")}</TableHead>
                <TableHead>{t("company.pm.apartmentForm.status")}</TableHead>
                <TableHead>{t("company.pm.apartmentForm.tenant")}</TableHead>
                <TableHead className="text-end">{t("company.pm.common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-muted-foreground">{projectMap.get(a.projectId)?.name ?? "—"}</TableCell>
                  <TableCell className="font-medium">{t("company.pm.apartments.locationFormat", { building: a.building, entrance: a.entrance, floor: a.floor, number: a.number })}</TableCell>
                  <TableCell>{a.rooms}</TableCell>
                  <TableCell>{a.sizeSqm} m²</TableCell>
                  <TableCell><Badge variant={a.status === "assigned" || a.status === "sold" ? "default" : "secondary"}>{t(`company.pm.apartmentStatus.${a.status}`)}</Badge></TableCell>
                  <TableCell>
                    <Select value={a.tenantId ?? "none"} onValueChange={(v) => assign(a.id, v)}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("company.pm.apartmentForm.unassigned")}</SelectItem>
                        {(tenants.data ?? []).map((tn) => <SelectItem key={tn.id} value={tn.id}>{tn.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ApartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        apartment={editApt}
        projects={projects.data ?? []}
        tenants={tenants.data ?? []}
      />
    </RoleGuard>
  );
}
