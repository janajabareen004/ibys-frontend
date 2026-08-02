import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { managerActions } from "@/hooks/useManagerData";
import type { ManagedRequest } from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ManagedRequest | null;
};

export function RequestReplyDialog({ open, onOpenChange, request }: Props) {
  const { t } = useI18n();
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (open) setMessage(request?.reply ?? "");
  }, [open, request]);

  if (!request) return null;

  const send = () => {
    if (!message.trim()) return;
    managerActions.updateRequest(request.id, { reply: message.trim() });
    toast.success(t("manager.pm.requestForm.repliedToast"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("manager.pm.requestForm.replyTitle")}</DialogTitle>
        </DialogHeader>
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <strong className="text-foreground">{request.tenantName}:</strong> {request.description}
        </p>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={1000}
          placeholder={t("manager.pm.requestForm.placeholder")}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("manager.pm.common.cancel")}</Button>
          <Button onClick={send}>{t("manager.pm.requestForm.send")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
