import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function EmptyState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
      <h3 className="text-base font-semibold">{title ?? t("common.empty")}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
