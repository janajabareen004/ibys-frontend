import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { CompanyDashboard } from "@/components/dashboard/CompanyDashboard";

export const Route = createFileRoute("/_authenticated/company/dashboard")({
  head: () => ({
    meta: [
      { title: "Building company dashboard – IBYS" },
      { name: "description", content: "Building company dashboard workspace overview." },
    ],
  }),
  component: () => (
    <RoleGuard allow="BUILDING_COMPANY">
      <CompanyDashboard />
    </RoleGuard>
  ),
});
