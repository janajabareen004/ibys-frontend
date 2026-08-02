import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "./PageHeader";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Role } from "@/api/authApi";

export function RolePlaceholderDashboard({ role }: { role: Role }) {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();

  return (
    <>
      <PageHeader
        title={t("dashboard.welcome", { name: user?.name ?? "" })}
        description={formatDate(new Date(), { dateStyle: "full" })}
        actions={<Badge variant="secondary">{t(`roles.${role}`)}</Badge>}
      />
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">{t("dashboard.roleLabel")}</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{t(`roles.${role}`)}</div>
          <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.placeholder")}</p>
        </CardContent>
      </Card>
    </>
  );
}
