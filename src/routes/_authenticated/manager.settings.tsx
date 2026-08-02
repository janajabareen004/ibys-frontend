import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { SettingsView } from "@/components/settings/SettingsView";

export const Route = createFileRoute("/_authenticated/manager/settings")({
  head: () => ({
    meta: [
      { title: "Settings – IBYS" },
      { name: "description", content: "Settings for the project manager workspace." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <SettingsView />
    </RoleGuard>
  );
}
