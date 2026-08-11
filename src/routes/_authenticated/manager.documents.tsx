import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { DocumentsManager } from "@/components/manager/DocumentsManager";

export const Route = createFileRoute("/_authenticated/manager/documents")({
  head: () => ({
    meta: [
      { title: "Documents – IBYS Manager" },
      { name: "description", content: "Contracts, permits, drawings, reports and invoices." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <DocumentsManager />
    </RoleGuard>
  );
}
