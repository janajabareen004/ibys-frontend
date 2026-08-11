import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotosManager } from "@/components/manager/PhotosManager";
import { DocumentsManager } from "@/components/manager/DocumentsManager";
import { Image, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manager/upload")({
  head: () => ({
    meta: [
      { title: "Upload center – IBYS Manager" },
      { name: "description", content: "Upload photos and documents across your projects." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const [tab, setTab] = React.useState<"photos" | "documents">("photos");

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.upload.title")}
        description={t("manager.upload.description")}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "photos" | "documents")}>
        <TabsList className="mb-4">
          <TabsTrigger value="photos" className="gap-1.5">
            <Image className="h-4 w-4" aria-hidden />
            {t("nav.photos")}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" aria-hidden />
            {t("nav.documents")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <PhotosManager showHeader={false} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsManager showHeader={false} />
        </TabsContent>
      </Tabs>
    </RoleGuard>
  );
}
