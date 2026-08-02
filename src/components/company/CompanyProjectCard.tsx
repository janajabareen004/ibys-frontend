import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CompanyProjectStatusBadge } from "./CompanyProjectStatusBadge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { translateCompanyProject } from "@/lib/i18n/projectI18n";
import type { CompanyProject } from "@/mocks/mockCompanyService";
import { MapPin, User, Calendar, Image as ImageIcon, FileText, ArrowRight } from "lucide-react";

export function CompanyProjectCard({ project: raw, layout = "grid" }: { project: CompanyProject; layout?: "grid" | "list" }) {
  const { t, formatDate } = useI18n();
  const project = translateCompanyProject(t, raw);
  const stageLabel = t(`tenant.timeline.stages.${project.currentStage}`);

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className={layout === "list" ? "grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" : "flex flex-col gap-4 p-5"}>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to="/company/projects/$projectId" params={{ projectId: project.id }} className="block truncate text-base font-semibold text-foreground transition-colors hover:text-primary">
                {project.name}
              </Link>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <User className="h-3 w-3" aria-hidden /> {project.projectManager} · {project.clientName}
              </p>
            </div>
            <CompanyProjectStatusBadge status={project.status} />
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
        <Link to="/company/projects/$projectId" params={{ projectId: project.id }} className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline sm:self-center">
          {t("company.projects.open")} <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
