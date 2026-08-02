import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "./PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type PlaceholderPageProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  backTo?: string;
};

export function PlaceholderPage({ title, description, icon, backTo = "/" }: PlaceholderPageProps) {
  const { t } = useI18n();
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("placeholder.comingSoon")}
          </Badge>
        }
      />
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="relative grid h-32 w-32 place-items-center rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 ring-1 ring-border"
          >
            <div className="absolute inset-3 rounded-2xl border border-dashed border-border/70" />
            <div className="relative grid h-14 w-14 place-items-center rounded-xl bg-background shadow-sm ring-1 ring-border">
              {icon ?? <Wrench className="h-6 w-6 text-primary" aria-hidden />}
            </div>
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{t("placeholder.comingSoon")}</h2>
            <p className="text-sm text-muted-foreground">{t("placeholder.body")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="lg">{t("placeholder.primary")}</Button>
            <Button asChild variant="outline" size="lg">
              <Link to={backTo}>{t("placeholder.secondary")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
