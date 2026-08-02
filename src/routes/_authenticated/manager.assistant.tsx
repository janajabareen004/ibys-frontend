import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/_authenticated/manager/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant – IBYS Manager" },
      { name: "description", content: "Summarize projects, draft updates and prepare reports." },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useI18n();
  const [text, setText] = React.useState("");
  const [messages, setMessages] = React.useState<Msg[]>([{ role: "assistant", content: t("manager.assistant.welcome") }]);

  const send = (content: string) => {
    if (!content.trim()) return;
    setMessages((m) => [...m, { role: "user", content }, { role: "assistant", content: t("manager.assistant.disclaimer") }]);
    setText("");
  };

  const examples: Array<keyof (typeof import("@/lib/i18n/locales/en").default)["manager"]["assistant"]["examples"]> = ["summarize", "delays", "priorities", "report"];

  return (
    <RoleGuard allow="PROJECT_MANAGER">
      <PageHeader title={t("manager.assistant.title")} description={t("manager.assistant.description")} actions={<Badge variant="secondary" className="gap-1"><Sparkles className="h-3.5 w-3.5" />Preview</Badge>} />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{m.content}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("manager.assistant.suggested")}</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {examples.map((k) => (
                <Button key={k} size="sm" variant="outline" onClick={() => send(t(`manager.assistant.examples.${k}`))}>{t(`manager.assistant.examples.${k}`)}</Button>
              ))}
            </div>
            <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("manager.assistant.placeholder")} />
              <Button type="submit" size="sm"><Send className="h-4 w-4" />{t("manager.assistant.send")}</Button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("manager.assistant.disclaimer")}</p>
          </div>
        </CardContent>
      </Card>
    </RoleGuard>
  );
}
