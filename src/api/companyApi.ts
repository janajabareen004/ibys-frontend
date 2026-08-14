/**
 * Building Company API facade.
 * Uses the mock service when VITE_USE_MOCK_API is true; otherwise proxies to REST endpoints.
 */
import { USE_MOCK_API, AUTH_STORAGE_KEY } from "./config";
import { apiClient } from "./apiClient";
import {
  mockCompanyService,
  mockCompanyBus,
  type CompanyProject,
  type CompanyProjectStatus,
  type CompanyStage,
  type PhotoAsset,
  type DocumentAsset,
  type UploadItem,
  type CompanyRequest,
  type CompanyMeeting,
  type CompanyNotification,
  type CompanyActivity,
  type CompanyEmployee,
  type CompanyComment,
  type ProjectManagerPerson,
  type CompanyTenant,
  type Apartment,
  type ApartmentStatus,
  type ProjectStageKey,
} from "@/mocks/mockCompanyService";

export type {
  CompanyProject,
  CompanyProjectStatus,
  CompanyStage,
  PhotoAsset,
  DocumentAsset,
  UploadItem,
  CompanyRequest,
  CompanyMeeting,
  CompanyNotification,
  CompanyActivity,
  CompanyEmployee,
  CompanyComment,
  ProjectManagerPerson,
  CompanyTenant,
  Apartment,
  ApartmentStatus,
};


export { mockCompanyBus };

// ---------------------------------------------------------------------------
// Real backend: company projects
//
// There is no "/company/*" endpoint. Projects live at GET /api/projects.
// A project is assigned to a building company via `building_company_id`,
// which equals that company's user_id. We fetch all projects and keep only
// the ones owned by the authenticated company. Mapping stays in this file.
// ---------------------------------------------------------------------------

type BackendProjectRow = {
  project_id: string | number;
  project_name: string | null;
  location: string | null;
  status: string | null;
  building_company_id: string | null;
  project_manager_id: string | null;
  description: string | null;
  floors: number | null;
  units: number | null;
  project_type: string | null;
};

type BackendProgressRow = {
  progress_id?: string | number;
  project_id: string | number | null;
  task_name: string | null;
  status: string | null;
  end_date: string | null;
  progress_percent?: number | null;
};

const CANONICAL_STAGE_KEYS: ProjectStageKey[] = [
  "structural",
  "electrical",
  "plaster",
  "windows",
  "finishing",
  "handover",
];

/** Read the authenticated user's id from the persisted auth session. */
function getStoredUserId(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string; user?: { id?: string } };
    return parsed.userId ?? parsed.user?.id ?? null;
  } catch {
    return null;
  }
}

function normalizeCompanyProjectStatus(value: string | null | undefined): CompanyProjectStatus {
  const s = (value ?? "").trim().toLowerCase();
  if (["completed", "complete", "done", "finished"].includes(s)) return "completed";
  if (["on_hold", "on hold", "paused", "hold"].includes(s)) return "on_hold";
  if (["delayed", "late", "behind"].includes(s)) return "delayed";
  if (["planning", "planned", "not started", "not_started"].includes(s)) return "planning";
  // Backend stores "In Progress"; map it explicitly to the company UI's active bucket.
  if (["in progress", "in_progress", "active", "ongoing"].includes(s)) return "in_progress";
  return "in_progress";
}

function stagePercent(row: BackendProgressRow): number {
  if (typeof row.progress_percent === "number") return row.progress_percent;
  const s = (row.status ?? "").toLowerCase();
  if (/(complet|done|finish|closed)/.test(s)) return 100;
  if (/(progress|current|ongoing|active|started)/.test(s)) return 50;
  if (/(delay|late|behind)/.test(s)) return 25;
  return 0;
}

function averageProgress(rows: BackendProgressRow[]): number {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((sum, r) => sum + stagePercent(r), 0) / rows.length);
}

