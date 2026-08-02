import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";

export const Route = createFileRoute("/_authenticated/tenant/dashboard")({
  head: () => ({
    meta: [
      { title: "Tenant dashboard – IBYS" },
      { name: "description", content: "Tenant dashboard workspace overview." },
    ],
  }),
  component: () => (
    <RoleGuard allow="TENANT">
      <TenantDashboard />
    </RoleGuard>
  ),
});
