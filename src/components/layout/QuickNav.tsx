import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  CalendarClock,
  Image,
  FileText,
  Inbox,
  FolderKanban,
  ClipboardList,
  Layers,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { Role } from "@/api/authApi";

type QuickNavItem = { to: string; labelKey: string; icon: LucideIcon };

const ITEMS_BY_ROLE: Record<Role, QuickNavItem[]> = {
  TENANT: [
    { to: "/tenant/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { to: "/tenant/project", labelKey: "nav.myProject", icon: Building2 },
    { to: "/tenant/timeline", labelKey: "nav.timeline", icon: CalendarClock },
    { to: "/tenant/photos", labelKey: "nav.photos", icon: Image },
    { to: "/tenant/documents", labelKey: "nav.documents", icon: FileText },
    { to: "/tenant/meetings", labelKey: "nav.meetings", icon: CalendarClock },
    { to: "/tenant/requests", labelKey: "nav.requests", icon: Inbox },
  ],
  PROJECT_MANAGER: [
    { to: "/manager/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { to: "/manager/projects", labelKey: "nav.projects", icon: FolderKanban },
    { to: "/manager/tasks", labelKey: "nav.tasks", icon: ClipboardList },
    { to: "/manager/stages", labelKey: "nav.stages", icon: Layers },
    { to: "/manager/photos", labelKey: "nav.uploadPhotos", icon: Image },
    { to: "/manager/documents", labelKey: "nav.uploadDocuments", icon: FileText },
    { to: "/manager/upload", labelKey: "manager.nav.upload", icon: UploadCloud },
    { to: "/manager/meetings", labelKey: "nav.meetings", icon: CalendarClock },
    { to: "/manager/requests", labelKey: "nav.tenantRequests", icon: Inbox },
  ],
  BUILDING_COMPANY: [
    { to: "/company/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { to: "/company/projects", labelKey: "nav.projects", icon: FolderKanban },
    { to: "/company/stages", labelKey: "nav.stageUpdates", icon: Layers },
    { to: "/company/documents", labelKey: "nav.uploadDocuments", icon: FileText },
    { to: "/company/meetings", labelKey: "nav.meetings", icon: CalendarClock },
    { to: "/company/requests", labelKey: "nav.requests", icon: Inbox },
  ],

};

export function QuickNav() {
  const { user } = useAuth();
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return null;
  // Dashboard routes render their own in-page section navigation instead of this toolbar.
  if (pathname.endsWith("/dashboard")) return null;
  const items = ITEMS_BY_ROLE[user.role];
  if (!items?.length) return null;

  return (
    <nav
      aria-label="Quick navigation"
      className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur"
    >
      <div className="flex gap-1 overflow-x-auto px-3 py-2 sm:px-4 [scrollbar-width:thin]">
        {items.map((item) => {
          const isActive =
            pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="whitespace-nowrap">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
