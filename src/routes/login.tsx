import * as React from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";

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
import constructionImg from "@/assets/hero-company.jpg";

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

  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
      style={{ background: "var(--canvas)" }}
    >
      {/* ============ Brand side ============ */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col">
        {/* Construction site background image: covers the panel, no distortion, full height */}
        <img
          src={constructionImg}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Subtle dark/teal overlay so the logo stays legible and the panel matches the IBYS palette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--primary) 60%, transparent) 0%, color-mix(in oklch, var(--primary) 35%, transparent) 45%, color-mix(in oklch, var(--primary) 60%, transparent) 100%)",
          }}
        />

        {/* Logo */}
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
