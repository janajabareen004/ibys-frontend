import type { ReactNode } from "react";

/**
 * Shared hero banner for Building Company feature pages. Visual reference:
 * the approved Building Company → Projects hero. An image fills a top
 * banner (~180–220px on desktop) behind the title/subtitle/optional primary
 * action, with a strong light/teal overlay for legibility. Everything else
 * on the page (filters, tabs, tables, cards, empty states, dialogs) stays
 * below this banner on the normal page background.
 */
export function CompanyPageHero({
  title,
  subtitle,
  image,
  action,
}: {
  title: string;
  subtitle?: string;
  image: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative isolate mb-4 min-h-[160px] overflow-hidden rounded-2xl sm:mb-6 sm:min-h-[200px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Strong light/teal overlay so the title, subtitle and action button stay clearly readable; the image is decorative only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(1 0 0 / 0.8) 0%, oklch(1 0 0 / 0.86) 100%), radial-gradient(120% 100% at 50% 0%, color-mix(in oklch, var(--primary) 20%, transparent) 0%, transparent 75%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-5 sm:min-h-[200px] sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
