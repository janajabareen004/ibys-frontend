import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PhotosManager } from "@/components/manager/PhotosManager";

export const Route = createFileRoute("/_authenticated/manager/photos")({
  head: () => ({
    meta: [
      { title: "Site photos – IBYS Manager" },
      { name: "description", content: "Site photos organised by project and construction stage." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PhotosManager />
    </RoleGuard>
  );
}
