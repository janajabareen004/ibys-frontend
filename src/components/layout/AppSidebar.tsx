import { Link, useRouterState } from "@tanstack/react-router";
import { IbysLogo } from "@/components/brand/IbysLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_SECTIONS_BY_ROLE } from "./navConfig";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** Build up to two uppercase initials from a display name (e.g. "Daniel Levi" -> "DL"). */
function initialsFrom(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar() {
  const { user } = useAuth();
  const { t, dir } = useI18n();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  if (!user) return null;
  const sections = NAV_SECTIONS_BY_ROLE[user.role];

  const roleLabel = t(`roles.${user.role}`);
  const displayName = user.name?.trim() ? user.name.trim() : "";
  // Primary line shows the real display name; fall back to the role label when
  // the profile name is missing. The secondary line only shows the role when we
  // actually have a name (avoids showing the role label twice).
  const primaryText = displayName || roleLabel;
  const avatarInitials = initialsFrom(displayName || roleLabel);

  return (
    <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <IbysLogo size={36} className="shrink-0 rounded-lg shadow-sm" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">
                {t("app.name")}
              </div>
              <div className="truncate text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
                {t("app.tagline")}
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="sidebar-scroll">
        {sections.map((section) => (
          <SidebarGroup key={section.labelKey}>
            <SidebarGroupLabel>{t(section.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.to;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.labelKey)}>
                        <Link to={item.to} onClick={handleNavClick} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" aria-hidden />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {!collapsed && (
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-xs font-bold text-primary"
              aria-hidden
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                avatarInitials
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">
                {primaryText}
              </div>
              {displayName && (
                <div className="truncate text-xs text-sidebar-foreground/70">
                  {roleLabel}
                </div>
              )}
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
