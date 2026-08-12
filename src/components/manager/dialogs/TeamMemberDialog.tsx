import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { managerActions } from "@/hooks/useManagerData";
import type { Employee, ManagedProject } from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Only projects owned by the authenticated manager should be passed in.
  projects: ManagedProject[];
  defaultProjectId?: string;
  onSaved?: () => void;
};

const AVAILABILITY: Employee["availability"][] = ["available", "busy", "off"];

export function TeamMemberDialog({ open, onOpenChange, projects, defaultProjectId, onSaved }: Props) {
  const { t } = useI18n();

  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [availability, setAvailability] = React.useState<Employee["availability"]>("available");
  const [projectId, setProjectId] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setRole("");
    setEmail("");
    setPhone("");
    setAvailability("available");
    setProjectId(defaultProjectId ?? projects[0]?.id ?? "");
  }, [open, defaultProjectId, projects]);

  const submit = async () => {
    if (saving) return;
    if (!name.trim() || !projectId) {
      toast.error(t("common.error"));
      return;
    }
    setSaving(true);
    try {
      await managerActions.createTeamMember({
        projectId,
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        phone: phone.trim(),
        availability,
      });
      toast.success(t("manager.pm.toasts.created"));
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("manager.team.addTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("manager.team.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.team.role")}</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("manager.team.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.team.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("manager.team.availability")}</Label>
              <Select value={availability} onValueChange={(v) => setAvailability(v as Employee["availability"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABILITY.map((a) => (
                    <SelectItem key={a} value={a}>{t(`manager.team.availabilityStates.${a}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.team.project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("manager.pm.common.cancel")}</Button>
          <Button onClick={submit} disabled={saving}>{t("manager.pm.common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
