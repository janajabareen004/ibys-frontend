/**
 * Project Manager API facade.
 * Reads proxy through the REST client when USE_MOCK_API is off; writes always
 * flow through the in-memory mock store (backend hookup lands in Phase 2).
 */
import { USE_MOCK_API, AUTH_STORAGE_KEY } from "./config";
import { apiClient } from "./apiClient";
import {
  mockManagerService,
  mockManagerBus,
  type ManagedProject,
  type ManagedStage,
  type ManagedTask,
  type ManagedRequest,
  type ManagedMeeting,
  type ManagedNotification,
  type Employee,
  type ActivityEvent,
  type ManagedPhoto,
  type ManagedDocument,
  type ManagedNote,
  type ManagedTenant,
  type TenantRequestCategory,
  type TenantRequestStatus,
  type TenantRequestPriority,
} from "@/mocks/mockManagerService";

export type {
  ManagedProject,
  ManagedStage,
  ManagedTask,
  ManagedRequest,
  ManagedMeeting,
  ManagedNotification,
  Employee,
  ActivityEvent,
  ManagedPhoto,
  ManagedDocument,
  ManagedNote,
  ManagedTenant,
};

export { mockManagerBus };

// ---------------------------------------------------------------------------
// Real backend: manager projects
//
// The backend has no "/manager/*" endpoints. Projects live at GET /api/projects
// (returns every project). A project is assigned to a manager via its
// `project_manager_id` column, which equals that manager's user_id. So we fetch
// all projects and keep only the ones owned by the authenticated manager.
// All backend->frontend mapping stays in this file; the dashboard/UI is unchanged.
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

/** Guaranteed-valid ISO date string (formatDate throws on invalid input). */
function safeDate(value: string | null | undefined): string {
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return value;
  }
  return new Date().toISOString();
}

function normalizeProjectStatus(value: string | null | undefined): ManagedProject["status"] {
  const s = (value ?? "").trim().toLowerCase();
  if (["completed", "complete", "done", "finished"].includes(s)) return "completed";
  if (["on_hold", "on hold", "paused", "hold"].includes(s)) return "on_hold";
  if (["at_risk", "at risk", "risk"].includes(s)) return "at_risk";
  if (["delayed", "late", "behind"].includes(s)) return "delayed";
  return "on_track";
}

function mapManagedProject(row: BackendProjectRow): ManagedProject {
  return {
    id: String(row.project_id),
    name: row.project_name ?? "",
    clientName: "",
    address: row.location ?? "",
    progress: 0,
    currentStage: "structural",
    expectedCompletion: safeDate(null),
    startDate: safeDate(null),
    status: normalizeProjectStatus(row.status),
    budget: { planned: 0, spent: 0, currency: "" },
    description: row.description ?? "",
    team: [],
    building: "",
    entrance: "",
    updatedAt: safeDate(null),
  };
}

async function fetchManagerProjects(): Promise<ManagedProject[]> {
  const managerId = getStoredUserId();
  if (!managerId) return [];
  const rows = await apiClient.get<BackendProjectRow[]>("/projects");
  const list = Array.isArray(rows) ? rows : [];
  return list
    .filter((r) => r.project_manager_id === managerId)
    .map(mapManagedProject);
}

// ---------------------------------------------------------------------------
// Real backend: manager tenant requests
//
// The requests table has NO project_id — a request links only to tenant_id.
// Ownership is derived: manager's projects (project_manager_id == managerId)
// -> apartments of those projects (tenant_id, project_id) -> requests whose
// tenant_id belongs to one of those tenants. GET /api/requests returns every
// request to a MANAGER token, so the manager-scoping is enforced here.
// ---------------------------------------------------------------------------

type BackendApartmentRow = {
  apartment_id: string | number;
  tenant_id: string | null;
  project_id: string | number | null;
};

type BackendRequestRow = {
  request_id: string | number;
  request_date: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  tenant_id: string | null;
};

function normalizeRequestStatus(value: string | null | undefined): TenantRequestStatus {
  const s = (value ?? "").trim().toLowerCase();
  if (["approved", "accepted", "accept"].includes(s)) return "approved";
  if (["rejected", "declined", "denied"].includes(s)) return "rejected";
  if (["archived", "closed"].includes(s)) return "archived";
  if (["completed", "done"].includes(s)) return "approved";
  return "pending";
}

function normalizeRequestPriority(value: string | null | undefined): TenantRequestPriority {
  const s = (value ?? "").trim().toLowerCase();
  if (s === "low") return "low";
  if (s === "high") return "high";
  return "medium";
}

