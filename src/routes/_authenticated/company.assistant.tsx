import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send, Copy, Pencil, RotateCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/company/assistant")({
  head: () => ({
    meta: [
      { title: "AI Writing Assistant – IBYS Company" },
      { name: "description", content: "Draft professional updates, summaries, and responses." },
    ],
  }),
  component: Page,
});

type Msg = { role: "user" | "assistant"; content: string };

function Page() {
  const { t } = useI18n();
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Msg[]>([{ role: "assistant", content: t("company.assistant.welcome") }]);

  const suggestions = ["weekly", "delay", "handover", "internal"] as const;

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: `${t("company.assistant.typing")}\n\n— ${t("company.assistant.disclaimer")}` },
    ]);
    setInput("");
  };

  return (
    <RoleGuard allow="BUILDING_COMPANY">
      <PageHeader title={t("company.assistant.title")} description={t("company.assistant.description")} actions={<Sparkles className="h-5 w-5 text-primary" aria-hidden />} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="flex min-h-[520px] flex-col">
          <CardContent className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div className={m.role === "user" ? "max-w-xl rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground" : "max-w-xl whitespace-pre-line text-sm text-foreground"}>
                    {m.content}
                    {m.role === "assistant" && (
                      <div className="mt-2 flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]"><Copy className="h-3 w-3" />{t("company.assistant.copy")}</Button>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]"><Pencil className="h-3 w-3" />{t("company.assistant.edit")}</Button>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]"><RotateCw className="h-3 w-3" />{t("company.assistant.regenerate")}</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2 border-t border-border pt-3">
              <Textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("company.assistant.placeholder")} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
              <Button onClick={() => send(input)}><Send className="h-4 w-4" />{t("company.assistant.send")}</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("company.assistant.disclaimer")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("company.assistant.suggested")}</p>
            <div className="grid gap-2">
              {suggestions.map((k) => (
                <Button key={k} variant="outline" size="sm" className="h-auto justify-start whitespace-normal py-2 text-start text-xs" onClick={() => send(t(`company.assistant.examples.${k}`))}>
                  {t(`company.assistant.examples.${k}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
