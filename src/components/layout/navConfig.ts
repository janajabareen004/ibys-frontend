import {
  LayoutDashboard,
  Building2,
  CalendarClock,
  Bell,
  ClipboardList,
  FileBarChart,
  Upload,
  Inbox,
  FolderKanban,
  Image,
  FileText,
  Sparkles,
  Settings,
  Layers,
  Users,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/api/authApi";

export type NavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
};

export type NavSection = {
  labelKey: string;
  items: NavItem[];
};

export const NAV_SECTIONS_BY_ROLE: Record<Role, NavSection[]> = {
  TENANT: [
    {
      labelKey: "sections.workspace",
      items: [
        { to: "/tenant/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
        { to: "/tenant/project", labelKey: "nav.myProject", icon: Building2 },
        { to: "/tenant/timeline", labelKey: "nav.timeline", icon: CalendarClock },
        { to: "/tenant/photos", labelKey: "nav.photos", icon: Image },
        { to: "/tenant/documents", labelKey: "nav.documents", icon: FileText },
        { to: "/tenant/meetings", labelKey: "nav.meetings", icon: CalendarClock },
        { to: "/tenant/requests", labelKey: "nav.requests", icon: Inbox },
        { to: "/tenant/notifications", labelKey: "nav.notifications", icon: Bell },
        { to: "/tenant/assistant", labelKey: "nav.assistant", icon: Sparkles },
      ],
    },
    {
      labelKey: "sections.account",
      items: [{ to: "/tenant/settings", labelKey: "nav.settings", icon: Settings }],
    },
  ],
  PROJECT_MANAGER: [
    {
      labelKey: "sections.workspace",
      items: [
        { to: "/manager/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
        { to: "/manager/projects", labelKey: "nav.projects", icon: FolderKanban },
        { to: "/manager/tasks", labelKey: "nav.tasks", icon: ClipboardList },
        { to: "/manager/stages", labelKey: "nav.stages", icon: Layers },
        { to: "/manager/photos", labelKey: "nav.uploadPhotos", icon: Image },
        { to: "/manager/documents", labelKey: "nav.uploadDocuments", icon: FileText },
        { to: "/manager/upload", labelKey: "manager.nav.upload", icon: UploadCloud },
        { to: "/manager/meetings", labelKey: "nav.meetings", icon: CalendarClock },
        { to: "/manager/requests", labelKey: "nav.tenantRequests", icon: Inbox },
        { to: "/manager/team", labelKey: "manager.nav.team", icon: Users },
        { to: "/manager/activity", labelKey: "manager.nav.activity", icon: Bell },
        { to: "/manager/reports", labelKey: "nav.reports", icon: FileBarChart },
        { to: "/manager/notifications", labelKey: "nav.notifications", icon: Bell },
        { to: "/manager/assistant", labelKey: "manager.nav.assistant", icon: Sparkles },
        { to: "/manager/search", labelKey: "manager.nav.search", icon: FileText },
      ],
    },
    {
      labelKey: "sections.account",
      items: [{ to: "/manager/settings", labelKey: "nav.settings", icon: Settings }],
    },
  ],

  BUILDING_COMPANY: [
    {
      labelKey: "sections.workspace",
      items: [
        { to: "/company/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
        { to: "/company/projects", labelKey: "nav.projects", icon: FolderKanban },
        { to: "/company/managers", labelKey: "company.nav.managers", icon: Users },
        { to: "/company/tenants", labelKey: "company.nav.tenants", icon: Users },
        { to: "/company/apartments", labelKey: "company.nav.apartments", icon: Layers },
        { to: "/company/stages", labelKey: "nav.stageUpdates", icon: Layers },
        { to: "/company/documents", labelKey: "nav.uploadDocuments", icon: UploadCloud },
        { to: "/company/meetings", labelKey: "nav.meetings", icon: CalendarClock },
        { to: "/company/requests", labelKey: "nav.requests", icon: Inbox },
        { to: "/company/team", labelKey: "company.nav.team", icon: Users },
        { to: "/company/activity", labelKey: "company.nav.activity", icon: Bell },
        { to: "/company/notifications", labelKey: "nav.notifications", icon: Bell },
        { to: "/company/assistant", labelKey: "nav.assistant", icon: Sparkles },
        { to: "/company/search", labelKey: "company.nav.search", icon: FileText },
      ],
    },
    {
      labelKey: "sections.account",
      items: [{ to: "/company/settings", labelKey: "nav.settings", icon: Settings }],
    },
  ],


};

// Back-compat: flat list per role.
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  TENANT: NAV_SECTIONS_BY_ROLE.TENANT.flatMap((s) => s.items),
  PROJECT_MANAGER: NAV_SECTIONS_BY_ROLE.PROJECT_MANAGER.flatMap((s) => s.items),
  BUILDING_COMPANY: NAV_SECTIONS_BY_ROLE.BUILDING_COMPANY.flatMap((s) => s.items),
};
