import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "./PriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ManagedTask } from "@/mocks/mockManagerService";
import { Calendar, User } from "lucide-react";

export function TaskCard({
  task,
  assigneeName,
  projectName,
}: {
  task: ManagedTask;
  assigneeName?: string;
  projectName?: string;
}) {
  const { t, formatDate } = useI18n();
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/manager/tasks/$taskId"
            params={{ taskId: task.id }}
            className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground hover:text-primary"
          >
            {task.title}
          </Link>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {projectName && <Badge variant="outline" className="rounded-full">{projectName}</Badge>}
          {task.stageKey && (
            <Badge variant="secondary" className="rounded-full">
              {t(`tenant.timeline.stages.${task.stageKey}`)}
            </Badge>
          )}
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden />{formatDate(task.dueDate)}</span>
          {assigneeName && <span className="flex items-center gap-1"><User className="h-3 w-3" aria-hidden />{assigneeName}</span>}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <TaskStatusBadge status={task.status} />
            <span className="font-semibold text-foreground">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
