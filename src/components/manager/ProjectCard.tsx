import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ManagedProject } from "@/mocks/mockManagerService";
import { MapPin, User, Calendar, ArrowRight } from "lucide-react";

export function ProjectCard({ project, layout = "grid" }: { project: ManagedProject; layout?: "grid" | "list" }) {
  const { t, formatDate } = useI18n();
  const stageLabel = t(`tenant.timeline.stages.${project.currentStage}`);

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className={layout === "list" ? "grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" : "flex flex-col gap-4 p-5"}>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to="/manager/projects/$projectId"
                params={{ projectId: project.id }}
                className="block truncate text-base font-semibold text-foreground transition-colors hover:text-primary"
              >
                {project.name}
              </Link>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <User className="h-3 w-3" aria-hidden /> {project.clientName}
              </p>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden /> {project.address}
          </p>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("manager.projects.progress")}</span>
              <span className="font-semibold text-foreground">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <Badge variant="secondary" className="rounded-full">{stageLabel}</Badge>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" aria-hidden />
              {formatDate(project.expectedCompletion)}
            </span>
          </div>
          <div className="flex -space-x-1.5 pt-1">
            {project.team.slice(0, 4).map((id, i) => (
              <span
                key={id}
                title={id}
                className="grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-gradient-to-br from-primary/70 to-secondary text-[10px] font-bold text-primary-foreground"
                style={{ zIndex: 10 - i }}
              >
                {id.slice(-1).toUpperCase()}
              </span>
            ))}
            {project.team.length > 4 && (
              <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
                +{project.team.length - 4}
              </span>
            )}
          </div>
        </div>
        <Link
          to="/manager/projects/$projectId"
          params={{ projectId: project.id }}
          className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline sm:self-center"
        >
          {t("manager.projects.open")} <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
