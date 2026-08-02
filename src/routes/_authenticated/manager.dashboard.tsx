import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";

export const Route = createFileRoute("/_authenticated/manager/dashboard")({
  head: () => ({
    meta: [
      { title: "Project manager dashboard – IBYS" },
      { name: "description", content: "Project manager dashboard workspace overview." },
    ],
  }),
  component: () => (
    <RoleGuard allow="PROJECT_MANAGER">
      <ManagerDashboard />
    </RoleGuard>
  ),
});
