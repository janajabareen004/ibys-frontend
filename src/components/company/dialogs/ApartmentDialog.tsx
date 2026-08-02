import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations } from "@/api/companyApi";
import type { Apartment, ApartmentStatus, CompanyProject, CompanyTenant } from "@/api/companyApi";

const STATUSES: ApartmentStatus[] = ["vacant", "assigned", "sold", "reserved"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: Apartment | null;
  projects: CompanyProject[];
  tenants: CompanyTenant[];
  defaultProjectId?: string;
};

export function ApartmentDialog({ open, onOpenChange, apartment, projects, tenants, defaultProjectId }: Props) {
  const { t } = useI18n();
  const isEdit = !!apartment;

  const [projectId, setProjectId] = React.useState("");
  const [building, setBuilding] = React.useState("");
  const [entrance, setEntrance] = React.useState("");
  const [floor, setFloor] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [rooms, setRooms] = React.useState(3);
  const [sizeSqm, setSizeSqm] = React.useState(90);
  const [status, setStatus] = React.useState<ApartmentStatus>("vacant");
  const [tenantId, setTenantId] = React.useState<string>("none");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setProjectId(apartment?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "");
    setBuilding(apartment?.building ?? "");
    setEntrance(apartment?.entrance ?? "");
    setFloor(apartment?.floor ?? "");
    setNumber(apartment?.number ?? "");
    setRooms(apartment?.rooms ?? 3);
    setSizeSqm(apartment?.sizeSqm ?? 90);
    setStatus(apartment?.status ?? "vacant");
    setTenantId(apartment?.tenantId ?? "none");
    setNotes(apartment?.notes ?? "");
  }, [open, apartment, defaultProjectId, projects]);

  const submit = () => {
    if (!projectId || !building.trim() || !number.trim()) { toast.error(t("common.error")); return; }
    const payload = {
      projectId, building: building.trim(), entrance: entrance.trim() || "—", floor: floor.trim() || "—", number: number.trim(),
      rooms, sizeSqm, status, tenantId: tenantId === "none" ? undefined : tenantId, notes: notes.trim() || undefined,
    };
    if (isEdit && apartment) {
      companyMutations.updateApartment(apartment.id, payload);
      toast.success(t("company.pm.toasts.apartmentUpdated"));
    } else {
      companyMutations.createApartment(payload);
      toast.success(t("company.pm.toasts.apartmentCreated"));
    }
    onOpenChange(false);
  };

  const remove = () => {
    if (!apartment) return;
    if (!window.confirm(t("company.pm.confirmDeleteApartment"))) return;
    companyMutations.deleteApartment(apartment.id);
    toast.success(t("company.pm.toasts.apartmentDeleted"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? t("company.pm.apartmentForm.editTitle") : t("company.pm.apartmentForm.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("company.pm.apartmentForm.project")}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.building")}</Label><Input value={building} onChange={(e) => setBuilding(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.entrance")}</Label><Input value={entrance} onChange={(e) => setEntrance(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.floor")}</Label><Input value={floor} onChange={(e) => setFloor(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.number")}</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.rooms")}</Label><Input type="number" min={1} max={12} value={rooms} onChange={(e) => setRooms(Number(e.target.value))} /></div>
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
          <div className="grid gap-1.5"><Label>{t("company.pm.apartmentForm.notes")}</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
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
