import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CheckCircle2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { IbysLogo } from "@/components/brand/IbysLogo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { notifyError } from "@/components/feedback/SuccessNotification";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/api/config";

export const Route = createFileRoute("/set-password")({
  head: () => ({
    meta: [
      { title: "Set your password – IBYS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetPasswordPage,
});

/**
 * Public page that completes a tenant's Supabase Auth invite (see
 * ibys-backend/services/auth_service.py invite_tenant_by_staff(), which
 * calls auth.admin.invite_user_by_email with redirect_to pointing here).
 *
 * Opening the emailed invite link puts `#access_token=...&type=invite` in
 * the URL hash. The Supabase JS client (public anon key only — never the
 * service_role key) auto-detects that hash on load and establishes a
 * short-lived recovery session; this page then calls
 * supabase.auth.updateUser({ password }) so the tenant chooses their own
 * password. This is completely separate from this app's own backend-issued
 * session (AuthProvider / AUTH_STORAGE_KEY) — the Supabase session created
 * here is signed out again as soon as the password is set, and the tenant
 * logs in normally afterwards via the existing /login page and
 * POST /api/auth/login.
 */
type ViewState = "checking" | "ready" | "invalid" | "success";

function SetPasswordPage() {
  const { t } = useI18n();
  const [client] = React.useState<SupabaseClient | null>(() =>
    SUPABASE_URL && SUPABASE_ANON_KEY
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: false },
        })
      : null,
  );

  const [view, setView] = React.useState<ViewState>("checking");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string; form?: string }>({});

  React.useEffect(() => {
    let alive = true;
    if (!client) {
      setView("invalid");
      return;
    }
    client.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setView(data.session ? "ready" : "invalid");
      })
      .catch(() => {
        if (!alive) return;
        setView("invalid");
      });
    return () => {
      alive = false;
    };
  }, [client]);

  const validate = () => {
    const next: typeof errors = {};
    if (!password) next.password = t("setPassword.errors.required");
    else if (password.length < 8) next.password = t("setPassword.errors.tooShort");
    if (!confirmPassword) next.confirmPassword = t("setPassword.errors.required");
    else if (password !== confirmPassword) next.confirmPassword = t("setPassword.errors.mismatch");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !client) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      // The recovery session's only purpose was setting the password —
      // sign it out immediately so it never lingers alongside (or is
      // confused with) this app's own backend-issued session.
      await client.auth.signOut().catch(() => {});
      setView("success");
    } catch {
      const msg = t("setPassword.errors.failed");
      setErrors({ form: msg });
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background" style={{ background: "var(--canvas)" }}>
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <IbysLogo size={36} />
          <div className="leading-tight">
            <div className="text-[0.95rem] font-semibold tracking-tight">{t("app.name")}</div>
            <div className="text-[9px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              I Build You See
            </div>
          </div>
        </div>
        <LanguageSwitcher variant="outline" />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-[440px] rounded-[28px] bg-card p-8 sm:p-10"
          style={{
            border: "1px solid oklch(0.92 0.008 240)",
            boxShadow:
              "0 1px 2px oklch(0.28 0.03 260 / 0.04), 0 24px 48px -20px oklch(0.28 0.03 260 / 0.18), 0 8px 16px -8px oklch(0.28 0.03 260 / 0.08)",
          }}
        >
          {view === "checking" && (
            <p className="text-center text-sm text-muted-foreground">{t("common.loading")}</p>
          )}

          {view === "invalid" && (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-xl font-semibold">{t("setPassword.invalidLinkTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("setPassword.invalidLinkMessage")}</p>
              <Button asChild className="mt-6">
                <Link to="/login">{t("setPassword.goToLogin")}</Link>
              </Button>
            </div>
          )}

          {view === "success" && (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-xl font-semibold">{t("setPassword.successTitle")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("setPassword.successMessage")}</p>
              <Button asChild className="mt-6">
                <Link to="/login">{t("setPassword.goToLogin")}</Link>
              </Button>
            </div>
          )}

          {view === "ready" && (
            <>
              <h1 className="text-xl font-semibold">{t("setPassword.title")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("setPassword.subtitle")}</p>

              <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
                <FormField id="new-password" label={t("setPassword.password")} required error={errors.password}>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={t("setPassword.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="h-12 rounded-xl"
                  />
                </FormField>

                <FormField
                  id="confirm-password"
                  label={t("setPassword.confirmPassword")}
                  required
                  error={errors.confirmPassword}
                >
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={t("setPassword.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    className="h-12 rounded-xl"
                  />
                </FormField>

                {errors.form && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive"
                  >
                    {errors.form}
                  </div>
                )}

                <Button type="submit" size="lg" disabled={submitting} className="mt-2 h-12 w-full rounded-xl">
                  {submitting ? t("setPassword.submitting") : t("setPassword.submit")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
