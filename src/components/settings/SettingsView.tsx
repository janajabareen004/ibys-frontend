import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarClock,
  ClipboardList,
  Globe,
  Mail,
  Moon,
  Palette,
  Sun,
  Sunrise,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth, dashboardPathForRole } from "@/context/AuthProvider";
import { useI18n, LANGUAGES, type LangCode } from "@/lib/i18n/I18nProvider";
import {
  applyTheme,
  useUserSettings,
  type ThemePreference,
} from "@/lib/userSettings";

export function SettingsView() {
  const { user } = useAuth();
  const { t, dir, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const { settings, update } = useUserSettings(user?.id);

  React.useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const dashboardPath = user ? dashboardPathForRole(user.role) : "/";

  const setTheme = (theme: ThemePreference) => {
    update({ theme });
    applyTheme(theme);
    toast.success(t("settings.toasts.themeSaved"));
  };

  const toggleNotification = (
    key: "emailNotifications" | "meetingReminders" | "projectUpdates",
    value: boolean,
  ) => {
    update({ [key]: value });
    toast.success(t("settings.toasts.saved"));
  };

  const handleLangChange = (code: LangCode) => {
    setLang(code);
    toast.success(t("settings.toasts.languageSaved"));
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-32 pt-4 sm:px-6 sm:pb-12 sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: dashboardPath })}
          className="shrink-0 gap-2 min-h-11 px-3"
        >
          <BackIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{t("common.back")}</span>
        </Button>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" aria-hidden />
            {t("settings.sections.notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          <ToggleRow
            icon={<Mail className="h-4 w-4 text-muted-foreground" aria-hidden />}
            title={t("settings.notif.emailTitle")}
            description={t("settings.notif.emailDesc")}
            checked={settings.emailNotifications}
            onChange={(v) => toggleNotification("emailNotifications", v)}
          />
          <ToggleRow
            icon={<CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />}
            title={t("settings.notif.meetingsTitle")}
            description={t("settings.notif.meetingsDesc")}
            checked={settings.meetingReminders}
            onChange={(v) => toggleNotification("meetingReminders", v)}
          />
          <ToggleRow
            icon={<ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden />}
            title={t("settings.notif.updatesTitle")}
            description={t("settings.notif.updatesDesc")}
            checked={settings.projectUpdates}
            onChange={(v) => toggleNotification("projectUpdates", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" aria-hidden />
            {t("settings.sections.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="radiogroup"
            aria-label={t("settings.sections.language")}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {LANGUAGES.map((l) => {
              const selected = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleLangChange(l.code as LangCode)}
                  className={`flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-lg border p-4 text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{l.name}</div>
                    <div className="text-xs uppercase text-muted-foreground">
                      {l.code} · {l.dir.toUpperCase()}
                    </div>
                  </div>
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                      selected ? "border-primary" : "border-muted-foreground/40"
                    }`}
                    aria-hidden
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" aria-hidden />
            {t("settings.sections.theme")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([
              { code: "light" as const, label: t("settings.theme.light"), Icon: Sun },
              { code: "dark" as const, label: t("settings.theme.dark"), Icon: Moon },
              { code: "system" as const, label: t("settings.theme.system"), Icon: Sunrise },
            ]).map(({ code, label, Icon }) => {
              const selected = settings.theme === code;
              return (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(code)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-lg border p-4 text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} className="shrink-0" />
    </div>
  );
}
