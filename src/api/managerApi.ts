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
  type TaskStatus,
  type TaskPriority,
  type ManagedRequest,
  type ManagedMeeting,
  type ManagedNotification,
  type Employee,
  type ActivityEvent,
  type ManagedPhoto,
  type ManagedDocument,
  type ManagedDocumentCategory,
  type ManagedNote,
  type ManagedTenant,
  type ProjectStageKey,
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
  // The UI has no dedicated "in progress" status; map it explicitly to on_track
  // (the only healthy in-flight bucket) rather than relying on a fallthrough.
  if (["on_track", "on track", "in progress", "in_progress", "active", "ongoing"].includes(s)) {
    return "on_track";
  }
  return "on_track";
}

/**
 * Build the project summary from its REAL progress rows — the same source the
 * Construction Stages page uses (mapManagedStages). No second progress
 * algorithm: overall progress is the average of the mapped per-stage progress
 * values, and the current stage / date range come straight from those rows.
 * The backend projects table has no progress/stage/date columns, so any field
 * without a real source is left empty (never faked to "today").
 */
function averageStageProgress(stages: ManagedStage[]): number {
  if (stages.length === 0) return 0;
  const sum = stages.reduce((acc, s) => acc + (s.progress || 0), 0);
  return Math.round(sum / stages.length);
}

function pickCurrentStageKey(stages: ManagedStage[]): ProjectStageKey {
  const current = stages.find((s) => s.status === "current");
  if (current) return current.key;
  const firstIncomplete = stages.find((s) => s.status !== "completed");
  if (firstIncomplete) return firstIncomplete.key;
  return stages[stages.length - 1]?.key ?? CANONICAL_STAGE_KEYS[0];
}

/** Literal backend task_name of the current stage row (fallback: first
 *  non-completed), ordered by the shared construction sequence. Returns "" when
 *  no real row has a task_name, so the UI falls back to the canonical label. */
function pickCurrentStageLabel(rows: BackendProgressRow[]): string {
  const ordered = [...rows].sort((a, b) => {
    const rank = stageSequenceRank(a.task_name) - stageSequenceRank(b.task_name);
    if (rank !== 0) return rank;
    return safeDate(a.start_date).localeCompare(safeDate(b.start_date));
  });
  const current = ordered.find((r) => normalizeStageStatus(r.status) === "current");
  const chosen = current ?? ordered.find((r) => normalizeStageStatus(r.status) !== "completed");
  return (chosen?.task_name ?? "").trim();
}

/** Earliest real start_date and latest real end_date across progress rows.
 *  ISO YYYY-MM-DD strings sort lexicographically. Nulls are ignored; when no
 *  real date exists the field stays "" so the UI can render a neutral "—". */
function progressDateRange(rows: BackendProgressRow[]): { earliestStart: string; latestEnd: string } {
  let earliestStart = "";
  let latestEnd = "";
  for (const r of rows) {
    if (r.start_date && (!earliestStart || r.start_date < earliestStart)) earliestStart = r.start_date;
    if (r.end_date && (!latestEnd || r.end_date > latestEnd)) latestEnd = r.end_date;
  }
  return { earliestStart, latestEnd };
}

function buildManagedProject(row: BackendProjectRow, progressRows: BackendProgressRow[]): ManagedProject {
  const stages = mapManagedStages(progressRows);
  const { earliestStart, latestEnd } = progressDateRange(progressRows);
  return {
    id: String(row.project_id),
    name: row.project_name ?? "",
    clientName: "",
    address: row.location ?? "",
    progress: averageStageProgress(stages),
    currentStage: pickCurrentStageKey(stages),
    currentStageLabel: pickCurrentStageLabel(progressRows) || undefined,
    expectedCompletion: latestEnd,
    startDate: earliestStart,
    status: normalizeProjectStatus(row.status),
    budget: { planned: 0, spent: 0, currency: "" },
    description: row.description ?? "",
    team: [],
    building: "",
    entrance: "",
    // No backend "last updated" column exists; leave empty rather than faking today.
    updatedAt: "",
  };
}

/** Group progress rows by project id for cheap per-project lookup. */
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

async function fetchManagerProjects(): Promise<ManagedProject[]> {
  const managerId = getStoredUserId();
  if (!managerId) return [];
  const rows = await apiClient.get<BackendProjectRow[]>("/projects");
  const owned = (Array.isArray(rows) ? rows : []).filter((r) => r.project_manager_id === managerId);
  if (owned.length === 0) return [];

  // Fetch all progress once and derive each project's summary from it.
  let progress: BackendProgressRow[] = [];
  try {
    const res = await apiClient.get<BackendProgressRow[]>("/progress");
    progress = Array.isArray(res) ? res : [];
  } catch {
    progress = [];
  }
  const byProject = groupProgressByProject(progress);
  return owned.map((r) => buildManagedProject(r, byProject.get(String(r.project_id)) ?? []));
}

