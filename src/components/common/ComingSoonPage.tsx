import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, ArrowRight, BellRing, CheckCircle2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth, dashboardPathForRole } from "@/context/AuthProvider";

export type ComingSoonPageProps = {
  /** Page title, e.g. "Settings" */
  title: string;
  /** Short description explaining the page purpose */
  description?: string;
  /** Large Lucide icon representing the page */
  icon?: LucideIcon | ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Optional list of planned feature translation keys (or plain strings) */
  features?: string[];
  /** Override the back-to-dashboard link (defaults to the current user's dashboard) */
  backTo?: string;
};

export function ComingSoonPage({
  title,
  description,
  icon: Icon = Sparkles,
  features,
  backTo,
}: ComingSoonPageProps) {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const dashboardPath = backTo ?? (user ? dashboardPathForRole(user.role) : "/");
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const plannedFeatures =
    features ?? [
      t("comingSoon.features.modernInterface"),
      t("comingSoon.features.realtime"),
      t("comingSoon.features.apiIntegration"),
      t("comingSoon.features.secureAccess"),
      t("comingSoon.features.responsive"),
    ];

  const handleNotify = () => {
    toast.success(t("comingSoon.toast"), { icon: <BellRing className="h-4 w-4" aria-hidden /> });
  };

  return (
    <section
      className="flex w-full items-start justify-center py-8 sm:py-12 animate-fade-in"
      aria-labelledby="coming-soon-title"
    >
      <Card className="relative w-full max-w-[700px] overflow-hidden rounded-3xl border-border/60 bg-card shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent"
        />
        <CardContent className="relative flex flex-col items-center gap-8 p-8 text-center sm:p-14">
          <div className="absolute end-6 top-6">
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t("comingSoon.badge")}
            </Badge>
          </div>

          <div
            aria-hidden
            className="relative mt-6 grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 ring-1 ring-border shadow-inner"
          >
            <div className="absolute inset-3 rounded-2xl border border-dashed border-border/70" />
            <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
              <Icon className="h-8 w-8 text-primary" aria-hidden />
            </div>
          </div>

          <header className="space-y-3">
            <h1 id="coming-soon-title" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">{description}</p>
            ) : null}
            <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
              {t("comingSoon.body")}
            </p>
          </header>

          <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={handleNotify}
              className="w-full gap-2 transition-transform hover:-translate-y-0.5 hover:shadow-md sm:w-auto"
            >
              <BellRing className="h-4 w-4" aria-hidden />
              {t("comingSoon.primary")}
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full gap-2 transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              <Link to={dashboardPath} aria-label={t("comingSoon.secondary")}>
                <BackIcon className="h-4 w-4" aria-hidden />
                {t("comingSoon.secondary")}
              </Link>
            </Button>
          </div>

          <div className="w-full rounded-2xl border border-border/60 bg-muted/40 p-5 text-start sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">{t("comingSoon.plannedTitle")}</h2>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {plannedFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default ComingSoonPage;
