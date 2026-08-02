import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Plus } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/FormField";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantRequests, useTenantStages } from "@/hooks/useTenantData";
import { tenantApi } from "@/api/tenantApi";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import type { PhotoRequest, StageId } from "@/mocks/mockTenantService";

export const Route = createFileRoute("/_authenticated/tenant/requests")({
  head: () => ({
    meta: [
      { title: "Photo Requests – IBYS" },
      { name: "description", content: "Ask the building company for on-site photos." },
    ],
  }),
  component: Page,
});

const PRIORITIES: PhotoRequest["priority"][] = ["low", "medium", "high"];

function Page() {
  const { t, formatDate } = useI18n();
  const { data: stages } = useTenantStages();
  const { data: requests, refetch } = useTenantRequests();
  const [stageId, setStageId] = React.useState<StageId | "">("");
  const [desc, setDesc] = React.useState("");
  const [priority, setPriority] = React.useState<PhotoRequest["priority"]>("medium");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageId || !desc.trim()) return;
    setSubmitting(true);
    try {
      await tenantApi.createRequest({ stageId, description: desc.trim(), priority });
      notifySuccess(t("tenant.requests.success"), t("tenant.requests.successBody"));
      setDesc("");
      setStageId("");
      setPriority("medium");
      refetch();
    } catch {
      notifyError(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allow="TENANT">
      <PageHeader
        title={t("tenant.requests.title")}
        description={t("tenant.requests.description")}
        actions={<Badge variant="secondary" className="gap-1"><Camera className="h-3 w-3" />{requests?.length ?? 0}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_1.4fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("tenant.requests.new")}</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <FormField id="req-stage" label={t("tenant.requests.stage")} required>
                <select
                  id="req-stage"
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value as StageId)}
                  required
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="" disabled>—</option>
                  {stages?.map((s) => (
                    <option key={s.id} value={s.id}>{t(s.nameKey)}</option>
                  ))}
                </select>
              </FormField>
              <FormField id="req-desc" label={t("tenant.requests.area")} required>
                <Textarea id="req-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("tenant.requests.areaPlaceholder")} rows={4} required />
              </FormField>
              <FormField id="req-priority" label={t("tenant.requests.priority")}>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        priority === p ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {t(`tenant.requests.priorities.${p}`)}
                    </button>
                  ))}
                </div>
              </FormField>
              <Button type="submit" disabled={submitting} className="w-full">
                <Plus className="h-4 w-4" />
                {t("tenant.actions.submit")}
              </Button>
            </form>
            {/* Hidden Input import kept for future filter usage */}
            <Input type="hidden" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("tenant.requests.history")}</CardTitle></CardHeader>
          <CardContent>
            {!requests ? (
              <InlineLoader />
            ) : requests.length === 0 ? (
              <EmptyState title={t("tenant.requests.empty")} />
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => {
                  const stage = stages?.find((s) => s.id === r.stageId);
                  return (
                    <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {stage && <Badge variant="outline">{t(stage.nameKey)}</Badge>}
                            <Badge variant="secondary">{t(`tenant.requests.priorities.${r.priority}`)}</Badge>
                          </div>
                          <p className="mt-2 text-sm">{r.description}</p>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {t("tenant.requests.requestedOn")} {formatDate(r.createdAt, { dateStyle: "medium" })}
                          </div>
                        </div>
                        <StatusPill status={r.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

function StatusPill({ status }: { status: PhotoRequest["status"] }) {
  const { t } = useI18n();
  const cls =
    status === "pending" ? "border-amber-200 bg-amber-50 text-amber-700"
    : status === "approved" ? "border-primary/30 bg-primary/10 text-primary"
    : status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-destructive/30 bg-destructive/10 text-destructive";
  return <Badge variant="outline" className={cls}>{t(`tenant.requests.statuses.${status}`)}</Badge>;
}