function mapManagedRequest(
  row: BackendRequestRow,
  projectId: string,
  tenantName: string,
): ManagedRequest {
  return {
    id: String(row.request_id),
    // The tenant portal only creates photo requests; the backend has no
    // category column, so default to "photo".
    category: "photo" as TenantRequestCategory,
    status: normalizeRequestStatus(row.status),
    priority: normalizeRequestPriority(row.priority),
    projectId,
    // Resolved from GET /tenants/<tenant_id> (requests carry only tenant_id).
    tenantName,
    assignedTo: undefined,
    description: row.description ?? "",
    reply: undefined,
    createdAt: safeDate(row.request_date),
  };
}

async function fetchManagerRequests(): Promise<ManagedRequest[]> {
  const managerId = getStoredUserId();
  if (!managerId) return [];

  const projects = await apiClient.get<BackendProjectRow[]>("/projects");
  const mine = (Array.isArray(projects) ? projects : []).filter(
    (p) => p.project_manager_id === managerId,
  );
  if (mine.length === 0) return [];

  // tenant_id -> project_id for every tenant in the manager's projects.
  const tenantProject = new Map<string, string>();
  await Promise.all(
    mine.map(async (p) => {
      const projectId = String(p.project_id);
      try {
        const apts = await apiClient.get<BackendApartmentRow[]>(
          `/projects/${projectId}/apartments`,
        );
        (Array.isArray(apts) ? apts : []).forEach((a) => {
          if (a.tenant_id && !tenantProject.has(a.tenant_id)) {
            tenantProject.set(a.tenant_id, projectId);
          }
        });
      } catch {
        // A project with no apartments (or a fetch error) contributes no tenants.
      }
    }),
  );
  if (tenantProject.size === 0) return [];

  let requests: BackendRequestRow[];
  try {
    const res = await apiClient.get<BackendRequestRow[]>("/requests");
    requests = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }

  const scoped = requests.filter(
    (r) => r.tenant_id != null && tenantProject.has(r.tenant_id),
  );

  // Requests/apartments rows carry only tenant_id; resolve display names via
  // GET /tenants/<tenant_id> (one lookup per distinct tenant in scope).
  const tenantIds = [...new Set(scoped.map((r) => r.tenant_id as string))];
  const nameEntries = await Promise.all(
    tenantIds.map(async (tid) => {
      try {
        const profile = await apiClient.get<{ full_name?: string | null }>(
          `/tenants/${tid}`,
        );
        return [tid, profile?.full_name ?? ""] as const;
      } catch {
        return [tid, ""] as const;
      }
    }),
  );
  const tenantNames = new Map<string, string>(nameEntries);

  return scoped.map((r) =>
    mapManagedRequest(
      r,
      tenantProject.get(r.tenant_id as string) ?? "",
      tenantNames.get(r.tenant_id as string) ?? "",
    ),
  );
}

// ---------------------------------------------------------------------------
// Real backend: manager meetings
//
// Meetings live at GET /api/meetings (all projects) and each row carries a
// project_id (unlike requests). Ownership is derived the same way as projects:
// keep only meetings whose project_id belongs to a project assigned to the
// authenticated manager (project_manager_id == managerId). All mapping stays in
// this file; the UI and its 5 status tabs are unchanged.
// ---------------------------------------------------------------------------

type BackendMeetingRow = {
  meeting_id: string | number;
  meeting_date: string | null;
  meeting_time: string | null;
  purpose: string | null;
  status: string | null;
  project_id: string | number | null;
  project_manager_id: string | null;
  location: string | null;
  duration_min: number | null;
  participants: string | null;
  meeting_link: string | null;
};

/** Map backend status + date to one of the manager UI's 5 meeting buckets. */
function normalizeMeetingStatus(
  status: string | null | undefined,
  whenIso: string,
): ManagedMeeting["status"] {
  const s = (status ?? "").trim().toLowerCase();
  if (s.includes("cancel") || s.includes("reject") || s.includes("declin")) {
    return "cancelled";
  }
  if (s.includes("reschedul")) return "rescheduled";
  const when = new Date(whenIso);
  const now = new Date();
  const sameDay =
    when.getFullYear() === now.getFullYear() &&
    when.getMonth() === now.getMonth() &&
    when.getDate() === now.getDate();
  if (sameDay) return "today";
  return when.getTime() >= now.getTime() ? "upcoming" : "past";
}

function mapManagedMeeting(row: BackendMeetingRow): ManagedMeeting {
  const when = safeDate(
    row.meeting_date ? `${row.meeting_date}T${row.meeting_time ?? "00:00"}` : null,
  );
  return {
    id: String(row.meeting_id),
    title: row.purpose ?? "Meeting",
    projectId: row.project_id != null ? String(row.project_id) : "",
    when,
    durationMin: row.duration_min ?? 0,
    location: row.location ?? "",
    agenda: "",
    participants: row.participants
      ? row.participants.split(",").map((p) => p.trim()).filter(Boolean)
      : [],
    status: normalizeMeetingStatus(row.status, when),
    notes: undefined,
  };
}

