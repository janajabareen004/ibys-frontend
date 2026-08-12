import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { managerActions } from "@/hooks/useManagerData";
import type { ManagedStage } from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: ManagedStage | null;
  onSaved?: () => void;
};

const STATUSES: ManagedStage["status"][] = ["completed", "current", "pending", "delayed"];

export function StageUpdateDialog({ open, onOpenChange, stage, onSaved }: Props) {
  const { t } = useI18n();
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<ManagedStage["status"]>("current");
  const [notes, setNotes] = React.useState("");
  const [estimated, setEstimated] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !stage) return;
    setProgress(stage.progress);
    setStatus(stage.status);
    setNotes(stage.notes ?? "");
    setEstimated(stage.estimatedCompletion.slice(0, 10));
  }, [open, stage]);

  if (!stage) return null;

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Only status + end_date (from the estimated date) are persisted by the
      // backend progress table; progress % and notes are display-only.
      await managerActions.updateStage(stage.id, {
        progress,
        status,
        notes,
        estimatedCompletion: estimated ? new Date(estimated).toISOString() : stage.estimatedCompletion,
      });
      toast.success(t("manager.pm.toasts.updated"));
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("manager.pm.stageForm.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.stageForm.progress")} — {progress}%</Label>
            <Input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.stageForm.status")}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ManagedStage["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`tenant.timeline.status.${s}`) || s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.stageForm.estimated")}</Label>
            <Input type="date" value={estimated} onChange={(e) => setEstimated(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.stageForm.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} />
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
