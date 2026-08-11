import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { managerActions } from "@/hooks/useManagerData";
import type { ManagedMeeting } from "@/mocks/mockManagerService";
import { CalendarClock, MapPin, Users, FileText } from "lucide-react";

export function MeetingCard({
  meeting,
  projectName,
  onReschedule,
  onChanged,
}: {
  meeting: ManagedMeeting;
  projectName?: string;
  onReschedule?: (meeting: ManagedMeeting) => void;
  onChanged?: () => void;
}) {
  const { t, formatDate } = useI18n();
  const [pending, setPending] = React.useState(false);
  const [notesOpen, setNotesOpen] = React.useState(false);
  const statusStyle: Record<ManagedMeeting["status"], string> = {
    upcoming: "border-primary/30 bg-primary/10 text-primary",
    today: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    past: "border-border bg-muted text-muted-foreground",
    cancelled: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
    rescheduled: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
  };

  const approve = async () => {
    if (pending) return;
    setPending(true);
    try {
      await managerActions.approveMeeting(meeting.id);
      toast.success(t("manager.meetings.approvedToast"));
      onChanged?.();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setPending(false);
    }
  };

  const notes = (meeting.notes ?? "").trim();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{meeting.title}</h3>
            {projectName && <p className="mt-0.5 truncate text-xs text-muted-foreground">{projectName}</p>}
          </div>
          <Badge variant="outline" className={`rounded-full text-[11px] font-semibold ${statusStyle[meeting.status]}`}>
            {t(`manager.meetingStatus.${meeting.status}`)}
          </Badge>
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" aria-hidden />{formatDate(meeting.when, { dateStyle: "medium", timeStyle: "short" })}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden />{meeting.location}</span>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{meeting.participants.length} {t("manager.meetings.participants")}</span>
          <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" aria-hidden />{meeting.durationMin} {t("manager.meetings.minutes")}</span>
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{meeting.agenda}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={approve} disabled={pending}>{t("manager.meetings.approve")}</Button>
          <Button size="sm" variant="outline" onClick={() => onReschedule?.(meeting)} disabled={pending}>{t("manager.meetings.reschedule")}</Button>
          <Button size="sm" variant="ghost" onClick={() => setNotesOpen(true)}>{t("manager.meetings.viewNotes")}</Button>
        </div>
      </CardContent>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("manager.meetings.notesTitle")}</DialogTitle>
          </DialogHeader>
          {notes ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">{notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("manager.meetings.noNotes")}</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
