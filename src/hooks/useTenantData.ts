import * as React from "react";
import { tenantApi } from "@/api/tenantApi";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { translateData } from "@/lib/i18n/dynamicPhrases";

type State<T> = { data: T | null; loading: boolean; error: Error | null };

function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList = []): State<T> & { refetch: () => void } {
  const { lang } = useI18n();
  const [state, setState] = React.useState<State<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ data: translateData(data, lang), loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error: error as Error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, lang]);

  return { ...state, refetch: () => setNonce((n) => n + 1) };
}

export const useTenantProject = () => useAsync(() => tenantApi.getProject());
export const useTenantStages = () => useAsync(() => tenantApi.getStages());
export const useTenantStage = (id: string) => useAsync(() => tenantApi.getStage(id as never), [id]);
export const useTenantPhotos = () => useAsync(() => tenantApi.getPhotos());
export const useTenantDocuments = () => useAsync(() => tenantApi.getDocuments());
export const useTenantComments = () => useAsync(() => tenantApi.getComments());
export const useTenantMeetings = () => useAsync(() => tenantApi.getMeetings());
export const useTenantNotifications = () => useAsync(() => tenantApi.getNotifications());
export const useTenantRequests = () => useAsync(() => tenantApi.getRequests());
