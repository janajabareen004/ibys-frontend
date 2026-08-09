import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Users, Video, CheckCircle2, XCircle, Clock } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantMeetings } from "@/hooks/useTenantData";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { notifyError } from "@/components/feedback/SuccessNotification";
import type { Meeting } from "@/mocks/mockTenantService";

export const Route = createFileRoute("/_authenticated/tenant/meetings")({
  head: () => ({
    meta: [
      { title: "Meetings – IBYS" },
      { name: "description", content: "Meetings scheduled with your project team." },
    ],
  }),
  component: Page,
});

const TABS: Array<Meeting["status"]> = ["upcoming", "past", "cancelled"];

function Page() {
  const { t, formatDate } = useI18n();
  const { data } = useTenantMeetings();
  const [tab, setTab] = React.useState<Meeting["status"]>("upcoming");

  const list = (data ?? []).filter((m) => m.status === tab);

  const handleJoin = (meeting: Meeting) => {
    if (meeting.meetingLink) {
      window.open(meeting.meetingLink, "_blank", "noopener,noreferrer");
    } else {
      notifyError(t("tenant.meetings.linkUnavailable"));
    }
  };

  return (
    <RoleGuard allow="TENANT">
      <PageHeader
        title={t("pages.meetings.title")}
        description={t("pages.meetings.description")}
      />

      <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTab(s)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`tenant.meetings.${s}`)}
          </button>
        ))}
      </div>

      {!data ? (
        <InlineLoader />
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((m) => {
            const d = new Date(m.when);
            return (
              <Card key={m.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="grid h-20 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm">
                    <div className="text-center">
                      <div className="text-[10px] uppercase tracking-widest opacity-80">{d.toLocaleString(undefined, { month: "short" })}</div>
                      <div className="text-2xl font-bold leading-none">{d.getDate()}</div>
                      <div className="mt-0.5 text-[10px] opacity-80">{d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="min-w-0 flex-1 truncate text-base font-semibold">{m.title}</h3>
                      <StatusChip status={m.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {m.location && (
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />{m.location}</span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        {m.location && <span aria-hidden>·</span>}
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {t("tenant.meetings.duration", { n: m.durationMin })}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="min-w-0">{m.participants.join(", ")}</span>
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground">{t("tenant.meetings.notes")}: {m.notes}</p>}
                    <div className="text-[11px] text-muted-foreground">{formatDate(m.when, { dateStyle: "full", timeStyle: "short" })}</div>
                    {m.status === "upcoming" && (
                      <div className="pt-1">
                        <Button size="sm" onClick={() => handleJoin(m)}><Video className="h-3.5 w-3.5" />{t("tenant.meetings.join")}</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </RoleGuard>
  );
}

function StatusChip({ status }: { status: Meeting["status"] }) {
  const { t } = useI18n();
  const map = {
    upcoming: { icon: <Clock className="h-3 w-3" />, cls: "border-primary/30 bg-primary/10 text-primary" },
    past: { icon: <CheckCircle2 className="h-3 w-3" />, cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    cancelled: { icon: <XCircle className="h-3 w-3" />, cls: "border-destructive/30 bg-destructive/10 text-destructive" },
  }[status];
  return <Badge variant="outline" className={`gap-1 ${map.cls}`}>{map.icon}{t(`tenant.meetings.${status}`)}</Badge>;
}
