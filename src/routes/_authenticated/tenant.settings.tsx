import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { SettingsView } from "@/components/settings/SettingsView";

export const Route = createFileRoute("/_authenticated/tenant/settings")({
  head: () => ({
    meta: [
      { title: "Settings – IBYS" },
      { name: "description", content: "Settings for the tenant workspace." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <RoleGuard allow="TENANT">
      <SettingsView />
    </RoleGuard>
  );
}
