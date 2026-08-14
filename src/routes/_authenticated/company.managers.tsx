import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyProjectManagers } from "@/hooks/useCompanyData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ProjectManagerDialog } from "@/components/company/dialogs/ProjectManagerDialog";
import { Plus, Pencil, Mail, Phone } from "lucide-react";
import type { ProjectManagerPerson } from "@/api/companyApi";

export const Route = createFileRoute("/_authenticated/company/managers")({
  head: () => ({
    meta: [
      { title: "Project Managers – IBYS Company" },
      { name: "description", content: "Add and manage project managers assigned to your projects." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const managers = useCompanyProjectManagers();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editPm, setEditPm] = React.useState<ProjectManagerPerson | null>(null);

  const openCreate = () => { setEditPm(null); setDialogOpen(true); };
  const openEdit = (pm: ProjectManagerPerson) => { setEditPm(pm); setDialogOpen(true); };

  const list = managers.data ?? [];

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.pm.managers.title")}
        description={t("company.pm.managers.description")}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />{t("company.pm.managers.new")}</Button>}
      />

      {managers.loading ? <InlineLoader /> : list.length === 0 ? (
        <EmptyState title={t("company.pm.managers.empty")} action={<Button onClick={openCreate}>{t("company.pm.managers.new")}</Button>} />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("company.pm.pmForm.name")}</TableHead>
                <TableHead>{t("company.pm.pmForm.email")}</TableHead>
                <TableHead>{t("company.pm.pmForm.phone")}</TableHead>
                <TableHead>{t("company.pm.managers.activeProjects")}</TableHead>
                <TableHead className="text-end">{t("company.pm.common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((pm) => (
                <TableRow key={pm.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-xs font-bold text-primary-foreground">{(pm.name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("") || "?"}</span>
                    {pm.name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pm.email ? <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{pm.email}</span> : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pm.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{pm.phone}</span> : "—"}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{pm.activeProjects}</Badge></TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(pm)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectManagerDialog open={dialogOpen} onOpenChange={setDialogOpen} manager={editPm} />
    </RoleGuard>
  );
}
