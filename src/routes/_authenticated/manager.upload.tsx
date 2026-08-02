import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { UploadDropzone } from "@/components/company/UploadDropzone";
import { SectionCard } from "@/components/manager/SectionCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const onFiles = (files: FileList) => {
    toast.success(t("manager.pm.toasts.uploaded"), { description: `${files.length} file(s)` });
  };

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader
        title={t("manager.upload.title")}
        description={t("manager.upload.description")}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title={t("nav.uploadPhotos")}
          description={t("manager.upload.photoHint")}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/manager/photos">{t("common.viewAll")}</Link>
            </Button>
          }
        >
          <UploadDropzone label={t("manager.upload.dropPhotos")} onFiles={onFiles} />
        </SectionCard>
        <SectionCard
          title={t("nav.uploadDocuments")}
          description={t("manager.upload.documentHint")}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/manager/documents">{t("common.viewAll")}</Link>
            </Button>
          }
        >
          <UploadDropzone label={t("manager.upload.dropDocuments")} onFiles={onFiles} />
        </SectionCard>
      </div>
    </RoleGuard>
  );
}