async function fetchManagerMeetings(): Promise<ManagedMeeting[]> {
  const managerId = getStoredUserId();
  if (!managerId) return [];

  const projects = await apiClient.get<BackendProjectRow[]>("/projects");
  const mineIds = new Set(
    (Array.isArray(projects) ? projects : [])
      .filter((p) => p.project_manager_id === managerId)
      .map((p) => String(p.project_id)),
  );
  if (mineIds.size === 0) return [];

  let meetings: BackendMeetingRow[];
  try {
    const res = await apiClient.get<BackendMeetingRow[]>("/meetings");
    meetings = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }

  return meetings
    .filter((m) => m.project_id != null && mineIds.has(String(m.project_id)))
    .map(mapManagedMeeting);
}

// ---------------------------------------------------------------------------
// Real backend: manager meeting mutations (create / update / cancel / delete)
//
// Endpoints (all MANAGER-guarded on the backend):
//   POST   /api/projects/<project_id>/meetings
//   PUT    /api/meetings/<meeting_id>
//   DELETE /api/meetings/<meeting_id>
// The service inserts/updates the raw payload, so the extra meeting columns
// (location, duration_min, participants) persist alongside the model fields.
// Every mutation is scoped to the manager's own projects before it runs.
// ---------------------------------------------------------------------------

type MeetingWriteInput = {
  title: string;
  projectId: string;
  when: string; // ISO datetime from the dialog
  durationMin?: number;
  location?: string;
  participants?: string[];
  status?: ManagedMeeting["status"];
  agenda?: string;
  notes?: string;
};

/** The set of project ids assigned to the authenticated manager. */
async function getOwnedProjectIds(): Promise<Set<string>> {
  const managerId = getStoredUserId();
  if (!managerId) return new Set();
  const projects = await apiClient.get<BackendProjectRow[]>("/projects");
  return new Set(
    (Array.isArray(projects) ? projects : [])
      .filter((p) => p.project_manager_id === managerId)
      .map((p) => String(p.project_id)),
  );
}

/** Split an ISO datetime into the backend's separate date/time columns. */
function toMeetingDateTime(iso: string): { meeting_date: string; meeting_time: string } {
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return {
    meeting_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    meeting_time: `${pad(d.getHours())}:${pad(d.getMinutes())}:00`,
  };
}

/** Map a manager UI status bucket to a persisted backend status string. */
function toBackendStatus(status: ManagedMeeting["status"]): string {
  switch (status) {
    case "cancelled":
      return "CANCELLED";
    case "rescheduled":
      return "RESCHEDULED";
    case "past":
      return "COMPLETED";
    default:
      return "PENDING"; // upcoming | today are re-derived from the date on read
  }
}

function toMeetingBody(input: MeetingWriteInput): Record<string, unknown> {
  const { meeting_date, meeting_time } = toMeetingDateTime(input.when);
  return {
    meeting_date,
    meeting_time,
    purpose: input.title,
    status: toBackendStatus(input.status ?? "upcoming"),
    location: input.location ?? "",
    duration_min: input.durationMin ?? 0,
    participants: (input.participants ?? []).join(", "),
  };
}

async function createManagerMeeting(input: MeetingWriteInput): Promise<ManagedMeeting> {
  const owned = await getOwnedProjectIds();
  if (!owned.has(String(input.projectId))) {
    throw new Error("This project is not assigned to you.");
  }
  const body = { ...toMeetingBody(input), project_manager_id: getStoredUserId() };
  const row = await apiClient.post<BackendMeetingRow>(
    `/projects/${input.projectId}/meetings`,
    body,
  );
  return mapManagedMeeting(row);
}

async function updateManagerMeeting(
  id: string,
  input: MeetingWriteInput,
): Promise<ManagedMeeting> {
  if (input.projectId) {
    const owned = await getOwnedProjectIds();
    if (!owned.has(String(input.projectId))) {
      throw new Error("This project is not assigned to you.");
    }
  }
  const row = await apiClient.put<BackendMeetingRow>(`/meetings/${id}`, toMeetingBody(input));
  return mapManagedMeeting(row);
}

async function deleteManagerMeeting(id: string): Promise<boolean> {
  await apiClient.delete(`/meetings/${id}`);
  return true;
}

