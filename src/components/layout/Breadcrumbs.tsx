import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const SEGMENT_LABEL_KEY: Record<string, string> = {
  tenant: "roles.TENANT",
  manager: "roles.PROJECT_MANAGER",
  company: "roles.BUILDING_COMPANY",
  dashboard: "nav.dashboard",
  project: "nav.myProject",
  projects: "nav.projects",
  timeline: "nav.timeline",
  photos: "nav.photos",
  documents: "nav.documents",
  meetings: "nav.meetings",
  notifications: "nav.notifications",
  assistant: "nav.assistant",
  settings: "nav.settings",
  tasks: "nav.tasks",
  stages: "nav.stages",
  requests: "nav.requests",
};

const ROLE_HOME: Record<string, string> = {
  tenant: "/tenant/dashboard",
  manager: "/manager/dashboard",
  company: "/company/dashboard",
};

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t, dir } = useI18n();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const Chevron = () => (
    <ChevronRight
      className={`h-3.5 w-3.5 text-muted-foreground/60 ${dir === "rtl" ? "rotate-180" : ""}`}
      aria-hidden
    />
  );

  const homeHref = ROLE_HOME[segments[0]] ?? "/";

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      <Link
        to={homeHref}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("common.home")}</span>
      </Link>
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const key = SEGMENT_LABEL_KEY[seg];
        const label = key ? t(key) : seg;
        return (
          <span key={`${seg}-${idx}`} className="flex min-w-0 items-center gap-1.5">
            <Chevron />
            <span
              className={
                isLast
                  ? "truncate font-medium text-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
