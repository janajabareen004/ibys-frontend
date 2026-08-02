import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth, dashboardPathForRole } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile – IBYS" },
      { name: "description", content: "Manage your IBYS profile, contact details and password." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [company, setCompany] = React.useState(user?.company ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);

  React.useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setCompany(user?.company ?? "");
  }, [user]);

  const initials = (user?.name ?? "?")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      toast.error(t("profile.errors.nameRequired"));
      return;
    }
    if (!/.+@.+\..+/.test(trimmedEmail)) {
      toast.error(t("profile.errors.emailInvalid"));
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        name: trimmedName,
        email: trimmedEmail,
        phone: phone.trim(),
        company: company.trim(),
      });
      toast.success(t("profile.toasts.profileSaved"));
    } catch (err) {
      toast.error((err as Error).message || t("profile.errors.updateFailed"));
    } finally {
      setSavingProfile(false);
    }
  }

  // Password section
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) return t("profile.errors.passwordShort");
    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd))
      return t("profile.errors.passwordWeak");
    return null;
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      toast.error(t("profile.errors.currentRequired"));
      return;
    }
    const err = validatePassword(newPassword);
    if (err) {
      toast.error(err);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.errors.confirmMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success(t("profile.toasts.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e2) {
      toast.error((e2 as Error).message || t("profile.errors.passwordFailed"));
    } finally {
      setSavingPassword(false);
    }
  }

  const dashboardPath = user ? dashboardPathForRole(user.role) : "/";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t("profile.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.subtitle")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: dashboardPath })}
          className="gap-2"
        >
          <BackIcon className="h-4 w-4" aria-hidden />
          {t("common.back")}
        </Button>
      </div>

      {/* Identity card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary/15 text-2xl font-bold text-primary ring-2 ring-primary/20"
            aria-hidden
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={user.avatarUrl}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-start">
            <div className="text-lg font-semibold text-foreground">{user?.name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="secondary">
                {t(`roles.${user?.role ?? "TENANT"}`)}
              </Badge>
              {user?.company && (
                <Badge variant="outline">{user.company}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" aria-hidden />
            {t("profile.sections.info")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="p-name">{t("profile.fields.fullName")}</Label>
              <Input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                maxLength={100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-email">{t("profile.fields.email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="p-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="ps-9"
                  required
                  maxLength={255}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-phone">{t("profile.fields.phone")}</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="p-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="ps-9"
                  maxLength={40}
                  placeholder="+972 50 000 0000"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-role">{t("profile.fields.role")}</Label>
              <Input id="p-role" value={t(`roles.${user?.role ?? "TENANT"}`)} readOnly disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-company">{t("profile.fields.company")}</Label>
              <Input
                id="p-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={savingProfile} className="gap-2">
                {savingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                {t("profile.actions.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            {t("profile.sections.password")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id="pw-current"
              label={t("profile.fields.currentPassword")}
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              autoComplete="current-password"
              t={t}
              className="sm:col-span-2"
            />
            <PasswordField
              id="pw-new"
              label={t("profile.fields.newPassword")}
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              autoComplete="new-password"
              t={t}
            />
            <PasswordField
              id="pw-confirm"
              label={t("profile.fields.confirmPassword")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              autoComplete="new-password"
              t={t}
            />
            <p className="text-xs text-muted-foreground sm:col-span-2">
              {t("profile.hints.passwordRule")}
            </p>
            <Separator className="sm:col-span-2" />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={savingPassword} className="gap-2">
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Lock className="h-4 w-4" aria-hidden />
                )}
                {t("profile.actions.changePassword")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link to={dashboardPath} className="text-sm text-muted-foreground hover:text-foreground">
          {t("common.back")} · {t("common.home")}
        </Link>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  t,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  t: (k: string) => string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="pe-10"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
          className="absolute end-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
