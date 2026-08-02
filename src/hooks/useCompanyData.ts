import * as React from "react";
import { companyApi } from "@/api/companyApi";
import { mockCompanyBus } from "@/mocks/mockCompanyService";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { translateData } from "@/lib/i18n/dynamicPhrases";

type State<T> = { data: T | null; loading: boolean; error: Error | null };

function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList = []) {
  const { lang } = useI18n();
  const [state, setState] = React.useState<State<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = React.useState(0);
  React.useEffect(() => {
    return mockCompanyBus.subscribe(() => setNonce((n) => n + 1));
  }, []);
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

export const useCompanyProjects = () => useAsync(() => companyApi.getProjects());
export const useCompanyProject = (id: string) => useAsync(() => companyApi.getProject(id), [id]);
export const useCompanyStages = () => useAsync(() => companyApi.getStages());
export const useCompanyStage = (id: string) => useAsync(() => companyApi.getStage(id), [id]);
export const useCompanyProjectStages = (projectId: string) =>
  useAsync(() => companyApi.getStagesForProject(projectId), [projectId]);
export const useCompanyPhotos = () => useAsync(() => companyApi.getPhotos());
export const useCompanyDocuments = () => useAsync(() => companyApi.getDocuments());
export const useCompanyUploads = () => useAsync(() => companyApi.getUploads());
export const useCompanyRequests = () => useAsync(() => companyApi.getRequests());
export const useCompanyMeetings = () => useAsync(() => companyApi.getMeetings());
export const useCompanyNotifications = () => useAsync(() => companyApi.getNotifications());
export const useCompanyActivity = () => useAsync(() => companyApi.getActivity());
export const useCompanyEmployees = () => useAsync(() => companyApi.getEmployees());
export const useCompanyEmployee = (id: string) => useAsync(() => companyApi.getEmployee(id), [id]);
export const useCompanyComments = () => useAsync(() => companyApi.getComments());
export const useCompanyProjectManagers = () => useAsync(() => companyApi.getProjectManagers());
export const useCompanyTenants = () => useAsync(() => companyApi.getTenants());
export const useCompanyTenant = (id: string) => useAsync(() => companyApi.getTenant(id), [id]);
export const useCompanyApartments = () => useAsync(() => companyApi.getApartments());
export const useCompanyProjectApartments = (projectId: string) =>
  useAsync(() => companyApi.getApartmentsForProject(projectId), [projectId]);
