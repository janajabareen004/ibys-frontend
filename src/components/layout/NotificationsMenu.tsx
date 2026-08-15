import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CalendarClock,
  Hammer,
  ClipboardList,
  Inbox,
  UploadCloud,
  FileText,
  Cog,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth, notificationPathForRole } from "@/context/AuthProvider";
import { useHeaderNotifications, type HeaderNotification } from "@/hooks/useHeaderNotifications";

const RECENT_LIMIT = 5;

// Covers every real category value across the three roles' notification
// tables (project/task/meeting/construction/system/request/upload/documents).
// An unrecognized/missing category safely falls back to the generic bell.
const CATEGORY_ICON: Record<string, typeof Bell> = {
  project: Building2,
  task: ClipboardList,
  meeting: CalendarClock,
  construction: Hammer,
  system: Cog,
  request: Inbox,
  upload: UploadCloud,
  documents: FileText,
};

export function NotificationsMenu() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const { data, loading, error } = useHeaderNotifications();

  const recent = React.useMemo<HeaderNotification[]>(() => {
    return [...(data ?? [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, RECENT_LIMIT);
  }, [data]);
  const hasUnread = (data ?? []).some((n) => !n.read);

  const formatWhen = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
    if (m < 60) return t("notif.time.minutesAgo", { n: m });
    if (m < 60 * 24) return t("notif.time.hoursAgo", { n: Math.round(m / 60) });
    return t("notif.time.daysAgo", { n: Math.round(m / (60 * 24)) });
  };

  const viewAll = () => {
    setOpen(false);
    if (user) navigate({ to: notificationPathForRole(user.role) });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("common.notifications")}
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-sm font-semibold text-foreground">{t("notif.title")}</span>
          <button type="button" onClick={viewAll} className="text-xs font-medium text-primary hover:underline">
            {t("notif.viewAll")}
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("common.loading")}
          </div>
        ) : error ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t("common.error")}</p>
        ) : recent.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t("notif.empty")}</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto py-1">
            {recent.map((n) => {
              const Icon = CATEGORY_ICON[n.category] ?? Bell;
              return (
                <li key={n.id}>
                  <div className="flex w-full items-start gap-3 px-3 py-2.5 text-start">
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{n.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{formatWhen(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