/**
 * Real single-project fetch — replaces the dead GET /manager/projects/<id>.
 * Reuses GET /projects with the manager ownership check, then the project's
 * real progress rows to build the exact same summary as the list card.
 */
async function fetchManagerProject(id: string): Promise<ManagedProject | null> {
  const managerId = getStoredUserId();
  if (!managerId) return null;
  const rows = await apiClient.get<BackendProjectRow[]>("/projects");
  const row = (Array.isArray(rows) ? rows : []).find(
    (r) => String(r.project_id) === String(id) && r.project_manager_id === managerId,
  );
  if (!row) return null;
  let progress: BackendProgressRow[] = [];
  try {
    const res = await apiClient.get<BackendProgressRow[]>(`/projects/${id}/progress`);
    progress = Array.isArray(res) ? res : [];
  } catch {
    progress = [];
  }
  return buildManagedProject(row, progress);
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

/**
 * Approve a meeting via a status-only PUT. "APPROVED" is the canonical status
 * used by the app's meeting-approval concept (see the meeting_approved activity
 * event); the backend update accepts a partial body and persists just status.
 */
async function approveManagerMeeting(id: string): Promise<ManagedMeeting> {
  const row = await apiClient.put<BackendMeetingRow>(`/meetings/${id}`, {
    status: "APPROVED",
  });
  return mapManagedMeeting(row);
}

// ---------------------------------------------------------------------------
// Real backend: manager site photos
//
// Photos are image rows: GET /api/images (all projects) — each carries a
// project_id — plus POST /api/projects/<id>/images and DELETE /api/images/<id>
// (both MANAGER-guarded), the same endpoints the tenant reads. Ownership is
// derived like projects/meetings: keep only images whose project_id belongs to
// a project assigned to the authenticated manager.
// ---------------------------------------------------------------------------

type BackendImageRow = {
  image_id: string | number;
  project_id: string | number | null;
  title: string | null;
  stage: string | null;
  upload_date: string | null;
  image_url?: string | null;
  image_path?: string | null;
};

type PhotoWriteInput = {
  projectId: string;
  stageKey: ProjectStageKey;
  title: string;
  uploadedBy?: string;
  imagePath?: string;
  imageUrl?: string;
  description?: string;
};

// Deterministic gradient seed so a given image always renders the same swatch
// (the manager UI shows a colored placeholder, not the stored image itself).
const PHOTO_SWATCHES = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
function swatchFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PHOTO_SWATCHES[h % PHOTO_SWATCHES.length];
}

/** Best-effort map of a free-form backend image stage to a canonical stage key. */
function toManagerStageKey(stage: string | null | undefined): ProjectStageKey {
  const s = (stage ?? "").trim().toLowerCase();
  if (s.includes("electric")) return "electrical";
  if (s.includes("plaster")) return "plaster";
  if (s.includes("window")) return "windows";
  if (s.includes("finish") || s.includes("interior")) return "finishing";
  if (s.includes("handover") || s.includes("hand over")) return "handover";
  // site preparation, foundation, structure construction, or unknown/empty
  return "structural";
}

function mapManagedPhoto(row: BackendImageRow): ManagedPhoto {
  return {
    id: String(row.image_id),
    projectId: row.project_id != null ? String(row.project_id) : "",
    stageKey: toManagerStageKey(row.stage),
    title: row.title ?? "Project photo",
    uploadedBy: "",
    uploadedAt: safeDate(row.upload_date),
    color: swatchFor(String(row.image_id)),
    // Prefer the stored public URL; `||` (not `??`) so empty strings fall back.
    url: row.image_url || row.image_path || undefined,
  };
}

async function fetchManagerPhotos(): Promise<ManagedPhoto[]> {
  const managerId = getStoredUserId();
  if (!managerId) return [];

  const projects = await apiClient.get<BackendProjectRow[]>("/projects");
  const mineIds = new Set(
    (Array.isArray(projects) ? projects : [])
      .filter((p) => p.project_manager_id === managerId)
      .map((p) => String(p.project_id)),
  );
  if (mineIds.size === 0) return [];

  let images: BackendImageRow[];
  try {
    const res = await apiClient.get<BackendImageRow[]>("/images");
    images = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }

  return images
    .filter((i) => i.project_id != null && mineIds.has(String(i.project_id)))
    .map(mapManagedPhoto);
}

