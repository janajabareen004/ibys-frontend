import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Elegant SVG chart placeholder. Renders a soft area/bar shape using tokens.
 * Not connected to real data — purely visual scaffolding.
 */
export function ChartPlaceholder({
  variant = "area",
  height = 160,
  className,
  label,
}: {
  variant?: "area" | "bars" | "donut";
  height?: number;
  className?: string;
  label?: string;
}) {
  const { t } = useI18n();
  const points = [30, 42, 35, 55, 48, 62, 58, 70, 66, 78, 72, 85];
  const bars = [40, 62, 50, 78, 66, 58, 82, 72];

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-3", className)}>
      {variant === "area" && (
        <svg viewBox={`0 0 ${points.length * 20} 100`} preserveAspectRatio="none" style={{ height, width: "100%" }} aria-hidden>
          <defs>
            <linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="text-primary">
            <polyline
              points={points.map((p, i) => `${i * 20},${100 - p}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <polygon
              points={`0,100 ${points.map((p, i) => `${i * 20},${100 - p}`).join(" ")} ${(points.length - 1) * 20},100`}
              fill="url(#chartArea)"
            />
          </g>
        </svg>
      )}
      {variant === "bars" && (
        <svg viewBox={`0 0 ${bars.length * 20} 100`} preserveAspectRatio="none" style={{ height, width: "100%" }} aria-hidden>
          <g className="text-primary">
            {bars.map((b, i) => (
              <rect key={i} x={i * 20 + 3} y={100 - b} width="14" height={b} rx="3" fill="currentColor" opacity={0.75} />
            ))}
          </g>
        </svg>
      )}
      {variant === "donut" && (
        <svg viewBox="0 0 100 100" style={{ height, width: "100%" }} aria-hidden>
          <circle cx="50" cy="50" r="38" strokeWidth="12" className="fill-none stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r="38"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 38}
            strokeDashoffset={2 * Math.PI * 38 * 0.28}
            transform="rotate(-90 50 50)"
            className="fill-none stroke-primary"
          />
        </svg>
      )}
      <div className="pointer-events-none absolute inset-0 grid place-items-end p-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label ?? t("manager.charts.placeholder")}
      </div>
    </div>
  );
}
