import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantPhotos, useTenantStages } from "@/hooks/useTenantData";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { Photo } from "@/mocks/mockTenantService";

export const Route = createFileRoute("/_authenticated/tenant/photos")({
  head: () => ({
    meta: [
      { title: "Photos – IBYS" },
      { name: "description", content: "Latest on-site photos from your project." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data: photos } = useTenantPhotos();
  const { data: stages } = useTenantStages();
  const [query, setQuery] = React.useState("");
  // Selected stage is tracked by the stage id ("all" = show every photo).
  const [stage, setStage] = React.useState<string>("all");
  const [preview, setPreview] = React.useState<Photo | null>(null);

  const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

  // Guard date formatting: an empty/invalid date must never throw and blank the
  // whole grid, so newly uploaded photos always render even without a valid date.
  const safeFormatDate = (value: string, opts?: Intl.DateTimeFormatOptions) => {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : formatDate(d, opts);
  };

  // A photo's `stageId` carries the backend image `stage` value, which may be
  // either the canonical stage id or the stage's display name. Match against both
  // so filtering works regardless of which representation the backend sends.
  const selectedStage = stage === "all" ? null : (stages?.find((s) => s.id === stage) ?? null);

  const filtered = (photos ?? []).filter((p) => {
    const photoStage = normalize(p.stageId);
    const stageOk =
      stage === "all" ||
      (selectedStage
        ? photoStage === normalize(selectedStage.id) ||
          photoStage === normalize(selectedStage.nameKey)
        : photoStage === normalize(stage));
    const searchOk = query === "" || p.title.toLowerCase().includes(query.toLowerCase());
    return stageOk && searchOk;
  });

  return (
    <RoleGuard allow="TENANT">
      <PageHeader title={t("pages.photos.title")} description={t("pages.photos.description")} />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder={t("tenant.photos.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={stage === "all"} onClick={() => setStage("all")}>{t("tenant.photos.all")}</FilterChip>
            {stages?.map((s) => (
              <FilterChip key={s.id} active={stage === s.id} onClick={() => setStage(s.id)}>{t(s.nameKey)}</FilterChip>
            ))}
          </div>
        </CardContent>
      </Card>

      {!photos ? (
        <InlineLoader />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("tenant.photos.empty")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const stageName = stages?.find((s) => s.id === p.stageId);
            const idx = p.id.split("-p")[1] ?? "";
            const displayTitle = stageName ? `${t(stageName.nameKey)} #${idx}` : p.title;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreview(p)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.url} alt={displayTitle} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{displayTitle}</div>
                    {stageName && <Badge variant="outline" className="shrink-0 text-[10px]">{t(stageName.nameKey)}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("tenant.photos.uploadedBy")} <strong className="text-foreground">{p.uploadedBy}</strong> {t("tenant.photos.on")} {safeFormatDate(p.uploadedAt)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          {preview && (
            <div>
              <img src={preview.url} alt={preview.title} className="max-h-[70vh] w-full object-contain bg-black" />
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="text-base font-semibold">{(() => { const s = stages?.find((x) => x.id === preview.stageId); const idx = preview.id.split("-p")[1] ?? ""; return s ? `${t(s.nameKey)} #${idx}` : preview.title; })()}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("tenant.photos.uploadedBy")} {preview.uploadedBy} · {safeFormatDate(preview.uploadedAt, { dateStyle: "long" })}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setPreview(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