async function createManagerPhoto(input: PhotoWriteInput): Promise<ManagedPhoto> {
  const owned = await getOwnedProjectIds();
  if (!owned.has(String(input.projectId))) {
    throw new Error("This project is not assigned to you.");
  }
  // The file is uploaded to Supabase Storage first; its public URL is stored in
  // both image_url and image_path (image_path is NOT NULL). A missing URL falls
  // back to the file name only for non-storage/mock paths.
  const url = input.imageUrl ?? input.imagePath ?? input.title ?? "photo";
  const body = {
    image_path: url,
    image_url: input.imageUrl ?? url,
    title: input.title,
    description: input.description ?? "",
    stage: input.stageKey,
    upload_date: new Date().toISOString().slice(0, 10),
  };
  const row = await apiClient.post<BackendImageRow>(
    `/projects/${input.projectId}/images`,
    body,
  );
  return mapManagedPhoto(row);
}

async function deleteManagerPhoto(id: string): Promise<boolean> {
  await apiClient.delete(`/images/${id}`);
  return true;
}

// ---------------------------------------------------------------------------
// Real backend: manager documents
//
// Documents live at GET /api/projects/<id>/documents (per project) plus
// POST /api/projects/<id>/documents and DELETE /api/documents/<id> (both
// MANAGER/BUILDING_COMPANY-guarded) — the same rows the tenant reads. Listing
// is scoped to the manager's owned projects by fetching each owned project's
// documents and combining. The actual file is uploaded to the
// `project-documents` Storage bucket first; its public URL is stored in file_url.
// ---------------------------------------------------------------------------

type BackendDocumentRow = {
  document_id: string | number;
  project_id: string | number | null;
  file_name: string | null;
  upload_date: string | null;
  category?: string | null;
  file_url?: string | null;
};

type DocumentWriteInput = {
  projectId: string;
  stageKey?: ProjectStageKey;
  name: string;
  category: ManagedDocumentCategory;
  version?: string;
  size?: string;
  uploadedBy?: string;
  fileUrl?: string;
};

const DOC_CATEGORIES: ManagedDocumentCategory[] = ["contract", "permit", "drawing", "report", "invoice"];

/** Normalize a free-form backend category to a canonical one (defaults to report). */
function mapDocumentCategory(value: string | null | undefined): ManagedDocumentCategory {
  const s = (value ?? "").trim().toLowerCase();
  return (DOC_CATEGORIES as string[]).includes(s) ? (s as ManagedDocumentCategory) : "report";
}

function mapManagedDocument(row: BackendDocumentRow): ManagedDocument {
  return {
    id: String(row.document_id),
    projectId: row.project_id != null ? String(row.project_id) : "",
    name: row.file_name ?? "Document",
    category: mapDocumentCategory(row.category),
    // The backend documents schema has no size/version columns.
    size: "",
    version: "",
    uploadedBy: "",
    uploadedAt: safeDate(row.upload_date),
    url: row.file_url || undefined,
  };
}

async function fetchManagerDocuments(): Promise<ManagedDocument[]> {
  const owned = await getOwnedProjectIds();
  if (owned.size === 0) return [];
  const perProject = await Promise.all(
    [...owned].map((pid) =>
      apiClient
        .get<BackendDocumentRow[]>(`/projects/${pid}/documents`)
        .then((res) => (Array.isArray(res) ? res : []))
        .catch(() => [] as BackendDocumentRow[]),
    ),
  );
  return perProject.flat().map(mapManagedDocument);
}

async function createManagerDocument(input: DocumentWriteInput): Promise<ManagedDocument> {
  const owned = await getOwnedProjectIds();
  if (!owned.has(String(input.projectId))) {
    throw new Error("This project is not assigned to you.");
  }
  // project_id comes from the URL only; upload_date defaults server-side but is
  // set explicitly for consistency. file_url is the public Storage URL.
  const body = {
    file_name: input.name,
    file_url: input.fileUrl ?? "",
    category: input.category,
    upload_date: new Date().toISOString().slice(0, 10),
  };
  const row = await apiClient.post<BackendDocumentRow>(
    `/projects/${input.projectId}/documents`,
    body,
  );
  return mapManagedDocument(row);
}

async function deleteManagerDocument(id: string): Promise<boolean> {
  await apiClient.delete(`/documents/${id}`);
  return true;
}

