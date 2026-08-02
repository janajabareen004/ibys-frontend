import * as React from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Radio, MessagesSquare, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { IbysLogo } from "@/components/brand/IbysLogo";
import { useAuth, dashboardPathForRole } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { notifyError } from "@/components/feedback/SuccessNotification";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in – IBYS" },
      { name: "description", content: "Sign in to your IBYS project workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const { status, user, login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string; form?: string }>({});

  if (status === "authenticated" && user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  const validate = () => {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = t("login.errors.required");
    if (!password) next.password = t("login.errors.required");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const u = await login({ identifier: identifier.trim(), password, remember });
      navigate({ to: dashboardPathForRole(u.role), replace: true });
    } catch (err) {
      const status = (err as { status?: number }).status;
      const msg = status === 401 ? t("login.errors.invalid") : t("login.errors.network");
      setErrors({ form: msg });
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting;

  const features = [
    { icon: Radio, title: "Real-time Updates", desc: "Live progress from site to screen — every milestone, the moment it happens." },
    { icon: MessagesSquare, title: "Transparent Communication", desc: "One thread from tenant to contractor. No lost messages, no guesswork." },
    { icon: ShieldCheck, title: "Complete Peace of Mind", desc: "Documented decisions, verified stages, and audit-ready records." },
  ];

  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
      style={{ background: "var(--canvas)" }}
    >
      {/* ============ Brand side ============ */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        {/* Deep architectural background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, oklch(0.42 0.06 215) 0%, oklch(0.3 0.05 215) 55%, oklch(0.22 0.04 220) 100%)",
          }}
          aria-hidden
        />
        {/* Blueprint grid */}
        <div className="pointer-events-none absolute inset-0 bg-blueprint opacity-40" aria-hidden />
        {/* Subtle skyline silhouette */}
        <svg
          aria-hidden
          viewBox="0 0 800 300"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] w-full"
        >
          <g fill="oklch(1 0 0 / 0.055)">
            <rect x="30"  y="140" width="60"  height="160" />
            <rect x="100" y="90"  width="70"  height="210" />
            <rect x="180" y="170" width="50"  height="130" />
            <rect x="240" y="60"  width="90"  height="240" />
            <rect x="340" y="120" width="55"  height="180" />
            <rect x="405" y="40"  width="80"  height="260" />
            <rect x="495" y="110" width="65"  height="190" />
            <rect x="570" y="150" width="55"  height="150" />
            <rect x="635" y="70"  width="85"  height="230" />
            <rect x="730" y="130" width="50"  height="170" />
          </g>
          {/* windows */}
          <g fill="oklch(0.82 0.14 82 / 0.25)">
            <rect x="260" y="80"  width="6" height="6" />
            <rect x="280" y="80"  width="6" height="6" />
            <rect x="260" y="100" width="6" height="6" />
            <rect x="425" y="60"  width="6" height="6" />
            <rect x="445" y="60"  width="6" height="6" />
            <rect x="655" y="90"  width="6" height="6" />
            <rect x="675" y="90"  width="6" height="6" />
          </g>
        </svg>
        {/* warm gold glow */}
        <div
          className="pointer-events-none absolute -bottom-32 -end-32 h-[28rem] w-[28rem] rounded-full"
          style={{ background: "radial-gradient(closest-side, oklch(0.82 0.14 82 / 0.28), transparent 70%)" }}
          aria-hidden
        />

        {/* Content */}
        <div className="relative z-10 p-10 xl:p-14">
          <div className="flex items-center gap-3 text-white">
            <IbysLogo size={44} />
            <div className="min-w-0 leading-tight">
              <div className="text-lg font-semibold tracking-tight">{t("app.name")}</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/70">
                I Build You See
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl px-10 xl:px-14">
          <h2
            className="text-white"
            style={{
              fontSize: "clamp(2.5rem, 1.6rem + 2.6vw, 3.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              fontWeight: 600,
            }}
          >
            See every detail.
            <br />
            <span style={{ color: "oklch(0.85 0.13 82)" }}>Trust every step.</span>
          </h2>
          <p className="mt-6 max-w-md text-[0.975rem] leading-relaxed text-white/75">
            Track every construction stage with complete transparency, real-time
            updates and seamless communication — from foundation to handover.
          </p>
        </div>

        <div className="relative z-10 p-10 xl:p-14">
          <ul className="grid max-w-xl gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <span
                  className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.12)",
                    color: "oklch(0.85 0.13 82)",
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="text-[0.9375rem] font-semibold text-white">{title}</div>
                  <div className="mt-0.5 text-sm leading-relaxed text-white/65">{desc}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center justify-between text-xs text-white/50">
            <span>© {new Date().getFullYear()} IBYS. All rights reserved.</span>
          </div>
        </div>
      </aside>

      {/* ============ Form side ============ */}
      <section className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-12">
        {/* soft warm wash for premium feel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 100% 0%, oklch(0.82 0.14 82 / 0.06), transparent 70%), radial-gradient(50% 40% at 0% 100%, oklch(0.44 0.06 215 / 0.05), transparent 70%)",
          }}
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <IbysLogo size={36} />
            <div className="leading-tight">
              <div className="text-[0.95rem] font-semibold tracking-tight">{t("app.name")}</div>
              <div className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                I Build You See
              </div>
            </div>
          </div>
          <div className="ms-auto">
            <LanguageSwitcher variant="outline" />
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          <div
            className="relative overflow-hidden rounded-[28px] bg-card"
            style={{
              border: "1px solid oklch(0.92 0.008 240)",
              boxShadow:
                "0 1px 2px oklch(0.28 0.03 260 / 0.04), 0 24px 48px -20px oklch(0.28 0.03 260 / 0.18), 0 8px 16px -8px oklch(0.28 0.03 260 / 0.08)",
            }}
          >
            {/* gold hairline top */}
            <div
              aria-hidden
              className="absolute inset-x-8 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.82 0.14 82 / 0.5), transparent)",
              }}
            />

            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <div className="text-caption mb-3" style={{ color: "oklch(0.55 0.03 255)" }}>
                  Welcome back
                </div>
                <h1
                  style={{
                    fontSize: "clamp(1.75rem, 1.4rem + 1vw, 2.125rem)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                    fontWeight: 600,
                  }}
                >
                  {t("login.title")}
                </h1>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {t("login.subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <FormField
                  id="identifier"
                  label={t("login.identifier")}
                  required
                  error={errors.identifier}
                >
                  <Input
                    autoComplete="username"
                    inputMode="email"
                    placeholder={t("login.identifierPlaceholder")}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={disabled}
                    className="h-12 rounded-xl"
                  />
                </FormField>

                <FormField id="password" label={t("login.password")} required error={errors.password}>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={disabled}
                    className="h-12 rounded-xl"
                  />
                </FormField>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-foreground">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(v) => setRemember(v === true)}
                      disabled={disabled}
                    />
                    <span>{t("login.remember")}</span>
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-sm font-medium text-primary transition-colors hover:text-[color:var(--primary-hover)]"
                  >
                    {t("login.forgot")}
                  </a>
                </div>

                {errors.form && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive"
                  >
                    {errors.form}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={disabled}
                  className="group relative mt-2 h-12 w-full overflow-hidden rounded-xl text-[0.9375rem] font-semibold tracking-tight transition-all duration-200 hover:-translate-y-[1px]"
                  style={{
                    boxShadow:
                      "0 1px 0 oklch(1 0 0 / 0.08) inset, 0 8px 20px -6px oklch(0.28 0.05 215 / 0.35), 0 2px 4px -1px oklch(0.28 0.05 215 / 0.2)",
                  }}
                >
                  {submitting ? t("login.submitting") : t("login.submit")}
                </Button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected workspace · Role-based secure access
          </p>
        </div>
      </section>
    </div>
  );
}
