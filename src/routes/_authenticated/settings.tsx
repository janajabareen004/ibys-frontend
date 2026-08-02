import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/components/settings/SettingsView";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings – IBYS" },
      { name: "description", content: "Manage notifications, language and theme preferences." },
    ],
  }),
  component: SettingsView,
});
