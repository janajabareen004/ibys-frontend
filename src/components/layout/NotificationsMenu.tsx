import { Bell, Image, CalendarClock, Layers, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Sample = {
  key: string;
  icon: typeof Bell;
  tone: "info" | "success" | "warning";
  minutes: number;
};

const SAMPLES: Sample[] = [
  { key: "photo", icon: Image, tone: "success", minutes: 12 },
  { key: "meeting", icon: CalendarClock, tone: "info", minutes: 60 },
  { key: "stage", icon: Layers, tone: "info", minutes: 3 * 60 },
  { key: "delay", icon: AlertTriangle, tone: "warning", minutes: 26 * 60 },
  { key: "document", icon: FileText, tone: "info", minutes: 2 * 24 * 60 },
];

const TONE_CLASS: Record<Sample["tone"], string> = {
  info: "bg-secondary/10 text-secondary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function NotificationsMenu() {
  const { t } = useI18n();

  const formatWhen = (m: number) => {
    if (m < 60) return t("notif.time.minutesAgo", { n: m });
    if (m < 60 * 24) return t("notif.time.hoursAgo", { n: Math.round(m / 60) });
    return t("notif.time.daysAgo", { n: Math.round(m / (60 * 24)) });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("common.notifications")}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-sm font-semibold text-foreground">{t("notif.title")}</span>
          <button className="text-xs font-medium text-primary hover:underline">
            {t("notif.viewAll")}
          </button>
        </div>
        <ul className="max-h-96 overflow-y-auto py-1">
          {SAMPLES.map((s) => (
            <li key={s.key}>
              <button className="flex w-full items-start gap-3 px-3 py-2.5 text-start hover:bg-muted/60">
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONE_CLASS[s.tone]}`}
                >
                  <s.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {t(`notif.samples.${s.key}`)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {formatWhen(s.minutes)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