function pickCurrentStageKey(rows: BackendProgressRow[]): ProjectStageKey {
  const current = rows.find((r) => /(progress|current|ongoing|active|started)/i.test(r.status ?? ""));
  const chosen = current ?? rows.find((r) => !/(complet|done|finish|closed)/i.test(r.status ?? ""));
  if (!chosen) return CANONICAL_STAGE_KEYS[0];
  const idx = rows.indexOf(chosen);
  return CANONICAL_STAGE_KEYS[Math.min(Math.max(idx, 0), CANONICAL_STAGE_KEYS.length - 1)];
}

function latestEndDate(rows: BackendProgressRow[]): string {
  let latest = "";
  for (const r of rows) {
    if (r.end_date && (!latest || r.end_date > latest)) latest = r.end_date;
  }
  return latest;
}

function groupProgressByProject(rows: BackendProgressRow[]): Map<string, BackendProgressRow[]> {
  const byProject = new Map<string, BackendProgressRow[]>();
  for (const r of rows) {
    if (r.project_id == null) continue;
    const pid = String(r.project_id);
    const list = byProject.get(pid) ?? [];
    list.push(r);
    byProject.set(pid, list);
  }
  return byProject;
}

function mapCompanyProject(row: BackendProjectRow, progressRows: BackendProgressRow[]): CompanyProject {
  return {
    id: String(row.project_id),
    name: row.project_name ?? "",
    address: row.location ?? "",
    clientName: "",
    projectManager: "",
    progress: averageProgress(progressRows),
    currentStage: pickCurrentStageKey(progressRows),
    expectedCompletion: latestEndDate(progressRows),
    status: normalizeCompanyProjectStatus(row.status),
    photosCount: 0,
    documentsCount: 0,
    updatedAt: "",
    description: row.description ?? "",
    team: [],
    floors: row.floors ?? 0,
    units: row.units ?? 0,
    projectType: row.project_type ?? "",
    projectManagerId: row.project_manager_id ? String(row.project_manager_id) : undefined,
  };
}

function isOwnedByCompany(row: BackendProjectRow, companyUserId: string): boolean {
  return String(row.building_company_id ?? "") === String(companyUserId);
}

