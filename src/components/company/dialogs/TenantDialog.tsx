import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations } from "@/api/companyApi";
import type { CompanyTenant } from "@/api/companyApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: CompanyTenant | null;
};

export function TenantDialog({ open, onOpenChange, tenant }: Props) {
  const { t } = useI18n();
  const isEdit = !!tenant;
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(tenant?.name ?? "");
    setEmail(tenant?.email ?? "");
    setPhone(tenant?.phone ?? "");
    setNationalId(tenant?.nationalId ?? "");
    setNotes(tenant?.notes ?? "");
  }, [open, tenant]);

  const submit = () => {
    if (!name.trim() || !email.trim()) { toast.error(t("common.error")); return; }
    const payload = { name: name.trim(), email: email.trim(), phone: phone.trim(), nationalId: nationalId.trim() || undefined, notes: notes.trim() || undefined };
    if (isEdit && tenant) {
      companyMutations.updateTenant(tenant.id, payload);
      toast.success(t("company.pm.toasts.tenantUpdated"));
    } else {
      companyMutations.createTenant(payload);
      toast.success(t("company.pm.toasts.tenantCreated"));
    }
    onOpenChange(false);
  };

  const remove = () => {
    if (!tenant) return;
    if (!window.confirm(t("company.pm.confirmDeleteTenant"))) return;
    companyMutations.deleteTenant(tenant.id);
    toast.success(t("company.pm.toasts.tenantDeleted"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? t("company.pm.tenantForm.editTitle") : t("company.pm.tenantForm.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>{t("company.pm.tenantForm.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>{t("company.pm.tenantForm.email")}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>{t("company.pm.tenantForm.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>{t("company.pm.tenantForm.nationalId")}</Label><Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>{t("company.pm.tenantForm.notes")}</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit ? <Button variant="destructive" onClick={remove}>{t("company.pm.common.delete")}</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("company.pm.common.cancel")}</Button>
            <Button onClick={submit}>{t("company.pm.common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