// ---------------------------------------------------------------------------
// Real backend: manager construction stages (backed by the `progress` table)
//
// "Stages" are progress rows: GET /api/progress (all) — each carries a
// project_id — GET /api/projects/<id>/progress (per project), and
// PUT /api/progress/<id> (MANAGER/BUILDING_COMPANY). Listing is scoped to the
// manager's owned projects, then rows are grouped per project, ordered by the
// real construction sequence, and assigned canonical stage keys by index
// (mirroring the tenant timeline) so keys never collide and the sequence holds.
// ---------------------------------------------------------------------------

type BackendProgressRow = {
  progress_id: string | number;
  project_id: string | number | null;
  task_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  progress_percent?: number | null;
};

// Canonical stage keys and the real-world construction sequence — identical to
// the tenant timeline conventions so both roles order/label stages the same way.
const CANONICAL_STAGE_KEYS: ProjectStageKey[] = [
  "structural",
  "electrical",
  "plaster",
  "windows",
  "finishing",
  "handover",
];
const STAGE_SEQUENCE: string[] = [
  "site preparation",
  "foundation",
  "structure construction",
  "electrical installation",
  "interior finishing",
];
function stageSequenceRank(taskName: string | null | undefined): number {
  const i = STAGE_SEQUENCE.indexOf((taskName ?? "").trim().toLowerCase());
  return i === -1 ? STAGE_SEQUENCE.length : i;
}

/** Map a free-form backend progress status to the frontend stage status. */
function normalizeStageStatus(status: string | null | undefined): ManagedStage["status"] {
  const s = (status ?? "").toLowerCase();
  if (/(complet|done|finish|closed)/.test(s)) return "completed";
  if (/(delay|late|behind|block|stuck)/.test(s)) return "delayed";
  if (/(progress|current|ongoing|active|started)/.test(s)) return "current";
  return "pending";
}

/** Derive a progress percent from status (same convention as the tenant timeline). */
function stageProgressForStatus(status: ManagedStage["status"]): number {
  switch (status) {
    case "completed":
      return 100;
    case "current":
      return 50;
    case "delayed":
      return 25;
    default:
      return 0;
  }
}

function mapManagedStage(row: BackendProgressRow, key: ProjectStageKey): ManagedStage {
  const status = normalizeStageStatus(row.status);
  return {
    id: String(row.progress_id),
    projectId: row.project_id != null ? String(row.project_id) : "",
    key,
    status,
    // Prefer the real persisted percentage; fall back to the status-derived
    // value only for legacy rows where progress_percent is null.
    progress:
      typeof row.progress_percent === "number"
        ? row.progress_percent
        : stageProgressForStatus(status),
    // The progress table has no columns for these; default them safely.
    responsibleCompany: "",
    estimatedCompletion: safeDate(row.end_date),
    actualCompletion: status === "completed" ? safeDate(row.end_date) : undefined,
    delayDays: 0,
    photosCount: 0,
    documentsCount: 0,
    commentsCount: 0,
    notes: "",
  };
}

/**
 * Group progress rows per project, order each project's rows by the real
 * construction sequence (then start_date), and assign canonical stage keys by
 * index so keys never collide and the sequence is preserved.
 */
function mapManagedStages(rows: BackendProgressRow[]): ManagedStage[] {
  const byProject = new Map<string, BackendProgressRow[]>();
  for (const row of rows) {
    if (row.project_id == null) continue;
    const pid = String(row.project_id);
    const list = byProject.get(pid) ?? [];
    list.push(row);
    byProject.set(pid, list);
  }

  const out: ManagedStage[] = [];
  for (const list of byProject.values()) {
    const ordered = [...list].sort((a, b) => {
      const rank = stageSequenceRank(a.task_name) - stageSequenceRank(b.task_name);
      if (rank !== 0) return rank;
      return safeDate(a.start_date).localeCompare(safeDate(b.start_date));
    });
    ordered.slice(0, CANONICAL_STAGE_KEYS.length).forEach((row, index) => {
      out.push(mapManagedStage(row, CANONICAL_STAGE_KEYS[index]));
    });
  }
  return out;
}

