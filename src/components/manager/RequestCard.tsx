import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { managerActions } from "@/hooks/useManagerData";
import { toast } from "sonner";
import { RequestReplyDialog } from "@/components/manager/dialogs/RequestReplyDialog";
import type { ManagedRequest } from "@/mocks/mockManagerService";
import { Camera, CalendarPlus, HelpCircle, FileText, Reply } from "lucide-react";

const ICONS = {
  photo: Camera,
  meeting: CalendarPlus,
  question: HelpCircle,
  document: FileText,
} as const;

export function RequestCard({ request, projectName, assigneeName, onUpdated }: { request: ManagedRequest; projectName?: string; assigneeName?: string; onUpdated?: () => void }) {
  const { t, formatDate } = useI18n();
  const Icon = ICONS[request.category];
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  // Persist the status change to the backend first; only surface success (and
  // refetch so the row moves to the correct tab) after Supabase confirms it.
  const changeStatus = async (
    status: "approved" | "rejected" | "archived",
    successKey: string,
  ) => {
    if (pending) return;
    setPending(true);
    try {
      await managerActions.updateRequestStatus(request.id, status);
      toast.success(t(successKey));
      onUpdated?.();
    } catch {
      toast.error(t("manager.pm.requestForm.updateError"));
    } finally {
      setPending(false);
    }
  };

  const approve = () => changeStatus("approved", "manager.pm.requestForm.approvedToast");
  const reject = () => changeStatus("rejected", "manager.pm.requestForm.rejectedToast");
  const archive = () => changeStatus("archived", "manager.pm.requestForm.archivedToast");

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="grid gap-3 p-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{t(`manager.requestCategory.${request.category}`)}</Badge>
                <Badge variant="outline" className="rounded-full text-[11px]">{t(`manager.requestStatus.${request.status}`)}</Badge>
                <Badge variant="outline" className="rounded-full text-[11px]">{t(`manager.priority.${request.priority}`)}</Badge>
              </div>
              <p className="mt-2 text-sm text-foreground">{request.description}</p>
              {request.reply && (
                <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs">
                  <p className="font-semibold text-primary">
                    <Reply className="me-1 inline h-3 w-3" aria-hidden />
                    {t("manager.pm.requestForm.replyLabel")}
                  </p>
                  <p className="mt-1 text-foreground">{request.reply}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {projectName && <span>{t("manager.requests.project")}: <strong className="text-foreground">{projectName}</strong></span>}
            <span>{t("manager.requests.tenant")}: <strong className="text-foreground">{request.tenantName}</strong></span>
            {assigneeName && <span>{t("manager.requests.assignedTo")}: <strong className="text-foreground">{assigneeName}</strong></span>}
            <span>{formatDate(request.createdAt, { dateStyle: "medium" })}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={approve} disabled={pending || request.status === "approved" || request.status === "archived"}>{t("manager.requests.approve")}</Button>
            <Button size="sm" variant="outline" onClick={reject} disabled={pending || request.status === "rejected" || request.status === "archived"}>{t("manager.requests.reject")}</Button>
            <Button size="sm" variant="secondary" onClick={() => setReplyOpen(true)}>{t("manager.requests.reply")}</Button>
            <Button size="sm" variant="ghost" onClick={archive} disabled={pending || request.status === "archived"}>{t("manager.requests.archive")}</Button>
          </div>
        </div>
      </CardContent>
      <RequestReplyDialog open={replyOpen} onOpenChange={setReplyOpen} request={request} />
    </Card>
  );
}
