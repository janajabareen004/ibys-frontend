import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCompanyRequests, useCompanyProjects, useCompanyEmployees } from "@/hooks/useCompanyData";
import { companyMutations } from "@/api/companyApi";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SectionCard } from "@/components/manager/SectionCard";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PriorityBadge } from "@/components/manager/PriorityBadge";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import { Search, CheckCircle2, X, Reply, CheckCheck } from "lucide-react";
import type { CompanyRequest, CompanyRequestCategory, CompanyRequestStatus } from "@/mocks/mockCompanyService";

export const Route = createFileRoute("/_authenticated/company/requests")({
  head: () => ({
    meta: [
      { title: "Requests – IBYS Company" },
      { name: "description", content: "Handle tenant photo, document, meeting, and general requests." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data, loading, refetch } = useCompanyRequests();
  const { data: projects } = useCompanyProjects();
  const { data: employees } = useCompanyEmployees();
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<CompanyRequestCategory | "all">("all");
  const [status, setStatus] = React.useState<CompanyRequestStatus | "all">("all");
  const [details, setDetails] = React.useState<CompanyRequest | null>(null);
  const [replying, setReplying] = React.useState<CompanyRequest | null>(null);

  const list = (data ?? []).filter((r) => {
    const okQ = q ? [r.description, r.tenantName].join(" ").toLowerCase().includes(q.toLowerCase()) : true;
    const okC = category === "all" ? true : r.category === category;
    const okS = status === "all" ? true : r.status === status;
    return okQ && okC && okS;
  });
  const projectName = (id: string) => projects?.find((p) => p.id === id)?.name ?? "—";
  const employeeName = (id?: string) => (id ? employees?.find((e) => e.id === id)?.name : undefined);
  const statusStyle: Record<CompanyRequestStatus, string> = {
    pending: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    in_progress: "border-primary/30 bg-primary/10 text-primary",
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    rejected: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
  };

  const setStatusFor = async (r: CompanyRequest, s: CompanyRequestStatus, label: string) => {
    try {
      await companyMutations.setRequestStatus(r.id, s);
      refetch();
      notifySuccess(label);
    } catch {
      notifyError(t("common.error") as string);
    }
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader title={t("company.requests.title")} description={t("company.requests.description")} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("company.requests.search")} className="ps-9" />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as CompanyRequestCategory | "all")}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("company.requests.allCategories")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.requests.allCategories")}</SelectItem>
            {(["photo", "document", "meeting", "general"] as const).map((k) => (
              <SelectItem key={k} value={k}>{t(`company.requests.categories.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as CompanyRequestStatus | "all")}>
          <SelectTrigger className="w-48"><SelectValue placeholder={t("company.projects.allStatuses")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("company.projects.allStatuses")}</SelectItem>
            {(["pending", "in_progress", "completed", "rejected"] as const).map((k) => (
              <SelectItem key={k} value={k}>{t(`company.requests.statuses.${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? <InlineLoader /> : list.length === 0 ? <EmptyState title={t("company.requests.empty")} /> : (
        <div className="grid gap-3">
          {list.map((r) => (
            <SectionCard
              key={r.id}
              title={`${t(`company.requests.categories.${r.category}`)} · ${r.tenantName}`}
              description={`${t("company.requests.project")}: ${projectName(r.projectId)}`}
              action={
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={r.priority} />
                  <Badge variant="outline" className={`rounded-full text-[10px] ${statusStyle[r.status]}`}>{t(`company.requests.statuses.${r.status}`)}</Badge>
                </div>
              }
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <button type="button" onClick={() => setDetails(r)} className="space-y-1 text-start text-sm hover:opacity-90">
                  <p className="text-foreground">{r.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.createdAt, { dateStyle: "medium", timeStyle: "short" })}{employeeName(r.assignedTo) ? ` · ${t("company.requests.assignedTo")}: ${employeeName(r.assignedTo)}` : ""}</p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={r.status !== "pending"} onClick={() => setStatusFor(r, "in_progress", t("company.requests.accept") as string)}><CheckCircle2 className="h-4 w-4" />{t("company.requests.accept")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setReplying(r)}><Reply className="h-4 w-4" />{t("company.requests.reply")}</Button>
                  <Button size="sm" variant="ghost" disabled={r.status === "completed" || r.status === "rejected"} onClick={() => setStatusFor(r, "completed", t("company.requests.complete") as string)}><CheckCheck className="h-4 w-4" />{t("company.requests.complete")}</Button>
                  <Button size="sm" variant="ghost" disabled={r.status === "rejected"} onClick={() => setStatusFor(r, "rejected", t("company.requests.reject") as string)}><X className="h-4 w-4" />{t("company.requests.reject")}</Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={!!details} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{details ? `${t(`company.requests.categories.${details.category}`)} · ${details.tenantName}` : ""}</DialogTitle>
            <DialogDescription>{details ? projectName(details.projectId) : ""}</DialogDescription>
          </DialogHeader>
          {details && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={details.priority} />
                <Badge variant="outline" className={`rounded-full text-[10px] ${statusStyle[details.status]}`}>{t(`company.requests.statuses.${details.status}`)}</Badge>
              </div>
              <p className="text-foreground">{details.description}</p>
              <p className="text-xs text-muted-foreground">{formatDate(details.createdAt, { dateStyle: "full", timeStyle: "short" })}</p>
              {employeeName(details.assignedTo) && <p className="text-xs text-muted-foreground">{t("company.requests.assignedTo")}: {employeeName(details.assignedTo)}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetails(null)}>{t("company.updateStage.cancel")}</Button>
            {details && <Button onClick={() => { setReplying(details); setDetails(null); }}><Reply className="h-4 w-4" />{t("company.requests.reply")}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReplyDialog request={replying} onOpenChange={(o) => !o && setReplying(null)} />
    </RoleGuard>
  );
}

function ReplyDialog({ request, onOpenChange }: { request: CompanyRequest | null; onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n();
  const [message, setMessage] = React.useState("");
  React.useEffect(() => { if (request) setMessage(""); }, [request]);
  const send = async () => {
    if (!request || !message.trim()) return;
    try {
      await companyMutations.replyToRequest(request.id, message.trim());
      notifySuccess(t("company.requests.reply") as string);
      onOpenChange(false);
    } catch {
      notifyError(t("common.error") as string);
    }
  };
  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("company.requests.reply")}</DialogTitle>
          <DialogDescription>{request?.tenantName}</DialogDescription>
        </DialogHeader>
        <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("company.comments.placeholder") as string} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("company.updateStage.cancel")}</Button>
          <Button onClick={send} disabled={!message.trim()}>{t("company.comments.post")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
