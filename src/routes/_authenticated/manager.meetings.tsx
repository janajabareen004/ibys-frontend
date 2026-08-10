import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useManagerMeetings, useManagerProjects, managerActions } from "@/hooks/useManagerData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/components/manager/MeetingCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { MeetingDialog } from "@/components/manager/dialogs/MeetingDialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ManagedMeeting } from "@/mocks/mockManagerService";

export const Route = createFileRoute("/_authenticated/manager/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings – IBYS Manager" },
      { name: "description", content: "Coordinate meetings across every project and team." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const { data, loading, refetch } = useManagerMeetings();
  const { data: projects } = useManagerProjects();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ManagedMeeting | null>(null);
  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? "";

  const filter = (status: ManagedMeeting["status"]) => (data ?? []).filter((m) => m.status === status);
  const tabs: Array<{ key: ManagedMeeting["status"]; labelKey: string }> = [
    { key: "upcoming", labelKey: "manager.meetings.tabs.upcoming" },
    { key: "today", labelKey: "manager.meetings.tabs.today" },
    { key: "past", labelKey: "manager.meetings.tabs.past" },
    { key: "cancelled", labelKey: "manager.meetings.tabs.cancelled" },
    { key: "rescheduled", labelKey: "manager.meetings.tabs.rescheduled" },
  ];

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (m: ManagedMeeting) => { setEditing(m); setOpen(true); };
  const remove = async (m: ManagedMeeting) => {
    if (!window.confirm(t("manager.pm.meetingForm.delete") + "?")) return;
    try {
      await managerActions.deleteMeeting(m.id);
      toast.success(t("manager.pm.toasts.deleted"));
      refetch();
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.meetings.title")}
        description={t("manager.meetings.description")}
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4" />{t("manager.meetings.new")}</Button>}
      />
      <Tabs defaultValue="upcoming">
        <TabsList className="flex-wrap">
          {tabs.map((tab) => <TabsTrigger key={tab.key} value={tab.key}>{t(tab.labelKey)}</TabsTrigger>)}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            {loading ? <InlineLoader /> : (
              filter(tab.key).length === 0 ? <EmptyState title={t("manager.meetings.empty")} /> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filter(tab.key).map((m) => (
                    <div key={m.id} className="group relative">
                      <MeetingCard meeting={m} projectName={projectName(m.projectId)} />
                      <div className="pointer-events-none absolute end-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => openEdit(m)} aria-label={t("manager.pm.common.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => remove(m)} aria-label={t("manager.pm.common.delete")}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </TabsContent>
        ))}
      </Tabs>

      <MeetingDialog open={open} onOpenChange={setOpen} meeting={editing} projects={projects ?? []} onSaved={refetch} />
    </RoleGuard>
  );
}
