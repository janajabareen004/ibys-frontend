import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { companyMutations, extractApiErrorMessage } from "@/api/companyApi";
import type { CompanyProject, Apartment } from "@/api/companyApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Projects accessible to the current Building Company/Manager (for the Project select). */
  projects: CompanyProject[];
  /** All apartments already loaded for this company, used to derive the per-project available list. */
  apartments: Apartment[];
  /**
   * True while the parent's apartments list is still being fetched. Without
   * this, opening the dialog before that fetch resolves would show a
   * false-negative "No available apartments in this project" (computed off
   * a still-empty `apartments` array) instead of a loading state.
   */
  apartmentsLoading?: boolean;
  /** Called after a successful create+assign so the caller can refetch its real tenant list. */
  onSaved?: () => void;
};

/**
 * Create-only dialog: the Building Company enters Full name, Phone, Email,
 * Project and Apartment. No password field — the tenant's login identity is
 * created via Supabase Auth's invite flow (see createCompanyTenant()) and
 * the tenant sets their own password later via the emailed invite link and
 * the /set-password page. There is no edit/delete here — both are
 * intentionally out of scope (no backend route exists for either).
 */
export function TenantDialog({ open, onOpenChange, projects, apartments, apartmentsLoading, onSaved }: Props) {
  const { t } = useI18n();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [apartmentId, setApartmentId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  // Set once step 1 (account creation) succeeds, so a retry after a partial
  // failure only retries apartment assignment — never re-creates the same
  // email (which would just fail as "already in use").
  const [createdTenant, setCreatedTenant] = React.useState<{ id: string; email: string } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setPhone("");
    setErrorMessage(null);
    setCreatedTenant(null);
    setProjectId(projects[0]?.id ?? "");
  }, [open, projects]);

  // Real relationship only: an apartment belongs to the selected project when
  // String(apartment.projectId) === String(selectedProjectId) (defensive
  // against any type mismatch), and is available when its tenant_id is
  // genuinely empty (null/undefined/""). Deliberately NOT filtered by the
  // display `status` field — that's a separate, staff-editable column that
  // is not guaranteed to stay in sync with tenant_id.
  const availableApartments = React.useMemo(
    () =>
      apartments.filter((a) => {
        const sameProject = String(a.projectId) === String(projectId);
        const isUnassigned = a.tenantId == null || a.tenantId === "";
        return sameProject && isUnassigned;
      }),
    [apartments, projectId],
  );

  React.useEffect(() => {
    if (!open) return;
    setApartmentId((prev) => (availableApartments.some((a) => a.id === prev) ? prev : availableApartments[0]?.id ?? ""));
  }, [open, availableApartments]);

  const submit = async () => {
    setErrorMessage(null);

    if (!apartmentId) {
      setErrorMessage(t("company.pm.tenantForm.errors.assignmentRequired") as string);
      return;
    }

    // Step 1 already succeeded in an earlier attempt — only retry the
    // apartment assignment. Re-running account creation here would attempt
    // to create the same email again and fail as "already in use".
    if (createdTenant) {
      setSaving(true);
      try {
        await companyMutations.assignTenantToApartment(apartmentId, createdTenant.id);
        toast.success(t("company.pm.toasts.tenantCreated") as string);
        onSaved?.();
        onOpenChange(false);
      } catch (err) {
        const msg = t("company.pm.tenantForm.errors.assignmentFailed", {
          reason: extractApiErrorMessage(err, t("common.error") as string),
        }) as string;
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!name.trim() || !email.trim()) {
      setErrorMessage(t("common.error") as string);
      return;
    }

    setSaving(true);

    let newTenantId: string;
    try {
      const created = await companyMutations.createTenant({
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      newTenantId = created.id;
    } catch (err) {
      // Nothing was created — safe to let the user edit and retry from scratch.
      setSaving(false);
      const msg = extractApiErrorMessage(err, t("common.error") as string);
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setCreatedTenant({ id: newTenantId, email: email.trim() });

    try {
      await companyMutations.assignTenantToApartment(apartmentId, newTenantId);
    } catch (err) {
      setSaving(false);
      // The TENANT account now exists (Auth invite + public.users +
      // public.tenants) but is not linked to any apartment. There is no
      // rollback endpoint for this, and deleting the just-created Auth
      // account from the frontend would need a new destructive endpoint
      // this task does not add — so the account is left in place and the
      // partial state is reported clearly instead of a false "success".
      // Because the tenants list (fetchCompanyTenants) is derived only from
      // owned apartments' tenant_id, this tenant will not appear in the
      // table until the assignment below succeeds — the user can retry it
      // without re-entering details (createdTenant is now set).
      const msg = t("company.pm.tenantForm.errors.partialFailure", {
        reason: extractApiErrorMessage(err, t("common.error") as string),
      }) as string;
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setSaving(false);
    toast.success(t("company.pm.toasts.tenantCreated") as string);
    onSaved?.();
    onOpenChange(false);
  };

  const identityLocked = !!createdTenant;
  const saveDisabled = saving || !!apartmentsLoading || !projectId || !apartmentId;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("company.pm.tenantForm.createTitle")}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {errorMessage && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {identityLocked && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              {t("company.pm.tenantForm.accountCreatedHint", { email: createdTenant!.email })}
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>{t("company.pm.tenantForm.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={identityLocked} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.pm.tenantForm.phone")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={identityLocked} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.pm.tenantForm.email")}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={identityLocked} />
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.pm.tenantForm.project")}</Label>
            {projects.length > 0 ? (
              <Select value={projectId} onValueChange={setProjectId} disabled={identityLocked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{t("company.pm.tenantForm.noProjects")}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>{t("company.pm.tenantForm.apartment")}</Label>
            {apartmentsLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {t("common.loading")}
              </p>
            ) : availableApartments.length > 0 ? (
              <Select value={apartmentId} onValueChange={setApartmentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableApartments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.number || a.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">{t("company.pm.tenantForm.noApartments")}</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("company.pm.common.cancel")}</Button>
          <Button onClick={() => void submit()} disabled={saveDisabled}>
            {createdTenant ? t("company.pm.tenantForm.retryAssignment") : t("company.pm.common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
