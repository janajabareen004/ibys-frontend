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
      <SidebarContent>
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
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary"
              aria-hidden
            >
              {(user.name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">
                {user.name}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/70">
                {t(`roles.${user.role}`)}
              </div>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
