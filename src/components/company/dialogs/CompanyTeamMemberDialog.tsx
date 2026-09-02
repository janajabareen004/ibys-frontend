import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations, type CompanyProject } from "@/api/companyApi";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import type { CompanyEmployee } from "@/mocks/mockCompanyService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already-owned projects only (from useCompanyProjects()) — never pass an unfiltered project list here. */
  projects: CompanyProject[];
  onSaved?: () => void;
};

const AVAILABILITY: CompanyEmployee["availability"][] = ["available", "on_site", "off"];

/**
 * Building Company "add team member" dialog. Only exposes the fields the
 * real team_members table has (name/role/email/phone/availability/project);
 * there is no workload, current-stage, or multi-project column, so those are
 * never shown here or sent to the API.
 */
export function CompanyTeamMemberDialog({ open, onOpenChange, projects, onSaved }: Props) {
  const { t } = useI18n();

  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [availability, setAvailability] = React.useState<CompanyEmployee["availability"]>("available");
  const [projectId, setProjectId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setRole("");
    setEmail("");
    setPhone("");
    setAvailability("available");
    setProjectId(projects[0]?.id ?? "");
  }, [open, projects]);

  const submit = async () => {
    if (saving) return;
    if (!name.trim() || !projectId) {
      notifyError(t("common.error") as string);
      return;
    }
    setSaving(true);
    try {
      await companyMutations.createTeamMember({
        projectId,
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        phone: phone.trim(),
        availability,
      });
      notifySuccess(t("company.toasts.teamMemberCreated") as string);
      onSaved?.();
      onOpenChange(false);
    } catch {
      notifyError(t("common.error") as string);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("company.team.addTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("company.team.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.team.project")}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.team.role")}</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("company.team.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("company.team.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.team.availability")}</Label>
            <Select value={availability} onValueChange={(v) => setAvailability(v as CompanyEmployee["availability"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY.map((a) => (
                  <SelectItem key={a} value={a}>
                    {t(`company.team.states.${a}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
