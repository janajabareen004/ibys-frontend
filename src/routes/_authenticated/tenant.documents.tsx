import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Download, FileText } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTenantDocuments } from "@/hooks/useTenantData";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineLoader } from "@/components/tenant/InlineLoader";
import type { Doc } from "@/mocks/mockTenantService";

const CATEGORIES: Array<Doc["category"] | "all"> = ["all", "contract", "permit", "drawing", "report", "invoice"];

export const Route = createFileRoute("/_authenticated/tenant/documents")({
  head: () => ({
    meta: [
      { title: "Documents – IBYS" },
      { name: "description", content: "Contracts, permits and reports shared with you." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t, formatDate } = useI18n();
  const { data: docs } = useTenantDocuments();
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState<Doc["category"] | "all">("all");

  const filtered = (docs ?? []).filter(
    (d) =>
      (cat === "all" || d.category === cat) &&
      (query === "" || d.name.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <RoleGuard allow="TENANT">
      <PageHeader title={t("pages.documents.title")} description={t("pages.documents.description")} />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input placeholder={t("tenant.documents.search")} value={query} onChange={(e) => setQuery(e.target.value)} className="ps-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {c === "all" ? t("tenant.documents.all") : t(`tenant.documents.categories.${c}`)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!docs ? (
        <InlineLoader />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("tenant.documents.empty")} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_100px_120px] items-center gap-3 border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
              <span>{t("tenant.documents.name")}</span>
              <span>{t("tenant.documents.category")}</span>
              <span>{t("tenant.documents.date")}</span>
              <span>{t("tenant.documents.size")}</span>
              <span className="text-end">{t("tenant.documents.download")}</span>
            </div>
            <ul>
              {filtered.map((d) => (
                <li key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 md:grid-cols-[minmax(0,1fr)_140px_120px_100px_120px]">
                  <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{d.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {t(`tenant.documents.categories.${d.category}`)} · {formatDate(d.updatedAt)} · {d.size}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block"><Badge variant="secondary">{t(`tenant.documents.categories.${d.category}`)}</Badge></div>
                  <div className="hidden text-sm text-muted-foreground md:block">{formatDate(d.updatedAt)}</div>
                  <div className="hidden text-sm text-muted-foreground md:block">{d.size}</div>
                  <div className="text-end">
                    <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5" />{t("tenant.documents.download")}</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </RoleGuard>
  );
}
