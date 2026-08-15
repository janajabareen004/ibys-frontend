import * as React from "react";
import { useAuth } from "@/context/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { translateData } from "@/lib/i18n/dynamicPhrases";

/**
 * Minimal shape shared by ManagedNotification (manager), CompanyNotification
 * (company), and Notification (tenant) — all three real per-role
 * notification types already have exactly this shape (see mockManagerService,
 * mockCompanyService, mockTenantService), so the shared header dropdown can
 * render any of them without inventing a new one.
 */
export type HeaderNotification = {
  id: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

type State = { data: HeaderNotification[] | null; loading: boolean; error: Error | null };

/**
 * Role-aware notifications for the shared top-header dropdown. Dynamically
 * imports only the authenticated user's own role API module and calls the
 * exact same getNotifications() facade already used by that role's full
 * Notifications page (each of which already branches on mock vs. live mode
 * internally) — so this never duplicates fetch logic and keeps the other
 * two roles' API modules out of the always-mounted header's bundle chunk.
 */
export function useHeaderNotifications() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [state, setState] = React.useState<State>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    if (!user) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));

    const load = async (): Promise<HeaderNotification[]> => {
      if (user.role === "PROJECT_MANAGER") {
        const { managerApi } = await import("@/api/managerApi");
        return managerApi.getNotifications();
      }
      if (user.role === "BUILDING_COMPANY") {
        const { companyApi } = await import("@/api/companyApi");
        return companyApi.getNotifications();
      }
      const { tenantApi } = await import("@/api/tenantApi");
      return tenantApi.getNotifications();
    };

    load()
      .then((data) => alive && setState({ data: translateData(data, lang), loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error: error as Error }));

    return () => {
      alive = false;
    };
  }, [user, lang, nonce]);

  return { ...state, refetch: () => setNonce((n) => n + 1) };
}
