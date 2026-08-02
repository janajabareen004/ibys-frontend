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
import type { ManagedMeeting, ManagedProject } from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: ManagedMeeting | null;
  projects: ManagedProject[];
  defaultProjectId?: string;
};

const STATUSES: ManagedMeeting["status"][] = ["upcoming", "today", "past", "cancelled", "rescheduled"];

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingDialog({ open, onOpenChange, meeting, projects, defaultProjectId }: Props) {
  const { t } = useI18n();
  const isEdit = !!meeting;

  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [when, setWhen] = React.useState("");
  const [durationMin, setDurationMin] = React.useState(60);
  const [location, setLocation] = React.useState("Video call");
  const [agenda, setAgenda] = React.useState("");
  const [participants, setParticipants] = React.useState("");
  const [status, setStatus] = React.useState<ManagedMeeting["status"]>("upcoming");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setTitle(meeting?.title ?? "");
    setProjectId(meeting?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "");
    setWhen(toLocalInput(meeting?.when ?? new Date(Date.now() + 86400000).toISOString()));
    setDurationMin(meeting?.durationMin ?? 60);
    setLocation(meeting?.location ?? "Video call");
    setAgenda(meeting?.agenda ?? "");
    setParticipants((meeting?.participants ?? []).join(", "));
    setStatus(meeting?.status ?? "upcoming");
    setNotes(meeting?.notes ?? "");
  }, [open, meeting, defaultProjectId, projects]);

  const submit = () => {
    if (!title.trim() || !projectId || !when) {
      toast.error(t("common.error"));
      return;
    }
    const payload = {
      title: title.trim(),
      projectId,
      when: new Date(when).toISOString(),
      durationMin,
      location,
      agenda,
      participants: participants.split(",").map((s) => s.trim()).filter(Boolean),
      status,
      notes,
    };
    if (isEdit && meeting) {
      managerActions.updateMeeting(meeting.id, payload);
      toast.success(t("manager.pm.toasts.updated"));
    } else {
      managerActions.createMeeting(payload);
      toast.success(t("manager.pm.toasts.created"));
    }
    onOpenChange(false);
  };

  const remove = () => {
    if (!meeting) return;
    if (!window.confirm(t("manager.pm.meetingForm.delete") + "?")) return;
    managerActions.deleteMeeting(meeting.id);
    toast.success(t("manager.pm.toasts.deleted"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("manager.pm.meetingForm.editTitle") : t("manager.pm.meetingForm.createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.meetingForm.title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.meetingForm.project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.meetingForm.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ManagedMeeting["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`manager.meetingStatus.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.meetingForm.when")}</Label>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.meetingForm.durationMin")}</Label>
              <Input type="number" min={15} step={15} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value) || 0)} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>{t("manager.pm.meetingForm.location")}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={150} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.meetingForm.participants")}</Label>
            <Input value={participants} onChange={(e) => setParticipants(e.target.value)} maxLength={500} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.meetingForm.agenda")}</Label>
            <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={2} maxLength={500} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.meetingForm.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit ? (
            <Button variant="destructive" onClick={remove}>{t("manager.pm.meetingForm.delete")}</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("manager.pm.common.cancel")}</Button>
            <Button onClick={submit}>{t("manager.pm.common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