async function fetchManagerStages(): Promise<ManagedStage[]> {
  const owned = await getOwnedProjectIds();
  if (owned.size === 0) return [];
  let rows: BackendProgressRow[];
  try {
    const res = await apiClient.get<BackendProgressRow[]>("/progress");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
  return mapManagedStages(
    rows.filter((r) => r.project_id != null && owned.has(String(r.project_id))),
  );
}

async function fetchManagerStagesForProject(projectId: string): Promise<ManagedStage[]> {
  const owned = await getOwnedProjectIds();
  if (!owned.has(String(projectId))) return [];
  let rows: BackendProgressRow[];
  try {
    const res = await apiClient.get<BackendProgressRow[]>(`/projects/${projectId}/progress`);
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
  return mapManagedStages(rows);
}

type StagePatch = Partial<
  Pick<ManagedStage, "progress" | "status" | "notes" | "estimatedCompletion" | "actualCompletion">
> & { startDate?: string; endDate?: string };

/**
 * Persist a stage update to its progress row. Only columns the progress table
 * actually has are sent: status, start_date, end_date, progress_percent. notes
 * and responsibleCompany have no columns and are intentionally NOT persisted.
 * Dates are sent as YYYY-MM-DD (the backend parses with date.fromisoformat).
 */
async function updateManagerStage(progressId: string, patch: StagePatch): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.status) body.status = patch.status;
  if (typeof patch.progress === "number") {
    body.progress_percent = Math.max(0, Math.min(100, Math.round(patch.progress)));
  }
  const start = patch.startDate;
  const end = patch.endDate ?? patch.estimatedCompletion;
  if (start) body.start_date = String(start).slice(0, 10);
  if (end) body.end_date = String(end).slice(0, 10);
  // Nothing persistable was provided — avoid an empty-body 400 from the backend.
  if (Object.keys(body).length === 0) return;
  await apiClient.put(`/progress/${progressId}`, body);
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

// ---------------------------------------------------------------------------
// Real backend: manager tasks (backed by the public.tasks table)
//
// GET /api/tasks (all) — each row carries a project_id — GET /api/tasks/<id>,
// POST /api/projects/<id>/tasks, PUT|PATCH /api/tasks/<id>, DELETE /api/tasks/<id>.
// Listing is scoped to the manager's owned projects (projects.project_manager_id
// === user_id). Unsupported legacy fields (tags/subtasks/attachments/comments/
// activity) are defaulted to empty arrays — never fabricated.
// ---------------------------------------------------------------------------

type BackendTaskRow = {
  task_id: string | number;
  project_id: string | number | null;
  title: string | null;
  description: string | null;
  assigned_to: string | null;
  stage: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  progress_percent: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type TaskWriteInput = {
  title: string;
  projectId: string;
  description?: string;
  assignedTo?: string;
  stageKey?: ProjectStageKey;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  tags?: string[];
};

const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];

/** Map a free-form backend status to the frontend TaskStatus enum. */
function normalizeTaskStatus(value: string | null | undefined): TaskStatus {
  const v = (value ?? "").trim().toLowerCase();
  if (["in_progress", "current", "active", "started", "ongoing"].includes(v)) return "in_progress";
  if (["waiting", "on_hold", "hold", "paused"].includes(v)) return "waiting";
  if (["completed", "complete", "done", "finished", "closed"].includes(v)) return "completed";
  if (["blocked", "stuck"].includes(v)) return "blocked";
  // "pending"/"not_started"/"todo"/unknown all collapse to the safe default.
  return "not_started";
}

/** Map a free-form backend priority to the frontend TaskPriority enum. */
function normalizeTaskPriority(value: string | null | undefined): TaskPriority {
  const v = (value ?? "").trim().toLowerCase();
  return (TASK_PRIORITIES as string[]).includes(v) ? (v as TaskPriority) : "medium";
}

/** Map a stored stage text to a canonical stage key, or undefined if unknown. */
function toTaskStageKey(stage: string | null | undefined): ProjectStageKey | undefined {
  const v = (stage ?? "").trim().toLowerCase();
  return (CANONICAL_STAGE_KEYS as string[]).includes(v) ? (v as ProjectStageKey) : undefined;
}

function mapManagedTask(row: BackendTaskRow): ManagedTask {
  return {
    id: String(row.task_id),
    title: row.title ?? "",
    description: row.description ?? "",
    assignedTo: row.assigned_to ?? "",
    projectId: row.project_id != null ? String(row.project_id) : "",
    stageKey: toTaskStageKey(row.stage),
    dueDate: safeDate(row.due_date),
    priority: normalizeTaskPriority(row.priority),
    status: normalizeTaskStatus(row.status),
    progress: typeof row.progress_percent === "number" ? row.progress_percent : 0,
    // No backend columns for these yet (Phase 1) — default, never fabricate.
    tags: [],
    subtasks: [],
    attachments: [],
    comments: [],
    activity: [],
    createdAt: safeDate(row.created_at),
  };
}

/** Build a backend task body from the UI input, sending only provided fields. */
function toTaskBody(input: Partial<TaskWriteInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.description !== undefined) body.description = input.description;
  if (input.assignedTo !== undefined) body.assigned_to = input.assignedTo;
  if (input.stageKey !== undefined) body.stage = input.stageKey ?? null;
  if (input.dueDate !== undefined) body.due_date = input.dueDate ? String(input.dueDate).slice(0, 10) : null;
  if (input.priority !== undefined) body.priority = input.priority;
  if (input.status !== undefined) body.status = input.status;
  if (typeof input.progress === "number") {
    body.progress_percent = Math.max(0, Math.min(100, Math.round(input.progress)));
  }
  return body;
}