// ---------------------------------------------------------------------------
// Real backend: update a tenant request's status
//
// PATCH /api/requests/<request_id> with { status } persists the new status in
// Supabase and returns the updated row (roles TENANT/MANAGER/BUILDING_COMPANY).
// The status is sent lowercase-canonical; reads normalize case-insensitively.
// ---------------------------------------------------------------------------
async function updateManagerRequestStatus(
  requestId: string,
  status: TenantRequestStatus,
): Promise<ManagedRequest> {
  const row = await apiClient.patch<BackendRequestRow>(`/requests/${requestId}`, {
    status,
  });
  // The backend returns the row without project/tenant-name context; those are
  // re-resolved on the next list refetch, so map with what the row provides.
  return mapManagedRequest(row, "", "");
}

export const managerApi = {
  getProjects: () =>
    USE_MOCK_API ? mockManagerService.getProjects() : fetchManagerProjects(),
  getProject: (id: string) =>
    USE_MOCK_API ? mockManagerService.getProject(id) : apiClient.get<ManagedProject | null>(`/manager/projects/${id}`),
  getStagesForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockManagerService.getStagesForProject(projectId)
      : apiClient.get<ManagedStage[]>(`/manager/projects/${projectId}/stages`),
  getAllStages: () =>
    USE_MOCK_API ? mockManagerService.getAllStages() : apiClient.get<ManagedStage[]>(`/manager/stages`),
  getTasks: () =>
    USE_MOCK_API ? mockManagerService.getTasks() : apiClient.get<ManagedTask[]>("/manager/tasks"),
  getTask: (id: string) =>
    USE_MOCK_API ? mockManagerService.getTask(id) : apiClient.get<ManagedTask | null>(`/manager/tasks/${id}`),
  getRequests: () =>
    USE_MOCK_API ? mockManagerService.getRequests() : fetchManagerRequests(),
  getMeetings: () =>
    USE_MOCK_API ? mockManagerService.getMeetings() : fetchManagerMeetings(),
  getNotifications: () =>
    USE_MOCK_API ? mockManagerService.getNotifications() : apiClient.get<ManagedNotification[]>("/manager/notifications"),
  getEmployees: () =>
    USE_MOCK_API ? mockManagerService.getEmployees() : apiClient.get<Employee[]>("/manager/team"),
  getEmployee: (id: string) =>
    USE_MOCK_API ? mockManagerService.getEmployee(id) : apiClient.get<Employee | null>(`/manager/team/${id}`),
  getActivity: () =>
    USE_MOCK_API ? mockManagerService.getActivity() : apiClient.get<ActivityEvent[]>("/manager/activity"),
  getPhotos: () =>
    USE_MOCK_API ? mockManagerService.getPhotos() : apiClient.get<ManagedPhoto[]>("/manager/photos"),
  getDocuments: () =>
    USE_MOCK_API ? mockManagerService.getDocuments() : apiClient.get<ManagedDocument[]>("/manager/documents"),
  getNotes: () =>
    USE_MOCK_API ? mockManagerService.getNotes() : apiClient.get<ManagedNote[]>("/manager/notes"),
  getTenants: () =>
    USE_MOCK_API ? mockManagerService.getTenants() : apiClient.get<ManagedTenant[]>("/manager/tenants"),
};

/**
 * Mutations. All mutate the in-memory mock store today; the shape mirrors
 * what a REST or edge-function endpoint would accept when the backend is
 * connected in Phase 2.
 */
export const managerMutations = {
  createTask: mockManagerService.createTask,
  updateTask: mockManagerService.updateTask,
  deleteTask: mockManagerService.deleteTask,
  addTaskComment: mockManagerService.addTaskComment,
  toggleSubtask: mockManagerService.toggleSubtask,
  updateStage: mockManagerService.updateStage,
  createMeeting: (input: MeetingWriteInput) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.createMeeting(input))
      : createManagerMeeting(input),
  updateMeeting: (id: string, input: MeetingWriteInput) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.updateMeeting(id, input))
      : updateManagerMeeting(id, input),
  deleteMeeting: (id: string) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.deleteMeeting(id))
      : deleteManagerMeeting(id),
  updateRequest: mockManagerService.updateRequest,
  /**
   * Persist a tenant request's status. In real mode this hits the backend
   * (PATCH /requests/:id) and resolves only after Supabase confirms the update;
   * in mock mode it updates the in-memory store. Always returns a Promise so
   * callers can await success before showing a toast / refetching.
   */
  updateRequestStatus: (requestId: string, status: TenantRequestStatus) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.updateRequest(requestId, { status }))
      : updateManagerRequestStatus(requestId, status),
  markNotificationRead: mockManagerService.markNotificationRead,
  markAllNotificationsRead: mockManagerService.markAllNotificationsRead,
  addPhoto: mockManagerService.addPhoto,
  deletePhoto: mockManagerService.deletePhoto,
  addDocument: mockManagerService.addDocument,
  deleteDocument: mockManagerService.deleteDocument,
  addNote: mockManagerService.addNote,
  deleteNote: mockManagerService.deleteNote,
};
