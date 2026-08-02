import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantStages } from "@/hooks/useTenantData";
import { StageTimeline } from "@/components/tenant/StageTimeline";
import { InlineLoader } from "@/components/tenant/InlineLoader";

export const Route = createFileRoute("/_authenticated/tenant/timeline")({
  head: () => ({
    meta: [
      { title: "Construction Timeline – IBYS" },
      { name: "description", content: "Interactive construction timeline for your project." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const { data: stages } = useTenantStages();

  return (
    <RoleGuard allow="TENANT">
      <PageHeader
        title={t("pages.timeline.title")}
        description={t("pages.timeline.description")}
      />
      <Card>
        <CardContent className="p-4 sm:p-6">
          {stages ? (
            <StageTimeline stages={stages} />
          ) : (
            <InlineLoader label={t("common.loading")} />
          )}
          {!stages && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-3 w-3" aria-hidden />…</div>}
        </CardContent>
      </Card>
    </RoleGuard>
  );
}