async function fetchManagerTasks(): Promise<ManagedTask[]> {
  const owned = await getOwnedProjectIds();
  if (owned.size === 0) return [];
  let rows: BackendTaskRow[];
  try {
    const res = await apiClient.get<BackendTaskRow[]>("/tasks");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
  return rows
    .filter((r) => r.project_id != null && owned.has(String(r.project_id)))
    .map(mapManagedTask);
}

async function fetchManagerTask(id: string): Promise<ManagedTask | null> {
  try {
    const row = await apiClient.get<BackendTaskRow>(`/tasks/${id}`);
    return row ? mapManagedTask(row) : null;
  } catch {
    return null;
  }
}

async function createManagerTask(input: TaskWriteInput): Promise<ManagedTask> {
  const row = await apiClient.post<BackendTaskRow>(`/projects/${input.projectId}/tasks`, toTaskBody(input));
  return mapManagedTask(row);
}

async function updateManagerTask(id: string, patch: Partial<TaskWriteInput>): Promise<ManagedTask> {
  const row = await apiClient.put<BackendTaskRow>(`/tasks/${id}`, toTaskBody(patch));
  return mapManagedTask(row);
}

async function deleteManagerTask(id: string): Promise<boolean> {
  await apiClient.delete(`/tasks/${id}`);
  return true;
}

// ---------------------------------------------------------------------------
// Real backend: manager team members (backed by the public.team_members table)
//
// GET /api/team (all) — each row carries a project_id — GET /api/team/<id>,
// POST /api/projects/<id>/team, PUT|PATCH /api/team/<id>, DELETE /api/team/<id>.
// Listing is scoped to the manager's owned projects (projects.project_manager_id
// === user_id). Workload has NO backend column: it is a Phase-1 approximation
// computed from real tasks (see computeWorkload).
// ---------------------------------------------------------------------------

type BackendTeamMemberRow = {
  member_id: string | number;
  project_id: string | number | null;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  availability: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/** Map a free-form backend availability to the frontend Employee availability. */
function normalizeAvailability(value: string | null | undefined): Employee["availability"] {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "busy") return "busy";
  if (v === "off") return "off";
  return "available";
}

/**
 * Phase-1 workload approximation: count the member's active (non-completed)
 * assigned tasks by matching tasks.assigned_to text against the member name
 * (case-insensitive, trimmed), then scale to a percentage and clamp to 0-100.
 * There is no stored workload column and no fabricated value — 0 when there are
 * no matching tasks. This intentionally does not touch the tasks schema.
 */
function computeWorkload(name: string | null | undefined, tasks: ManagedTask[]): number {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return 0;
  const active = tasks.filter(
    (t) => (t.assignedTo ?? "").trim().toLowerCase() === key && t.status !== "completed",
  ).length;
  return Math.max(0, Math.min(100, active * 25));
}

function mapEmployee(row: BackendTeamMemberRow, workload = 0): Employee {
  return {
    id: String(row.member_id),
    name: row.name ?? "",
    role: row.role ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    avatarSeed: row.name ?? String(row.member_id),
    workload,
    availability: normalizeAvailability(row.availability),
    projectIds: row.project_id != null ? [String(row.project_id)] : [],
    lastActive: safeDate(row.updated_at ?? row.created_at),
  };
}

async function fetchManagerTeam(): Promise<Employee[]> {
  const owned = await getOwnedProjectIds();
  if (owned.size === 0) return [];
  let rows: BackendTeamMemberRow[];
  try {
    const res = await apiClient.get<BackendTeamMemberRow[]>("/team");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
  const members = rows.filter((r) => r.project_id != null && owned.has(String(r.project_id)));
  // Reuse the owner-scoped task list so workload reflects the manager's real tasks.
  let tasks: ManagedTask[] = [];
  try {
    tasks = await fetchManagerTasks();
  } catch {
    tasks = [];
  }
  return members.map((r) => mapEmployee(r, computeWorkload(r.name, tasks)));
}

type TeamMemberWriteInput = {
  projectId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  availability?: Employee["availability"];
};

/**
 * Create a team member under a project via POST /api/projects/<id>/team.
 * Ownership is enforced: creation is rejected client-side for a project the
 * authenticated manager does not own (the backend also gates by role).
 * A new member has no assigned tasks yet, so workload starts at 0.
 */
async function createManagerTeamMember(input: TeamMemberWriteInput): Promise<Employee> {
  const owned = await getOwnedProjectIds();
  if (!owned.has(String(input.projectId))) {
    throw new Error("You can only add members to your own projects.");
  }
  const row = await apiClient.post<BackendTeamMemberRow>(`/projects/${input.projectId}/team`, {
    name: input.name,
    role: input.role,
    email: input.email,
    phone: input.phone,
    availability: input.availability,
  });
  return mapEmployee(row, 0);
}

async function fetchManagerEmployee(id: string): Promise<Employee | null> {
  let row: BackendTeamMemberRow | null;
  try {
    row = await apiClient.get<BackendTeamMemberRow>(`/team/${id}`);
  } catch {
    return null;
  }
  if (!row) return null;
  let tasks: ManagedTask[] = [];
  try {
    tasks = await fetchManagerTasks();
  } catch {
    tasks = [];
  }
  return mapEmployee(row, computeWorkload(row.name, tasks));
}

// ---------------------------------------------------------------------------
// Real backend: manager activity log
//
// Activity events are server-generated and read-only. GET /api/activity returns
// every event newest-first; we scope to the authenticated manager's owned
// projects client-side, matching the tasks/team/stages ownership pattern.
// ---------------------------------------------------------------------------

type BackendActivityRow = {
  event_id: string | number;
  project_id: string | number | null;
  actor: string | null;
  type: string | null;
  message: string | null;
  created_at: string | null;
};

// The vocabulary the Activity Log UI knows how to render. Unknown/legacy types
// fall back to note_added so an event always has a valid icon/label.
const ACTIVITY_TYPES: ReadonlySet<ActivityEvent["type"]> = new Set([
  "task_completed",
  "task_created",
  "task_updated",
  "task_deleted",
  "meeting_scheduled",
  "meeting_updated",
  "stage_updated",
  "photo_uploaded",
  "document_added",
  "request_received",
  "request_replied",
  "request_approved",
  "request_rejected",
  "note_added",
]);

function toActivityType(raw: string | null): ActivityEvent["type"] {
  const value = (raw ?? "").trim() as ActivityEvent["type"];
  return ACTIVITY_TYPES.has(value) ? value : "note_added";
}

function mapActivityEvent(row: BackendActivityRow): ActivityEvent {
  return {
    id: String(row.event_id),
    type: toActivityType(row.type),
    actor: row.actor ?? "",
    projectId: row.project_id != null ? String(row.project_id) : undefined,
    message: row.message ?? "",
    createdAt: row.created_at ?? "",
  };
}

async function fetchManagerActivity(): Promise<ActivityEvent[]> {
  const owned = await getOwnedProjectIds();
  if (owned.size === 0) return [];
  let rows: BackendActivityRow[];
  try {
    const res = await apiClient.get<BackendActivityRow[]>("/activity");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
  return rows
    .filter((r) => r.project_id != null && owned.has(String(r.project_id)))
    .map(mapActivityEvent);
}

// ---------------------------------------------------------------------------
// Manager notifications (real backend, recipient-scoped server-side)
// ---------------------------------------------------------------------------

type BackendManagerNotificationRow = {
  id: string | number;
  recipient_id?: string | null;
  project_id?: string | number | null;
  type: string | null;
  title: string | null;
  message: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

// The category vocabulary the Notifications UI renders. Unknown/legacy backend
// types safely fall back to "system".
const NOTIFICATION_CATEGORIES: ReadonlySet<ManagedNotification["category"]> = new Set([
  "project",
  "task",
  "meeting",
  "construction",
  "system",
  "request",
]);

function toNotificationCategory(raw: string | null): ManagedNotification["category"] {
  const value = (raw ?? "").trim().toLowerCase() as ManagedNotification["category"];
  return NOTIFICATION_CATEGORIES.has(value) ? value : "system";
}

function mapManagerNotification(row: BackendManagerNotificationRow): ManagedNotification {
  return {
    id: String(row.id),
    category: toNotificationCategory(row.type),
    title: row.title ?? "",
    body: row.message ?? "",
    createdAt: row.created_at ?? "",
    read: row.is_read ?? false,
  };
}

// The backend endpoint is already scoped to the authenticated recipient, so no
// client-side ownership filtering is needed (or trusted) here.
async function fetchManagerNotifications(): Promise<ManagedNotification[]> {
  let rows: BackendManagerNotificationRow[];
  try {
    const res = await apiClient.get<BackendManagerNotificationRow[]>("/manager/notifications");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
  return rows.map(mapManagerNotification);
}

async function markManagerNotificationRead(id: string, read: boolean): Promise<void> {
  await apiClient.patch(`/manager/notifications/${id}/read`, { read });
}

async function markAllManagerNotificationsRead(): Promise<void> {
  await apiClient.post(`/manager/notifications/read-all`, {});
}

export const managerApi = {
  getProjects: () =>
    USE_MOCK_API ? mockManagerService.getProjects() : fetchManagerProjects(),
  getProject: (id: string) =>
    USE_MOCK_API ? mockManagerService.getProject(id) : fetchManagerProject(id),
  getStagesForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockManagerService.getStagesForProject(projectId)
      : fetchManagerStagesForProject(projectId),
  getAllStages: () =>
    USE_MOCK_API ? mockManagerService.getAllStages() : fetchManagerStages(),
  getTasks: () =>
    USE_MOCK_API ? mockManagerService.getTasks() : fetchManagerTasks(),
  getTask: (id: string) =>
    USE_MOCK_API ? mockManagerService.getTask(id) : fetchManagerTask(id),
  getRequests: () =>
    USE_MOCK_API ? mockManagerService.getRequests() : fetchManagerRequests(),
  getMeetings: () =>
    USE_MOCK_API ? mockManagerService.getMeetings() : fetchManagerMeetings(),
  getNotifications: () =>
    USE_MOCK_API ? mockManagerService.getNotifications() : fetchManagerNotifications(),
  getEmployees: () =>
    USE_MOCK_API ? mockManagerService.getEmployees() : fetchManagerTeam(),
  getEmployee: (id: string) =>
    USE_MOCK_API ? mockManagerService.getEmployee(id) : fetchManagerEmployee(id),
  getActivity: () =>
    USE_MOCK_API ? mockManagerService.getActivity() : fetchManagerActivity(),
  getPhotos: () =>
    USE_MOCK_API ? mockManagerService.getPhotos() : fetchManagerPhotos(),
  getDocuments: () =>
    USE_MOCK_API ? mockManagerService.getDocuments() : fetchManagerDocuments(),
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
  createTask: (input: TaskWriteInput) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.createTask({ ...input, assignedTo: input.assignedTo ?? "" }))
      : createManagerTask(input),
  updateTask: (id: string, patch: Partial<TaskWriteInput>) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.updateTask(id, patch))
      : updateManagerTask(id, patch),
  deleteTask: (id: string) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.deleteTask(id))
      : deleteManagerTask(id),
  // Subtasks/comments are not part of Phase 1; they remain mock-only.
  addTaskComment: mockManagerService.addTaskComment,
  toggleSubtask: mockManagerService.toggleSubtask,
  createTeamMember: (input: TeamMemberWriteInput) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.addEmployee(input))
      : createManagerTeamMember(input),
  updateStage: (id: string, patch: StagePatch) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.updateStage(id, patch))
      : updateManagerStage(id, patch),
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
  approveMeeting: (id: string) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.updateMeeting(id, {}))
      : approveManagerMeeting(id),
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
  markNotificationRead: (id: string, read = true) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.markNotificationRead(id, read))
      : markManagerNotificationRead(id, read),
  markAllNotificationsRead: () =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.markAllNotificationsRead())
      : markAllManagerNotificationsRead(),
  addPhoto: (input: PhotoWriteInput) =>
    USE_MOCK_API
      ? Promise.resolve(
          mockManagerService.addPhoto({
            projectId: input.projectId,
            stageKey: input.stageKey,
            title: input.title,
            uploadedBy: input.uploadedBy ?? "Project Manager",
          }),
        )
      : createManagerPhoto(input),
  deletePhoto: (id: string) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.deletePhoto(id))
      : deleteManagerPhoto(id),
  addDocument: (input: DocumentWriteInput) =>
    USE_MOCK_API
      ? Promise.resolve(
          mockManagerService.addDocument({
            projectId: input.projectId,
            stageKey: input.stageKey,
            name: input.name,
            category: input.category,
            size: input.size ?? "—",
            version: input.version ?? "v1",
            uploadedBy: input.uploadedBy ?? "Project Manager",
          }),
        )
      : createManagerDocument(input),
  deleteDocument: (id: string) =>
    USE_MOCK_API
      ? Promise.resolve(mockManagerService.deleteDocument(id))
      : deleteManagerDocument(id),
  addNote: mockManagerService.addNote,
  deleteNote: mockManagerService.deleteNote,
};
