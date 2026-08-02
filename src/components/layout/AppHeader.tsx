import { ArrowLeft, LogOut, Settings, UserRound, Globe, Check } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { NotificationsMenu } from "./NotificationsMenu";
import { Breadcrumbs } from "./Breadcrumbs";
import { IbysLogo } from "@/components/brand/IbysLogo";
import { useAuth } from "@/context/AuthProvider";
import { LANGUAGES, useI18n, type LangCode } from "@/lib/i18n/I18nProvider";
import { useNavigate, useRouter } from "@tanstack/react-router";

export function AppHeader() {
  const { user, logout } = useAuth();
  const { t, dir, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };

  const roleHome =
    user?.role === "TENANT"
      ? "/tenant/dashboard"
      : user?.role === "PROJECT_MANAGER"
      ? "/manager/dashboard"
      : user?.role === "BUILDING_COMPANY"
      ? "/company/dashboard"
      : "/";

  const settingsPath =
    user?.role === "TENANT"
      ? "/tenant/settings"
      : user?.role === "PROJECT_MANAGER"
      ? "/manager/settings"
      : user?.role === "BUILDING_COMPANY"
      ? "/company/settings"
      : "/settings";

  const handleBack = () => {
    const canGoBack =
      typeof window !== "undefined" && window.history.length > 1;
    if (canGoBack) {
      router.history.back();
    } else {
      navigate({ to: roleHome });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger aria-label={t("common.openMenu")} />
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("common.back")}
        onClick={handleBack}
        className="shrink-0"
      >
        <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} aria-hidden />
      </Button>
      <div className="flex items-center gap-2 md:hidden">
        <IbysLogo size={28} className="rounded-md shadow-sm" />
        <span className="text-sm font-bold tracking-wide text-foreground">{t("app.name")}</span>
      </div>
      <div className="hidden min-w-0 flex-1 md:block">
        <Breadcrumbs />
      </div>
      <div className="ms-auto flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher />
        <NotificationsMenu />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.profile")}
              className="gap-2"
            >
              <span
                className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary"
                aria-hidden
              >
                {(user?.name ?? "?").slice(0, 1).toUpperCase()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => navigate({ to: "/profile" })}
            >
              <UserRound className="h-4 w-4" aria-hidden />
              {t("common.profile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => navigate({ to: settingsPath })}
            >
              <Settings className="h-4 w-4" aria-hidden />
              {t("common.settings")}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Globe className="h-4 w-4" aria-hidden />
                {t("common.language")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-40">
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onSelect={() => setLang(l.code as LangCode)}
                    className="justify-between gap-2"
                  >
                    <span>{l.name}</span>
                    {l.code === lang && (
                      <Check className="h-4 w-4 text-primary" aria-hidden />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" aria-hidden />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
