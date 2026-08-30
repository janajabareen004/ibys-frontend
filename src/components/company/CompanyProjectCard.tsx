import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompanyProjectStatusBadge } from "./CompanyProjectStatusBadge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { translateCompanyProject } from "@/lib/i18n/projectI18n";
import type { CompanyProject } from "@/mocks/mockCompanyService";
import { MapPin, User, Calendar, Image as ImageIcon, FileText, Pencil } from "lucide-react";

export function CompanyProjectCard({
  project: raw,
  layout = "grid",
  onEdit,
}: {
  project: CompanyProject;
  layout?: "grid" | "list";
  /** Opens the edit dialog for this project. Omitted entirely if the button should not render. */
  onEdit?: () => void;
}) {
  const { t, formatDate } = useI18n();
  const project = translateCompanyProject(t, raw);
  const stageLabel = t(`tenant.timeline.stages.${project.currentStage}`);
  const managerLine = [project.projectManager, project.clientName].filter((s) => s.trim()).join(" · ");

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to="/company/projects/$projectId" params={{ projectId: project.id }} className="block truncate text-base font-semibold text-foreground transition-colors hover:text-primary">
                {project.name}
              </Link>
              {managerLine ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <User className="h-3 w-3" aria-hidden /> {managerLine}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <CompanyProjectStatusBadge status={project.status} />
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  aria-label={t("company.pm.common.edit")}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden /> {project.address}
          </p>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("company.projects.progress")}</span>
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
            <span className="flex items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-3 w-3" aria-hidden /> {project.photosCount}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" aria-hidden /> {project.documentsCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
