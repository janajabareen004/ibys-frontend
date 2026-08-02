import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  CalendarClock,
  Bell,
  Camera,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export type SectionNavItem = {
  id: string;
  labelKey: string;
  icon: LucideIcon;
};

type Props = {
  items: SectionNavItem[];
};

export function SectionNav({ items }: Props) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const elements = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // account for sticky header (~56px) + this nav (~52px)
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Section navigation"
      className="sticky top-14 z-20 -mx-4 border-b border-border bg-background/95 backdrop-blur sm:-mx-6"
    >
      <div className="flex gap-1 overflow-x-auto px-3 py-2 sm:px-4 [scrollbar-width:thin]">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="whitespace-nowrap">{t(item.labelKey)}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export const TENANT_DASHBOARD_SECTIONS: SectionNavItem[] = [
  { id: "section-quick-actions", labelKey: "tenant.stats.quickActions", icon: Sparkles },
  { id: "section-timeline", labelKey: "tenant.sections.timelinePreview", icon: CalendarClock },
  { id: "section-meetings", labelKey: "tenant.sections.upcomingMeetings", icon: CalendarClock },
  { id: "section-notifications", labelKey: "tenant.sections.notifications", icon: Bell },
  { id: "section-photos", labelKey: "tenant.sections.recentPhotos", icon: Camera },
  { id: "section-comments", labelKey: "tenant.sections.recentComments", icon: MessageSquare },
  { id: "section-updates", labelKey: "tenant.sections.latestUpdates", icon: Sparkles },
  { id: "section-assistant", labelKey: "tenant.sections.aiPreview", icon: Sparkles },
];
