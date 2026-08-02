import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CompanyStageStatusBadge } from "./CompanyStageStatusBadge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Link } from "@tanstack/react-router";
import { companyMutations } from "@/api/companyApi";
import { notifySuccess, notifyError } from "@/components/feedback/SuccessNotification";
import type { CompanyStage } from "@/mocks/mockCompanyService";
import { AlertTriangle, Camera, FileText, MessageSquare, UploadCloud } from "lucide-react";

export function StageManagementCard({ stage, projectName }: { stage: CompanyStage; projectName?: string }) {
  const { t, formatDate } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [progress, setProgress] = React.useState(stage.progress);
  const [notes, setNotes] = React.useState("");
  const [expected, setExpected] = React.useState(stage.estimatedCompletion.slice(0, 10));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setProgress(stage.progress);
      setExpected(stage.estimatedCompletion.slice(0, 10));
      setNotes("");
    }
  }, [open, stage]);

  const save = async () => {
    setSaving(true);
    try {
      await companyMutations.updateStage(stage.id, {
        progress,
        notes: notes.trim() || stage.notes,
        estimatedCompletion: expected ? new Date(expected).toISOString() : stage.estimatedCompletion,
      });
      notifySuccess(t("company.updateStage.publish") as string);
      setOpen(false);
    } catch {
      notifyError(t("common.error") as string);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">
                {t(`tenant.timeline.stages.${stage.key}`)}
              </h3>
              {projectName && <p className="mt-0.5 truncate text-xs text-muted-foreground">{projectName}</p>}
            </div>
            <div className="flex items-center gap-2">
              <CompanyStageStatusBadge status={stage.status} />
              {stage.delayDays > 0 && (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertTriangle className="me-1 h-3 w-3" />
                  {t("company.stages.delayDays", { n: stage.delayDays })}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("company.projects.progress")}</span>
              <span className="font-semibold text-foreground">{stage.progress}%</span>
            </div>
            <Progress value={stage.progress} className="h-2" />
          </div>
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <div><p className="text-muted-foreground">{t("company.stages.responsibleTeam")}</p><p className="font-semibold text-foreground">{stage.responsibleTeam}</p></div>
            <div><p className="text-muted-foreground">{t("company.stages.estimated")}</p><p className="font-semibold text-foreground">{formatDate(stage.estimatedCompletion)}</p></div>
            <div><p className="text-muted-foreground">{t("company.stages.completed")}</p><p className="font-semibold text-foreground">{stage.actualCompletion ? formatDate(stage.actualCompletion) : "—"}</p></div>
          </div>
          <p className="text-xs text-muted-foreground">{t("company.stages.lastUpdate")}: {formatDate(stage.lastUpdate, { dateStyle: "medium", timeStyle: "short" })} · {stage.notes}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link to="/company/stages/$stageId" params={{ stageId: stage.id }}>
              <Badge variant="secondary" className="rounded-full hover:bg-accent"><Camera className="me-1 h-3 w-3" />{stage.photosCount} {t("company.stages.photos")}</Badge>
            </Link>
            <Link to="/company/stages/$stageId" params={{ stageId: stage.id }}>
              <Badge variant="secondary" className="rounded-full hover:bg-accent"><FileText className="me-1 h-3 w-3" />{stage.documentsCount} {t("company.stages.documents")}</Badge>
            </Link>
            <Link to="/company/stages/$stageId" params={{ stageId: stage.id }}>
              <Badge variant="secondary" className="rounded-full hover:bg-accent"><MessageSquare className="me-1 h-3 w-3" />{stage.commentsCount} {t("company.stages.comments")}</Badge>
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:min-w-44">
          <Button size="sm" onClick={() => setOpen(true)}>{t("company.stages.buttons.update")}</Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/company/stages/$stageId" params={{ stageId: stage.id }}>{t("company.stages.buttons.view")}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost"><Link to="/company/documents"><UploadCloud className="h-4 w-4" />{t("company.stages.buttons.documents")}</Link></Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("company.updateStage.title")} · {t(`tenant.timeline.stages.${stage.key}`)}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <Label className="text-muted-foreground">{t("company.updateStage.progress")}</Label>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
              <Slider value={[progress]} min={0} max={100} step={1} onValueChange={([v]) => setProgress(v)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`expected-${stage.id}`}>{t("company.updateStage.expectedCompletion")}</Label>
              <Input id={`expected-${stage.id}`} type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`notes-${stage.id}`}>{t("company.updateStage.completionNotes")}</Label>
              <Textarea id={`notes-${stage.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("company.updateStage.completionNotesPlaceholder")} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("company.updateStage.cancel")}</Button>
            <Button onClick={save} disabled={saving}>{t("company.updateStage.publish")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
