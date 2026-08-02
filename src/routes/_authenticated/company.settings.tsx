import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { SettingsView } from "@/components/settings/SettingsView";

export const Route = createFileRoute("/_authenticated/company/settings")({
  head: () => ({
    meta: [
      { title: "Settings – IBYS" },
      { name: "description", content: "Settings for the building company workspace." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <SettingsView />
    </RoleGuard>
  );
}
