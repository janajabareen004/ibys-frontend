import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyMeetings, useCompanyProjects } from "@/hooks/useCompanyData";
import { companyMutations } from "@/api/companyApi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SectionCard } from "@/components/manager/SectionCard";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import { CalendarClock, MapPin, Users, CheckCircle2, X, RefreshCcw, Plus } from "lucide-react";
import type { CompanyMeeting, CompanyMeetingStatus, CompanyProject } from "@/mocks/mockCompanyService";

export const Route = createFileRoute("/_authenticated/company/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings – IBYS Company" },
      { name: "description", content: "Coordinate meetings across every project and site." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const { data, loading } = useCompanyMeetings();
  const { data: projects } = useCompanyProjects();
  const [tab, setTab] = React.useState<"upcoming" | "past" | "cancelled" | "rescheduled">("upcoming");
  const [details, setDetails] = React.useState<CompanyMeeting | null>(null);
  const [editing, setEditing] = React.useState<CompanyMeeting | null>(null);
  const [creating, setCreating] = React.useState(false);

  const tabFilter = (m: CompanyMeeting) => {
    if (tab === "upcoming") return m.status === "upcoming" || m.status === "today";
    return m.status === tab;
  };
  const list = (data ?? []).filter(tabFilter);
  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? "";

  const setStatus = async (m: CompanyMeeting, status: CompanyMeetingStatus, label: string) => {
    try { await companyMutations.setMeetingStatus(m.id, status); notifySuccess(label); }
    catch { notifyError(t("common.error") as string); }
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={t("company.meetings.title")}
        description={t("company.meetings.description")}
        actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />{t("company.meetings.new")}</Button>}
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="upcoming">{t("company.meetings.tabs.upcoming")}</TabsTrigger>
          <TabsTrigger value="past">{t("company.meetings.tabs.past")}</TabsTrigger>
          <TabsTrigger value="cancelled">{t("company.meetings.tabs.cancelled")}</TabsTrigger>
          <TabsTrigger value="rescheduled">{t("company.meetings.tabs.rescheduled")}</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {loading ? <InlineLoader /> : list.length === 0 ? <EmptyState title={t("company.meetings.empty")} /> : (
            <div className="grid gap-3">
              {list.map((m) => (
                <MeetingRow
                  key={m.id}
                  m={m}
                  projectName={projectName(m.projectId)}
                  onOpen={() => setDetails(m)}
                  onApprove={() => setStatus(m, "upcoming", t("company.meetings.approve") as string)}
                  onReject={() => setStatus(m, "cancelled", t("company.meetings.reject") as string)}
                  onReschedule={() => setEditing(m)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MeetingDetailsDialog meeting={details} projectName={details ? projectName(details.projectId) : ""} onOpenChange={(o) => !o && setDetails(null)} />
      <MeetingFormDialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        projects={projects ?? []}
        editing={editing}
      />
    </RoleGuard>
  );
}

function MeetingRow({ m, projectName, onOpen, onApprove, onReject, onReschedule }: {
  m: CompanyMeeting; projectName: string; onOpen: () => void; onApprove: () => void; onReject: () => void; onReschedule: () => void;
}) {
  const { t, formatDate } = useI18n();
  const statusStyle: Record<CompanyMeetingStatus, string> = {
    upcoming: "border-primary/30 bg-primary/10 text-primary",
    today: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    past: "border-border bg-muted text-muted-foreground",
    cancelled: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
    rescheduled: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
  };
  return (
    <SectionCard title={m.title} description={projectName} action={<Badge variant="outline" className={`rounded-full text-[10px] ${statusStyle[m.status]}`}>{t(`company.meetings.statuses.${m.status}`)}</Badge>}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <button type="button" onClick={onOpen} className="space-y-2 text-start text-sm hover:opacity-90">
          <p className="flex items-center gap-1.5 text-muted-foreground"><CalendarClock className="h-4 w-4" />{formatDate(m.when, { dateStyle: "full", timeStyle: "short" })} · {m.durationMin} {t("company.meetings.minutes")}</p>
          <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{m.location}</p>
          <p className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />{m.participants.join(", ")}</p>
          <p className="text-foreground"><strong className="font-semibold">{t("company.meetings.agenda")}:</strong> {m.agenda}</p>
          {m.notes && <p className="text-muted-foreground"><strong className="font-semibold text-foreground">{t("company.meetings.notes")}:</strong> {m.notes}</p>}
        </button>
        <div className="flex flex-col gap-2 md:min-w-36">
          <Button size="sm" onClick={onApprove} disabled={m.status === "past"}><CheckCircle2 className="h-4 w-4" />{t("company.meetings.approve")}</Button>
          <Button size="sm" variant="outline" onClick={onReschedule}><RefreshCcw className="h-4 w-4" />{t("company.meetings.reschedule")}</Button>
          <Button size="sm" variant="ghost" onClick={onReject} disabled={m.status === "cancelled"}><X className="h-4 w-4" />{t("company.meetings.reject")}</Button>
        </div>
      </div>
    </SectionCard>
  );
}

function MeetingDetailsDialog({ meeting, projectName, onOpenChange }: { meeting: CompanyMeeting | null; projectName: string; onOpenChange: (o: boolean) => void }) {
  const { t, formatDate } = useI18n();
  return (
    <Dialog open={!!meeting} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{meeting?.title}</DialogTitle>
          <DialogDescription>{projectName}</DialogDescription>
        </DialogHeader>
        {meeting && (
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">{formatDate(meeting.when, { dateStyle: "full", timeStyle: "short" })} · {meeting.durationMin} {t("company.meetings.minutes")}</p>
            <p className="text-muted-foreground">{meeting.location}</p>
            <p className="text-muted-foreground">{t("company.meetings.participants")}: {meeting.participants.join(", ")}</p>
            <p><strong className="font-semibold">{t("company.meetings.agenda")}:</strong> {meeting.agenda}</p>
            {meeting.notes && <p><strong className="font-semibold">{t("company.meetings.notes")}:</strong> {meeting.notes}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("company.updateStage.cancel")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MeetingFormDialog({ open, onOpenChange, projects, editing }: { open: boolean; onOpenChange: (o: boolean) => void; projects: CompanyProject[]; editing: CompanyMeeting | null }) {
  const { t } = useI18n();
  const [title, setTitle] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [when, setWhen] = React.useState("");
  const [durationMin, setDurationMin] = React.useState(60);
  const [location, setLocation] = React.useState("");
  const [agenda, setAgenda] = React.useState("");
  const [participants, setParticipants] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setProjectId(editing.projectId);
      setWhen(editing.when.slice(0, 16));
      setDurationMin(editing.durationMin);
      setLocation(editing.location);
      setAgenda(editing.agenda);
      setParticipants(editing.participants.join(", "));
      setNotes(editing.notes ?? "");
    } else {
      setTitle(""); setProjectId(projects[0]?.id ?? ""); setWhen(""); setDurationMin(60); setLocation(""); setAgenda(""); setParticipants(""); setNotes("");
    }
  }, [open, editing, projects]);

  const submit = async () => {
    if (!title.trim() || !projectId || !when) { notifyError(t("common.error") as string); return; }
    const payload = {
      title: title.trim(),
      projectId,
      when: new Date(when).toISOString(),
      durationMin: Number(durationMin) || 60,
      location: location.trim(),
      agenda: agenda.trim(),
      participants: participants.split(",").map((s) => s.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
      status: editing?.status ?? ("upcoming" as CompanyMeetingStatus),
    };
    try {
      if (editing) {
        await companyMutations.updateMeeting(editing.id, { ...payload, status: "rescheduled" });
        notifySuccess(t("company.meetings.reschedule") as string);
      } else {
        await companyMutations.createMeeting(payload);
        notifySuccess(t("company.meetings.new") as string);
      }
      onOpenChange(false);
    } catch { notifyError(t("common.error") as string); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("company.meetings.reschedule") : t("company.meetings.new")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.requests.project")}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Duration ({t("company.meetings.minutes")})</Label>
              <Input type="number" min={5} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.meetings.participants")}</Label>
            <Input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="a@x.com, b@x.com" />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.meetings.agenda")}</Label>
            <Textarea rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.meetings.notes")}</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("company.updateStage.cancel")}</Button>
          <Button onClick={submit}>{editing ? t("company.meetings.reschedule") : t("company.meetings.new")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
