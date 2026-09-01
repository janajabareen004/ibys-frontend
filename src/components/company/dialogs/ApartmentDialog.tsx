import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations, extractApiErrorMessage } from "@/api/companyApi";
import type { Apartment, ApartmentStatus, CompanyProject, CompanyTenant } from "@/api/companyApi";

const STATUSES: ApartmentStatus[] = ["vacant", "assigned", "sold", "reserved"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: Apartment | null;
  projects: CompanyProject[];
  tenants: CompanyTenant[];
  defaultProjectId?: string;
  /** Called after a successful create/update/delete so the caller can refetch the real apartments list. */
  onSaved?: () => void;
};

export function ApartmentDialog({ open, onOpenChange, apartment, projects, tenants, defaultProjectId, onSaved }: Props) {
  const { t } = useI18n();
  const isEdit = !!apartment;

  const [projectId, setProjectId] = React.useState("");
  const [floor, setFloor] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [sizeSqm, setSizeSqm] = React.useState(90);
  const [status, setStatus] = React.useState<ApartmentStatus>("vacant");
  const [tenantId, setTenantId] = React.useState<string>("none");
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setProjectId(apartment?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "");
    setFloor(apartment?.floor ?? "");
    setNumber(apartment?.number ?? "");
    setSizeSqm(apartment?.sizeSqm ?? 90);
    setStatus(apartment?.status ?? "vacant");
    setTenantId(apartment?.tenantId ?? "none");
    setErrorMessage(null);
  }, [open, apartment, defaultProjectId, projects]);

  const submit = async () => {
    if (!projectId || !number.trim()) { toast.error(t("common.error")); return; }
    const payload = {
      projectId, floor: floor.trim(), number: number.trim(),
      sizeSqm, status, tenantId: tenantId === "none" ? undefined : tenantId,
    };
    setErrorMessage(null);
    setSaving(true);
    try {
      if (isEdit && apartment) {
        await companyMutations.updateApartment(apartment.id, payload);
        toast.success(t("company.pm.toasts.apartmentUpdated"));
      } else {
        await companyMutations.createApartment(payload);
        toast.success(t("company.pm.toasts.apartmentCreated"));
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const msg = extractApiErrorMessage(err, t("common.error") as string);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!apartment) return;
    if (!window.confirm(t("company.pm.confirmDeleteApartment"))) return;
    setErrorMessage(null);
    setSaving(true);
    try {
      await companyMutations.deleteApartment(apartment.id);
      toast.success(t("company.pm.toasts.apartmentDeleted"));
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const msg = extractApiErrorMessage(err, t("common.error") as string);
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? t("company.pm.apartmentForm.editTitle") : t("company.pm.apartmentForm.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {errorMessage && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>{t("company.pm.apartmentForm.project")}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.floor")}</Label><Input value={floor} onChange={(e) => setFloor(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.number")}</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.sizeSqm")}</Label><Input type="number" min={10} max={2000} value={sizeSqm} onChange={(e) => setSizeSqm(Number(e.target.value))} /></div>
            <div className="grid gap-1.5">
              <Label>{t("company.pm.apartmentForm.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ApartmentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`company.pm.apartmentStatus.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.pm.apartmentForm.tenant")}</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("company.pm.apartmentForm.unassigned")}</SelectItem>
                {tenants.map((tn) => <SelectItem key={tn.id} value={tn.id}>{tn.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit ? (
            <Button variant="destructive" onClick={() => void remove()} disabled={saving}>{t("company.pm.common.delete")}</Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("company.pm.common.cancel")}</Button>
            <Button onClick={() => void submit()} disabled={saving}>{t("company.pm.common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
