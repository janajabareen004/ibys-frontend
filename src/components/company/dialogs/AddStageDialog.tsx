import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations } from "@/api/companyApi";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import type { CompanyStageStatus } from "@/mocks/mockCompanyService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The real project this stage will be created under (POST /projects/<id>/progress). */
  projectId: string | null;
  /**
   * Raw task_name of every real stage already created for this project
   * (CompanyStage.taskName — see mapCompanyStage()). Used only to hide
   * already-used options below; never sent to the backend as-is.
   */
  existingStageNames?: string[];
  /** Called after a successful create so the caller can refetch its real stage list. */
  onSaved?: () => void;
};

const STATUSES: CompanyStageStatus[] = ["pending", "current", "completed", "delayed"];

/**
 * Fixed, backend-agnostic vocabulary for `task_name`. Values are the exact
 * strings POSTed as task_name — kept English-like and stable regardless of
 * UI locale (only the displayed label is translated via labelKey).
 */
const STAGE_NAME_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "Site Preparation", labelKey: "sitePreparation" },
  { value: "Foundation", labelKey: "foundation" },
  { value: "Structure Construction", labelKey: "structureConstruction" },
  { value: "Windows & Doors", labelKey: "windowsDoors" },
  { value: "Electrical Installation", labelKey: "electricalInstallation" },
  { value: "Plumbing", labelKey: "plumbing" },
  { value: "Interior Finishing", labelKey: "interiorFinishing" },
  { value: "Exterior Finishing", labelKey: "exteriorFinishing" },
  { value: "Final Inspection", labelKey: "finalInspection" },
];

function todayInput() {
  const d = new Date();
  const p = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function AddStageDialog({ open, onOpenChange, projectId, existingStageNames, onSaved }: Props) {
  const { t } = useI18n();

  const [taskName, setTaskName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [status, setStatus] = React.useState<CompanyStageStatus>("pending");
  const [progress, setProgress] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  const usedNames = React.useMemo(
    () => new Set((existingStageNames ?? []).map((n) => n.trim().toLowerCase())),
    [existingStageNames],
  );
  const availableOptions = React.useMemo(
    () => STAGE_NAME_OPTIONS.filter((o) => !usedNames.has(o.value.toLowerCase())),
    [usedNames],
  );

  React.useEffect(() => {
    if (!open) return;
    setTaskName(availableOptions[0]?.value ?? "");
    setStartDate(todayInput());
    setEndDate(todayInput());
    setStatus("pending");
    setProgress(0);
    // Intentionally only re-runs when the dialog opens: availableOptions is
    // derived from props captured at open-time, not meant to reset mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (saving || !projectId) return;
    if (!taskName.trim() || !startDate || !endDate) {
      notifyError(t("common.error") as string);
      return;
    }
    if (endDate < startDate) {
      notifyError(t("company.addStage.errors.endBeforeStart") as string);
      return;
    }
    if (progress < 0 || progress > 100) {
      notifyError(t("common.error") as string);
      return;
    }
    setSaving(true);
    try {
      await companyMutations.createStage(projectId, {
        taskName: taskName.trim(),
        startDate,
        endDate,
        status,
        progress,
      });
      notifySuccess(t("company.addStage.toastCreated") as string);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("company.addStage.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="add-stage-name">{t("company.addStage.fields.name")}</Label>
            {availableOptions.length > 0 ? (
              <Select value={taskName} onValueChange={setTaskName}>
                <SelectTrigger id="add-stage-name"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {t(`company.addStage.stageNames.${o.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{t("company.addStage.noStagesLeft")}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="add-stage-start">{t("company.addStage.fields.startDate")}</Label>
              <Input id="add-stage-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-stage-end">{t("company.addStage.fields.endDate")}</Label>
              <Input id="add-stage-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.addStage.fields.status")}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CompanyStageStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`company.stageStatus.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <Label className="text-muted-foreground">{t("company.addStage.fields.progress")}</Label>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Slider value={[progress]} min={0} max={100} step={1} onValueChange={([v]) => setProgress(v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("company.updateStage.cancel")}</Button>
          <Button onClick={submit} disabled={saving || !projectId || availableOptions.length === 0}>{t("company.addStage.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
