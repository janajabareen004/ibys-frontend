import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyTenants, useCompanyApartments } from "@/hooks/useCompanyData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TenantDialog } from "@/components/company/dialogs/TenantDialog";
import { Plus, Search, Pencil } from "lucide-react";
import type { CompanyTenant } from "@/api/companyApi";

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
  const [q, setQ] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editTenant, setEditTenant] = React.useState<CompanyTenant | null>(null);

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

  const openCreate = () => { setEditTenant(null); setDialogOpen(true); };
  const openEdit = (tn: CompanyTenant) => { setEditTenant(tn); setDialogOpen(true); };

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
                <TableHead>{t("company.pm.tenants.apartments")}</TableHead>
                <TableHead>{t("company.pm.tenants.createdAt")}</TableHead>
                <TableHead className="text-end">{t("company.pm.common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((tn) => (
                <TableRow key={tn.id}>
                  <TableCell className="font-medium">{tn.name}</TableCell>
                  <TableCell className="text-muted-foreground">{tn.email}</TableCell>
                  <TableCell className="text-muted-foreground">{tn.phone}</TableCell>
                  <TableCell><Badge variant="secondary">{apartmentsByTenant.get(tn.id) ?? 0}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(tn.createdAt)}</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(tn)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TenantDialog open={dialogOpen} onOpenChange={setDialogOpen} tenant={editTenant} />
    </RoleGuard>
  );
}
