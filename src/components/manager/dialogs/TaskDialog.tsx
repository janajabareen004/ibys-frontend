import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { managerActions } from "@/hooks/useManagerData";
import type {
  ManagedProject,
  ManagedTask,
  Employee,
  ProjectStageKey,
  TaskPriority,
  TaskStatus,
} from "@/mocks/mockManagerService";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: ManagedTask | null;
  projects: ManagedProject[];
  employees: Employee[];
  defaultProjectId?: string;
};

const STATUSES: TaskStatus[] = ["not_started", "in_progress", "waiting", "completed", "blocked"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];
const STAGES: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

function toDateInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function TaskDialog({ open, onOpenChange, task, projects, employees, defaultProjectId }: Props) {
  const { t } = useI18n();
  const isEdit = !!task;

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [assignedTo, setAssignedTo] = React.useState<string>("");
  const [stageKey, setStageKey] = React.useState<ProjectStageKey | "none">("none");
  const [dueDate, setDueDate] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [status, setStatus] = React.useState<TaskStatus>("not_started");
  const [progress, setProgress] = React.useState(0);
  const [tags, setTags] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setProjectId(task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "");
    setAssignedTo(task?.assignedTo ?? employees[0]?.id ?? "");
    setStageKey((task?.stageKey ?? "none") as ProjectStageKey | "none");
    setDueDate(toDateInput(task?.dueDate) || toDateInput(new Date(Date.now() + 7 * 86400000).toISOString()));
    setPriority(task?.priority ?? "medium");
    setStatus(task?.status ?? "not_started");
    setProgress(task?.progress ?? 0);
    setTags((task?.tags ?? []).join(", "));
  }, [open, task, defaultProjectId, projects, employees]);

  const submit = () => {
    if (!title.trim() || !projectId || !assignedTo) {
      toast.error(t("common.error"));
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      projectId,
      assignedTo,
      stageKey: stageKey === "none" ? undefined : stageKey,
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      priority,
      status,
      progress,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (isEdit && task) {
      managerActions.updateTask(task.id, payload);
      toast.success(t("manager.pm.toasts.updated"));
    } else {
      managerActions.createTask(payload);
      toast.success(t("manager.pm.toasts.created"));
    }
    onOpenChange(false);
  };

  const remove = () => {
    if (!task) return;
    if (!window.confirm(t("manager.pm.taskForm.confirmDelete"))) return;
    managerActions.deleteTask(task.id);
    toast.success(t("manager.pm.toasts.deleted"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("manager.pm.taskForm.editTitle") : t("manager.pm.taskForm.createTitle")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.taskForm.title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.taskForm.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.taskForm.project")}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.taskForm.assignee")}</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.taskForm.stage")}</Label>
              <Select value={stageKey} onValueChange={(v) => setStageKey(v as ProjectStageKey | "none")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{t(`tenant.timeline.stages.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.taskForm.due")}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.taskForm.priority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{t(`manager.priority.${p}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t("manager.pm.taskForm.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`manager.taskStatus.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {isEdit && (
            <div className="grid gap-1.5">
              <Label>{t("manager.taskDetails.progress")} — {progress}%</Label>
              <Input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>{t("manager.pm.taskForm.tags")}</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} maxLength={200} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {isEdit ? (
            <Button variant="destructive" onClick={remove}>{t("manager.pm.taskForm.delete")}</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t("manager.pm.common.cancel")}</Button>
            <Button onClick={submit}>{t("manager.pm.common.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
