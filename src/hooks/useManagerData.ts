import * as React from "react";
import { managerApi, managerMutations, mockManagerBus } from "@/api/managerApi";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { translateData } from "@/lib/i18n/dynamicPhrases";

type State<T> = { data: T | null; loading: boolean; error: Error | null };

function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList = []) {
  const { lang } = useI18n();
  const [state, setState] = React.useState<State<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = React.useState(0);

  // Subscribe once to the mock store bus so any mutation triggers a refetch
  // across every mounted consumer of manager data.
  React.useEffect(() => {
    return mockManagerBus.subscribe(() => setNonce((n) => n + 1));
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

export const useManagerProjects = () => useAsync(() => managerApi.getProjects());
export const useManagerProject = (id: string) => useAsync(() => managerApi.getProject(id), [id]);
export const useManagerProjectStages = (projectId: string) =>
  useAsync(() => managerApi.getStagesForProject(projectId), [projectId]);
export const useManagerAllStages = () => useAsync(() => managerApi.getAllStages());
export const useManagerTasks = () => useAsync(() => managerApi.getTasks());
export const useManagerTask = (id: string) => useAsync(() => managerApi.getTask(id), [id]);
export const useManagerRequests = () => useAsync(() => managerApi.getRequests());
export const useManagerMeetings = () => useAsync(() => managerApi.getMeetings());
export const useManagerNotifications = () => useAsync(() => managerApi.getNotifications());
export const useManagerEmployees = () => useAsync(() => managerApi.getEmployees());
export const useManagerEmployee = (id: string) => useAsync(() => managerApi.getEmployee(id), [id]);
export const useManagerActivity = () => useAsync(() => managerApi.getActivity());
export const useManagerPhotos = () => useAsync(() => managerApi.getPhotos());
export const useManagerDocuments = () => useAsync(() => managerApi.getDocuments());
export const useManagerNotes = () => useAsync(() => managerApi.getNotes());
export const useManagerTenants = () => useAsync(() => managerApi.getTenants());

export const managerActions = managerMutations;
