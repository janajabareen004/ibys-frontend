import { Loader2 } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

function SafeLabel({ label }: { label?: string }) {
  // useI18n throws if used outside <I18nProvider>. LoadingState can be
  // rendered very early (SSR shell, error boundaries) so fall back gracefully.
  try {
    const { t } = useI18n();
    return <>{label ?? t("common.loading")}</>;
  } catch {
    return <>{label ?? "Loading…"}</>;
  }
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground"
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="text-sm">
        <SafeLabel label={label} />
      </span>
    </div>
  );
}
