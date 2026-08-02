import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations } from "@/api/companyApi";
import type { ProjectManagerPerson } from "@/api/companyApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager?: ProjectManagerPerson | null;
};

export function ProjectManagerDialog({ open, onOpenChange, manager }: Props) {
  const { t } = useI18n();
  const isEdit = !!manager;
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(manager?.name ?? "");
    setEmail(manager?.email ?? "");
    setPhone(manager?.phone ?? "");
  }, [open, manager]);

  const submit = () => {
    if (!name.trim() || !email.trim()) { toast.error(t("common.error")); return; }
    const payload = { name: name.trim(), email: email.trim(), phone: phone.trim(), avatarSeed: name.trim().toLowerCase().replace(/\s+/g, "-") };
    if (isEdit && manager) {
      companyMutations.updateProjectManager(manager.id, payload);
      toast.success(t("company.pm.toasts.pmUpdated"));
    } else {
      companyMutations.createProjectManager(payload);
      toast.success(t("company.pm.toasts.pmCreated"));
    }
    onOpenChange(false);
  };

  const remove = () => {
    if (!manager) return;
    if (!window.confirm(t("company.pm.confirmDeletePm"))) return;
    companyMutations.deleteProjectManager(manager.id);
    toast.success(t("company.pm.toasts.pmDeleted"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? t("company.pm.pmForm.editTitle") : t("company.pm.pmForm.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>{t("company.pm.pmForm.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>{t("company.pm.pmForm.email")}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>{t("company.pm.pmForm.phone")}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
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