async function fetchCompanyProgress(): Promise<BackendProgressRow[]> {
  try {
    const res = await apiClient.get<BackendProgressRow[]>("/progress");
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

async function fetchCompanyProjects(): Promise<CompanyProject[]> {
  const companyUserId = getStoredUserId();
  if (!companyUserId) return [];
  const rows = await apiClient.get<BackendProjectRow[]>("/projects");
  const owned = (Array.isArray(rows) ? rows : []).filter((r) => isOwnedByCompany(r, companyUserId));
  if (owned.length === 0) return [];
  const byProject = groupProgressByProject(await fetchCompanyProgress());
  return owned.map((r) => mapCompanyProject(r, byProject.get(String(r.project_id)) ?? []));
}

async function fetchCompanyProject(id: string): Promise<CompanyProject | null> {
  const companyUserId = getStoredUserId();
  if (!companyUserId) return null;
  const rows = await apiClient.get<BackendProjectRow[]>("/projects");
  const row = (Array.isArray(rows) ? rows : []).find(
    (r) => String(r.project_id) === String(id) && isOwnedByCompany(r, companyUserId),
  );
  if (!row) return null;
  let progress: BackendProgressRow[] = [];
  try {
    const res = await apiClient.get<BackendProgressRow[]>(`/projects/${id}/progress`);
    progress = Array.isArray(res) ? res : [];
  } catch {
    progress = [];
  }
  return mapCompanyProject(row, progress);
}

export const companyApi = {
  getProjects: () =>
    USE_MOCK_API ? mockCompanyService.getProjects() : fetchCompanyProjects(),
  getProject: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getProject(id) : fetchCompanyProject(id),
  getStages: () =>
    USE_MOCK_API ? mockCompanyService.getStages() : apiClient.get<CompanyStage[]>("/company/stages"),
  getStage: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getStage(id) : apiClient.get<CompanyStage | null>(`/company/stages/${id}`),
  getStagesForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockCompanyService.getStagesForProject(projectId)
      : apiClient.get<CompanyStage[]>(`/company/projects/${projectId}/stages`),
  getPhotos: () =>
    USE_MOCK_API ? mockCompanyService.getPhotos() : apiClient.get<PhotoAsset[]>("/company/photos"),
  getDocuments: () =>
    USE_MOCK_API ? mockCompanyService.getDocuments() : apiClient.get<DocumentAsset[]>("/company/documents"),
  getUploads: () =>
    USE_MOCK_API ? mockCompanyService.getUploads() : apiClient.get<UploadItem[]>("/company/uploads"),
  getRequests: () =>
    USE_MOCK_API ? mockCompanyService.getRequests() : apiClient.get<CompanyRequest[]>("/company/requests"),
  getMeetings: () =>
    USE_MOCK_API ? mockCompanyService.getMeetings() : apiClient.get<CompanyMeeting[]>("/company/meetings"),
  getNotifications: () =>
    USE_MOCK_API ? mockCompanyService.getNotifications() : apiClient.get<CompanyNotification[]>("/company/notifications"),
  getActivity: () =>
    USE_MOCK_API ? mockCompanyService.getActivity() : apiClient.get<CompanyActivity[]>("/company/activity"),
  getEmployees: () =>
    USE_MOCK_API ? mockCompanyService.getEmployees() : apiClient.get<CompanyEmployee[]>("/company/team"),
  getEmployee: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getEmployee(id) : apiClient.get<CompanyEmployee | null>(`/company/team/${id}`),
  getComments: () =>
    USE_MOCK_API ? mockCompanyService.getComments() : apiClient.get<CompanyComment[]>("/company/comments"),

  // ---- project managers
  getProjectManagers: () =>
    USE_MOCK_API ? mockCompanyService.getProjectManagers() : apiClient.get<ProjectManagerPerson[]>("/company/project-managers"),

  // ---- tenants
  getTenants: () =>
    USE_MOCK_API ? mockCompanyService.getTenants() : apiClient.get<CompanyTenant[]>("/company/tenants"),
  getTenant: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getTenant(id) : apiClient.get<CompanyTenant | null>(`/company/tenants/${id}`),

  // ---- apartments
  getApartments: () =>
    USE_MOCK_API ? mockCompanyService.getApartments() : apiClient.get<Apartment[]>("/company/apartments"),
  getApartmentsForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockCompanyService.getApartmentsForProject(projectId)
      : apiClient.get<Apartment[]>(`/company/projects/${projectId}/apartments`),
};

/**
 * Mutations — call the mock store synchronously when mock mode is on,
 * otherwise proxy to REST. Every mutation triggers the pub/sub bus so
 * `useCompanyData` hooks refetch automatically.
 */
export const companyMutations = {
  // projects
  createProject: (input: Parameters<typeof mockCompanyService.createProject>[0]) =>
    USE_MOCK_API ? mockCompanyService.createProject(input) : apiClient.post<CompanyProject>("/company/projects", input),
  updateProject: (id: string, patch: Partial<CompanyProject>) =>
    USE_MOCK_API ? mockCompanyService.updateProject(id, patch) : apiClient.patch<CompanyProject>(`/company/projects/${id}`, patch),
  deleteProject: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteProject(id) : apiClient.delete<void>(`/company/projects/${id}`),
  assignProjectManager: (projectId: string, managerId: string) =>
    USE_MOCK_API
      ? mockCompanyService.assignProjectManager(projectId, managerId)
      : apiClient.post<CompanyProject>(`/company/projects/${projectId}/assign-manager`, { managerId }),

  // project managers
  createProjectManager: (input: Parameters<typeof mockCompanyService.createProjectManager>[0]) =>
    USE_MOCK_API ? mockCompanyService.createProjectManager(input) : apiClient.post<ProjectManagerPerson>("/company/project-managers", input),
  updateProjectManager: (id: string, patch: Partial<ProjectManagerPerson>) =>
    USE_MOCK_API ? mockCompanyService.updateProjectManager(id, patch) : apiClient.patch<ProjectManagerPerson>(`/company/project-managers/${id}`, patch),
  deleteProjectManager: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteProjectManager(id) : apiClient.delete<void>(`/company/project-managers/${id}`),

  // tenants
  createTenant: (input: Parameters<typeof mockCompanyService.createTenant>[0]) =>
    USE_MOCK_API ? mockCompanyService.createTenant(input) : apiClient.post<CompanyTenant>("/company/tenants", input),
  updateTenant: (id: string, patch: Partial<CompanyTenant>) =>
    USE_MOCK_API ? mockCompanyService.updateTenant(id, patch) : apiClient.patch<CompanyTenant>(`/company/tenants/${id}`, patch),
  deleteTenant: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteTenant(id) : apiClient.delete<void>(`/company/tenants/${id}`),

  // apartments
  createApartment: (input: Parameters<typeof mockCompanyService.createApartment>[0]) =>
    USE_MOCK_API ? mockCompanyService.createApartment(input) : apiClient.post<Apartment>("/company/apartments", input),
  updateApartment: (id: string, patch: Partial<Apartment>) =>
    USE_MOCK_API ? mockCompanyService.updateApartment(id, patch) : apiClient.patch<Apartment>(`/company/apartments/${id}`, patch),
  deleteApartment: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteApartment(id) : apiClient.delete<void>(`/company/apartments/${id}`),
  assignTenantToApartment: (apartmentId: string, tenantId: string | null) =>
    USE_MOCK_API
      ? mockCompanyService.assignTenantToApartment(apartmentId, tenantId)
      : apiClient.post<Apartment>(`/company/apartments/${apartmentId}/assign`, { tenantId }),

  // stages
  updateStage: (id: string, patch: Partial<CompanyStage>) =>
    USE_MOCK_API ? mockCompanyService.updateStage(id, patch) : apiClient.patch<CompanyStage>(`/company/stages/${id}`, patch),
  addStageComment: (input: Parameters<typeof mockCompanyService.addStageComment>[0]) =>
    USE_MOCK_API ? mockCompanyService.addStageComment(input) : apiClient.post<CompanyComment>(`/company/stages/comments`, input),

  // meetings
  createMeeting: (input: Parameters<typeof mockCompanyService.createMeeting>[0]) =>
    USE_MOCK_API ? mockCompanyService.createMeeting(input) : apiClient.post<CompanyMeeting>("/company/meetings", input),
  updateMeeting: (id: string, patch: Partial<CompanyMeeting>) =>
    USE_MOCK_API ? mockCompanyService.updateMeeting(id, patch) : apiClient.patch<CompanyMeeting>(`/company/meetings/${id}`, patch),
  setMeetingStatus: (id: string, status: CompanyMeeting["status"]) =>
    USE_MOCK_API ? mockCompanyService.setMeetingStatus(id, status) : apiClient.post<CompanyMeeting>(`/company/meetings/${id}/status`, { status }),
  deleteMeeting: (id: string) =>
    USE_MOCK_API ? mockCompanyService.deleteMeeting(id) : apiClient.delete<void>(`/company/meetings/${id}`),

  // requests
  setRequestStatus: (id: string, status: CompanyRequest["status"]) =>
    USE_MOCK_API ? mockCompanyService.setRequestStatus(id, status) : apiClient.post<CompanyRequest>(`/company/requests/${id}/status`, { status }),
  replyToRequest: (id: string, message: string) =>
    USE_MOCK_API ? mockCompanyService.replyToRequest(id, message) : apiClient.post<CompanyRequest>(`/company/requests/${id}/reply`, { message }),
};
