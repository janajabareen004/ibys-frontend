import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles, User } from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const Route = createFileRoute("/_authenticated/tenant/assistant")({
  head: () => ({
    meta: [
      { title: "Construction Assistant – IBYS" },
      { name: "description", content: "Ask questions about your construction project." },
    ],
  }),
  component: Page,
});

type Msg = { id: string; from: "user" | "ai"; text: string };

function Page() {
  const { t } = useI18n();
  const [msgs, setMsgs] = React.useState<Msg[]>([
    { id: "m0", from: "ai", text: t("tenant.assistant.welcome") },
  ]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMsgs((m) => [...m, { id: `u${Date.now()}`, from: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { id: `a${Date.now()}`, from: "ai", text: sampleReply(trimmed) },
      ]);
      setTyping(false);
    }, 900);
  };

  const examples = [
    t("tenant.assistant.examples.stage"),
    t("tenant.assistant.examples.handover"),
    t("tenant.assistant.examples.updates"),
    t("tenant.assistant.examples.documents"),
  ];

  return (
    <RoleGuard allow="TENANT">
      <PageHeader title={t("tenant.assistant.title")} description={t("tenant.assistant.disclaimer")} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="overflow-hidden">
          <CardContent className="flex h-[70vh] flex-col p-0">
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {msgs.map((m) => (
                <div key={m.id} className={`flex items-start gap-2 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary to-secondary text-primary-foreground"}`}>
                    {m.from === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </span>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex items-start gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form
              className="flex items-center gap-2 border-t border-border p-3"
              onSubmit={(e) => { e.preventDefault(); send(input); }}
            >
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("tenant.assistant.placeholder")} className="flex-1" />
              <Button type="submit" disabled={!input.trim()}><Send className="h-4 w-4" />{t("tenant.assistant.send")}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("tenant.assistant.suggested")}</div>
            <ul className="space-y-1.5">
              {examples.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => send(q)}
                    className="w-full rounded-lg border border-border bg-card p-2.5 text-start text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

function sampleReply(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("stage")) return "Your apartment is currently in the Plaster & Flooring stage (58% complete). Floors 5–8 have been completed this week.";
  if (lower.includes("handover") || lower.includes("delivery")) return "The expected handover is scheduled for November 30, 2026.";
  if (lower.includes("update")) return "Recent updates: MEP tests passed, plaster works reached 58%, and the finishing stage schedule is being revised.";
  if (lower.includes("document")) return "This week, the Q1 progress report and the finishes selection guide were uploaded.";
  return "This is a UI preview — connect the API layer to get real project answers.";
}
