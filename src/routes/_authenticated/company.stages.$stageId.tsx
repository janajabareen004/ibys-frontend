import * as React from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  useCompanyStage,
  useCompanyProject,
  useCompanyPhotos,
  useCompanyDocuments,
  useCompanyComments,
  useCompanyActivity,
} from "@/hooks/useCompanyData";
import { companyMutations } from "@/api/companyApi";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { SectionCard } from "@/components/manager/SectionCard";
import { CompanyStageStatusBadge } from "@/components/company/CompanyStageStatusBadge";
import { PhotoCard } from "@/components/company/PhotoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Paperclip, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/company/stages/$stageId")({
  head: () => ({
    meta: [
      { title: "Update stage – IBYS Company" },
      { name: "description", content: "Professional stage update interface." },
    ],
  }),
  component: Page,
});

function Page() {
  const { stageId } = useParams({ from: "/_authenticated/company/stages/$stageId" });
  const { t, formatDate } = useI18n();
  const stage = useCompanyStage(stageId);
  const project = useCompanyProject(stage.data?.projectId ?? "");
  const photos = useCompanyPhotos();
  const documents = useCompanyDocuments();
  const comments = useCompanyComments();
  const activity = useCompanyActivity();

  const [progress, setProgress] = React.useState(stage.data?.progress ?? 0);
  const [notes, setNotes] = React.useState("");
  const [expected, setExpected] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [posting, setPosting] = React.useState(false);

  React.useEffect(() => {
    if (stage.data) {
      setProgress(stage.data.progress);
      setExpected(stage.data.estimatedCompletion.slice(0, 10));
    }
  }, [stage.data]);

  if (stage.loading) return <InlineLoader />;
  if (!stage.data) return <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t("company.stages.empty")}</div>;

  const s = stage.data;
  const stagePhotos = (photos.data ?? []).filter((p) => p.projectId === s.projectId && p.stageKey === s.key).slice(0, 6);
  const stageDocs = (documents.data ?? []).filter((d) => d.projectId === s.projectId && d.stageKey === s.key).slice(0, 6);
  const stageComments = (comments.data ?? []).filter((c) => c.projectId === s.projectId && c.stageKey === s.key);
  const stageActivity = (activity.data ?? []).filter((a) => a.projectId === s.projectId).slice(0, 6);

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader
        title={`${t("company.updateStage.title")} · ${t(`tenant.timeline.stages.${s.key}`)}`}
        description={project.data?.name}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/company/stages"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t("company.actions.back")}</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title={t("company.updateStage.currentStatus")} action={<CompanyStageStatusBadge status={s.status} />}>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <Label className="text-muted-foreground">{t("company.updateStage.progress")}</Label>
                  <span className="font-semibold text-foreground">{progress}%</span>
                </div>
                <Slider value={[progress]} min={0} max={100} step={1} onValueChange={([v]) => setProgress(v)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expected">{t("company.updateStage.expectedCompletion")}</Label>
                <Input id="expected" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{t("company.updateStage.completionNotes")}</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("company.updateStage.completionNotesPlaceholder")} rows={5} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={saving} onClick={async () => {
                  setSaving(true);
                  try {
                    await companyMutations.updateStage(s.id, {
                      progress,
                      notes: notes.trim() || s.notes,
                      estimatedCompletion: expected ? new Date(expected).toISOString() : s.estimatedCompletion,
                    });
                    notifySuccess(t("company.updateStage.publish") as string);
                    setNotes("");
                  } catch { notifyError(t("common.error") as string); }
                  finally { setSaving(false); }
                }}><Send className="h-4 w-4" />{t("company.updateStage.publish")}</Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setProgress(s.progress);
                  setExpected(s.estimatedCompletion.slice(0, 10));
                  setNotes("");
                }}>{t("company.updateStage.cancel")}</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">{t("company.updateStage.apiHint")}</p>
            </div>
          </SectionCard>

          <SectionCard title={t("company.updateStage.recentPhotos")}>
            {stagePhotos.length ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {stagePhotos.map((p) => <PhotoCard key={p.id} photo={p} />)}
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </SectionCard>

          <SectionCard title={t("company.updateStage.comments")}>
            <div className="space-y-3">
              {stageComments.map((c) => (
                <div key={c.id} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/70 to-secondary text-[10px] font-bold text-primary-foreground">{c.author.split(" ").map((s) => s[0]).slice(0, 2).join("")}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{c.author}</p><p className="truncate text-[11px] text-muted-foreground">{c.role} · {formatDate(c.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p></div>
                    {c.attachments > 0 && <Badge variant="secondary" className="gap-1 text-[10px]"><Paperclip className="h-3 w-3" />{c.attachments}</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-foreground">{c.message}</p>
                </div>
              ))}
              {stageComments.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
              <div className="flex items-center gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("company.comments.placeholder")} />
                <Button size="sm" disabled={posting || !comment.trim()} onClick={async () => {
                  setPosting(true);
                  try {
                    await companyMutations.addStageComment({
                      projectId: s.projectId,
                      stageKey: s.key,
                      author: "Company",
                      role: "Building Company",
                      message: comment.trim(),
                    });
                    setComment("");
                    notifySuccess(t("company.comments.post") as string);
                  } catch { notifyError(t("common.error") as string); }
                  finally { setPosting(false); }
                }}>{t("company.comments.post")}</Button>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title={t("company.updateStage.latestActivity")}>
            <ul className="space-y-3">
              {stageActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="min-w-0"><p className="truncate"><strong>{a.actor}</strong> {a.message}</p><p className="text-xs text-muted-foreground">{formatDate(a.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p></div>
                </li>
              ))}
              {stageActivity.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
            </ul>
          </SectionCard>

          <SectionCard title={t("company.updateStage.recentDocuments")} action={<Button asChild variant="ghost" size="sm"><Link to="/company/documents">{t("company.actions.viewAll")}</Link></Button>}>
            <ul className="space-y-2 text-sm">
              {stageDocs.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-foreground">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="truncate">{d.name}</span>
                  <Badge variant="secondary" className="ms-auto text-[10px]">{d.version}</Badge>
                </li>
              ))}
              {stageDocs.length === 0 && <li className="text-muted-foreground">—</li>}
            </ul>
          </SectionCard>
        </div>
      </div>
    </RoleGuard>
  );
}
