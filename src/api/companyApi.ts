/**
 * Building Company API facade.
 * Uses the mock service when VITE_USE_MOCK_API is true; otherwise proxies to REST endpoints.
 */
import { USE_MOCK_API, AUTH_STORAGE_KEY } from "./config";
import { apiClient } from "./apiClient";
import { orderProgressRowsForStages } from "@/lib/stageOrdering";
import {
  mockCompanyService,
  mockCompanyBus,
  type CompanyProject,
  type CompanyProjectStatus,
  type CompanyStage,
  type CompanyStageStatus,
  type PhotoAsset,
  type DocumentAsset,
  type DocumentCategory,
  type UploadItem,
  type CompanyRequest,
  type CompanyRequestStatus,
  type TaskPriority,
  type CompanyMeeting,
  type CompanyMeetingStatus,
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
  DocumentCategory,
  UploadItem,
  CompanyRequest,
  CompanyMeeting,
  CompanyMeetingStatus,
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
  start_date: string | null;
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

type ManagerProfileRow = {
  user_id?: string | null;
  manager_name?: string | null;
  phone?: string | null;
  // Resolved server-side from Supabase Auth (not stored on project_managers).
  // Best-effort: "" or missing if the Auth lookup failed.
  email?: string | null;
};

async function fetchManagerProfile(managerId: string): Promise<ManagerProfileRow | null> {
  try {
    return await apiClient.get<ManagerProfileRow>(`/managers/${managerId}`);
  } catch {
    return null;
  }
}

async function fetchManagerName(managerId: string): Promise<string> {
  const row = await fetchManagerProfile(managerId);
  return (row?.manager_name ?? "").trim();
}

/** Resolve unique manager ids once per list load. Failures become "". */
async function resolveManagerNames(managerIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(managerIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await fetchManagerName(id)] as const),
  );
  return new Map(entries);
}

/** Resolve unique manager ids to their full profile row. Failures become null (kept out of the map). */
async function resolveManagerProfiles(managerIds: string[]): Promise<Map<string, ManagerProfileRow>> {
  const unique = [...new Set(managerIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await fetchManagerProfile(id)] as const),
  );
  const map = new Map<string, ManagerProfileRow>();
  for (const [id, row] of entries) {
    if (row) map.set(id, row);
  }
  return map;
}

function slugifyManagerName(name: string, fallback: string): string {
  const trimmed = name.trim().toLowerCase().replace(/\s+/g, "-");
  return trimmed || fallback;
}

function mapCompanyProject(
  row: BackendProjectRow,
  progressRows: BackendProgressRow[],
  managerName = "",
): CompanyProject {
  return {
    id: String(row.project_id),
    name: row.project_name ?? "",
    address: row.location ?? "",
    clientName: "",
    projectManager: managerName,
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

/** Unique project_ids owned by the logged-in company, per GET /projects. Empty if no session/no owned projects. */
async function fetchOwnedProjectIds(): Promise<string[]> {
  const companyUserId = getStoredUserId();
  if (!companyUserId) return [];
  const rows = await apiClient.get<BackendProjectRow[]>("/projects");
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => isOwnedByCompany(r, companyUserId))
    .map((r) => String(r.project_id));
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
  const names = await resolveManagerNames(
    owned.map((r) => (r.project_manager_id ? String(r.project_manager_id) : "")),
  );
  return owned.map((r) =>
    mapCompanyProject(
      r,
      byProject.get(String(r.project_id)) ?? [],
      r.project_manager_id ? (names.get(String(r.project_manager_id)) ?? "") : "",
    ),
  );
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
  const managerName = row.project_manager_id
    ? await fetchManagerName(String(row.project_manager_id))
    : "";
  return mapCompanyProject(row, progress, managerName);
}

// ---------------------------------------------------------------------------
// Real backend: project managers listing
//
// There is no "/company/project-managers" endpoint. We derive the list from
// the company's own projects: unique project_manager_id values on projects
// owned by this company, resolved via GET /managers/<id> (best-effort).
// Active project counts are computed by manager id, not by resolved name.
// ---------------------------------------------------------------------------

async function fetchCompanyProjectManagers(): Promise<ProjectManagerPerson[]> {
  const companyUserId = getStoredUserId();
  if (!companyUserId) return [];
  const rows = await apiClient.get<BackendProjectRow[]>("/projects");
  const owned = (Array.isArray(rows) ? rows : []).filter((r) => isOwnedByCompany(r, companyUserId));
  if (owned.length === 0) return [];

  const activeProjectsByManagerId = new Map<string, number>();
  for (const r of owned) {
    if (!r.project_manager_id) continue;
    const id = String(r.project_manager_id);
    activeProjectsByManagerId.set(id, (activeProjectsByManagerId.get(id) ?? 0) + 1);
  }
  const uniqueIds = [...activeProjectsByManagerId.keys()];
  if (uniqueIds.length === 0) return [];

  const profiles = await resolveManagerProfiles(uniqueIds);

  return uniqueIds.map((id) => {
    const profile = profiles.get(id);
    const name = (profile?.manager_name ?? "").trim();
    return {
      id,
      name,
      email: (profile?.email ?? "").trim(),
      phone: (profile?.phone ?? "").trim(),
      avatarSeed: slugifyManagerName(name, id),
      activeProjects: activeProjectsByManagerId.get(id) ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Real backend: apartments (company-scoped)
//
// There is no "/company/apartments" endpoint. Apartments live at the existing
// GET /projects/<project_id>/apartments (and GET /apartments/<apartment_id>).
// We only ever fetch apartments for projects already confirmed to be owned by
// the logged-in company, so the apartment list stays company-scoped without
// needing any backend change.
// ---------------------------------------------------------------------------

type BackendApartmentRow = {
  apartment_id: string | number;
  apartment_number?: string | number | null;
  floor?: string | number | null;
  size?: number | null;
  status?: string | null;
  tenant_id?: string | number | null;
  project_id?: string | number | null;
};

/**
 * The backend apartments table has no building/entrance/rooms columns (mock-only
 * fields). Status is mapped best-effort from the real string; when it doesn't
 * match a known value we infer vacant/assigned from tenant_id presence rather
 * than fabricate a status.
 */
function normalizeApartmentStatus(row: BackendApartmentRow): ApartmentStatus {
  const s = (row.status ?? "").toString().trim().toLowerCase();
  if (["vacant", "empty", "available"].includes(s)) return "vacant";
  if (["assigned", "occupied", "rented", "leased"].includes(s)) return "assigned";
  if (["sold"].includes(s)) return "sold";
  if (["reserved", "pending", "hold", "on_hold"].includes(s)) return "reserved";
  return row.tenant_id != null && row.tenant_id !== "" ? "assigned" : "vacant";
}

function mapCompanyApartment(row: BackendApartmentRow): Apartment {
  return {
    id: String(row.apartment_id),
    projectId: row.project_id != null ? String(row.project_id) : "",
    building: "",
    entrance: "",
    floor: row.floor != null ? String(row.floor) : "",
    number: row.apartment_number != null ? String(row.apartment_number) : "",
    rooms: 0,
    sizeSqm: typeof row.size === "number" ? row.size : 0,
    status: normalizeApartmentStatus(row),
    tenantId: row.tenant_id != null && row.tenant_id !== "" ? String(row.tenant_id) : undefined,
    notes: undefined,
  };
}

/** Raw backend apartment rows for every project owned by the logged-in company. */
async function fetchOwnedApartmentRows(): Promise<BackendApartmentRow[]> {
  const projectIds = await fetchOwnedProjectIds();
  if (projectIds.length === 0) return [];
  const perProject = await Promise.all(
    projectIds.map(async (id) => {
      try {
        const res = await apiClient.get<BackendApartmentRow[]>(`/projects/${id}/apartments`);
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    }),
  );
  return perProject.flat();
}

async function fetchCompanyApartments(): Promise<Apartment[]> {
  const rows = await fetchOwnedApartmentRows();
  return rows.map(mapCompanyApartment);
}

async function fetchCompanyApartmentsForProject(projectId: string): Promise<Apartment[]> {
  const ownedIds = await fetchOwnedProjectIds();
  if (!ownedIds.includes(String(projectId))) return [];
  try {
    const res = await apiClient.get<BackendApartmentRow[]>(`/projects/${projectId}/apartments`);
    return (Array.isArray(res) ? res : []).map(mapCompanyApartment);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Real backend: tenants listing (company-scoped)
//
// There is no "/company/tenants" endpoint. Tenants are derived from the
// tenant_id values on apartments belonging to this company's own projects,
// resolved via the existing GET /tenants/<tenant_id> (best-effort per id).
// ---------------------------------------------------------------------------

type TenantProfileRow = {
  user_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  // Resolved server-side from Supabase Auth (not stored on public.tenants).
  // Best-effort: "" or missing if the Auth lookup failed.
  email?: string | null;
  created_at?: string | null;
};

async function fetchTenantProfile(tenantId: string): Promise<TenantProfileRow | null> {
  try {
    return await apiClient.get<TenantProfileRow>(`/tenants/${tenantId}`);
  } catch {
    return null;
  }
}

/** Resolve unique tenant ids to their profile row. A failed lookup is dropped from the map (skipped), never fabricated. */
async function resolveTenantProfiles(tenantIds: string[]): Promise<Map<string, TenantProfileRow>> {
  const unique = [...new Set(tenantIds.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await fetchTenantProfile(id)] as const),
  );
  const map = new Map<string, TenantProfileRow>();
  for (const [id, row] of entries) {
    if (row) map.set(id, row);
  }
  return map;
}

async function fetchCompanyTenants(): Promise<CompanyTenant[]> {
  const rows = await fetchOwnedApartmentRows();
  const tenantIds = [
    ...new Set(
      rows
        .map((r) => (r.tenant_id != null && r.tenant_id !== "" ? String(r.tenant_id) : ""))
        .filter(Boolean),
    ),
  ];
  if (tenantIds.length === 0) return [];

  const profiles = await resolveTenantProfiles(tenantIds);

  // A failed profile lookup is skipped rather than shown with fabricated data,
  // so one bad tenant_id never breaks the rest of the list.
  return tenantIds
    .filter((id) => profiles.has(id))
    .map((id) => {
      const profile = profiles.get(id)!;
      return {
        id: profile.user_id ? String(profile.user_id) : id,
        name: (profile.full_name ?? "").trim(),
        email: (profile.email ?? "").trim(),
        phone: (profile.phone ?? "").trim(),
        // No nationalId/notes column on public.tenants — never fabricated.
        nationalId: undefined,
        notes: undefined,
        createdAt: (profile.created_at ?? "").trim(),
      };
    });
}

// ---------------------------------------------------------------------------
// Real backend: documents (company-scoped)
//
// There is no "/company/documents" endpoint. Documents live at the existing
// GET /projects/<project_id>/documents (per project) plus
// POST /projects/<project_id>/documents and DELETE /documents/<id> — the same
// rows Manager/Tenant already read (both MANAGER/BUILDING_COMPANY-guarded for
// writes). Listing is scoped to this company's owned project ids by fetching
// each owned project's documents and combining, mirroring
// fetchOwnedApartmentRows(). The actual file bytes are uploaded to the
// `project-documents` Supabase Storage bucket by the caller (src/lib/storage.ts,
// already used by the Manager flow, unchanged here); this module only persists
// the resulting public URL as file_url.
// ---------------------------------------------------------------------------

type BackendDocumentRow = {
  document_id: string | number;
  project_id: string | number | null;
  file_name: string | null;
  upload_date: string | null;
  category?: string | null;
  file_url?: string | null;
};

const DOC_CATEGORIES: DocumentCategory[] = ["contract", "permit", "drawing", "report", "invoice"];

/** Normalize a free-form backend category to a canonical one (defaults to "report", mirroring the Manager document mapping). */
function normalizeDocumentCategory(value: string | null | undefined): DocumentCategory {
  const s = (value ?? "").trim().toLowerCase();
  return (DOC_CATEGORIES as string[]).includes(s) ? (s as DocumentCategory) : "report";
}

function mapCompanyDocument(row: BackendDocumentRow): DocumentAsset {
  return {
    id: String(row.document_id),
    projectId: row.project_id != null ? String(row.project_id) : "",
    name: row.file_name ?? "",
    category: normalizeDocumentCategory(row.category),
    // The backend documents schema has no size/version/uploader columns — never fabricated.
    version: "",
    size: "",
    uploadedBy: "",
    uploadedAt: row.upload_date ?? "",
    url: row.file_url || undefined,
  };
}

/** Fetches each owned project's documents in parallel; a single project's failure never breaks the rest of the list. */
async function fetchCompanyDocuments(): Promise<DocumentAsset[]> {
  const ownedIds = await fetchOwnedProjectIds();
  if (ownedIds.length === 0) return [];
  const perProject = await Promise.all(
    ownedIds.map(async (id) => {
      try {
        const res = await apiClient.get<BackendDocumentRow[]>(`/projects/${id}/documents`);
        return Array.isArray(res) ? res : [];
      } catch {
        return [] as BackendDocumentRow[];
      }
    }),
  );
  return perProject.flat().map(mapCompanyDocument);
}

/**
 * Creates a document row for an already-uploaded file. Verifies projectId is
 * owned by the logged-in company BEFORE calling the backend — the backend's
 * POST /projects/<id>/documents does not itself enforce project ownership, so
 * this client-side check (same pattern as createManagerDocument) is the only
 * ownership gate today. Only ever sends the fields the real table has
 * (file_name, file_url, category, upload_date); never version/size/uploadedBy.
 */
async function createCompanyDocument(
  input: Parameters<typeof mockCompanyService.addDocument>[0],
): Promise<DocumentAsset> {
  const ownedIds = await fetchOwnedProjectIds();
  if (!ownedIds.includes(String(input.projectId))) {
    throw new Error("This project is not owned by your company.");
  }
  const body = {
    file_name: input.name,
    file_url: input.fileUrl ?? "",
    category: input.category,
    upload_date: new Date().toISOString().slice(0, 10),
  };
  const row = await apiClient.post<BackendDocumentRow>(`/projects/${input.projectId}/documents`, body);
  return mapCompanyDocument(row);
}

// ---------------------------------------------------------------------------
// Real backend: meetings listing (company-scoped)
//
// There is no "/company/meetings" endpoint. Meetings live at GET /api/meetings
// (all projects, the same single request the Manager portal already uses) and
// each row carries a project_id. Ownership is derived the same way as
// documents/apartments/tenants/stages: keep only rows whose project_id belongs
// to this company's owned project ids (fetchOwnedProjectIds()). Field mapping,
// status normalization, and safe-date handling mirror managerApi.ts's
// mapManagedMeeting()/normalizeMeetingStatus() exactly so every portal
// interprets the same underlying meeting row consistently.
//
// CREATE reuses the same POST /projects/<project_id>/meetings endpoint the
// Manager portal already uses (now also BUILDING_COMPANY-authorized server
// side, with a server-side project-ownership check for that role). Update /
// status / delete are intentionally left untouched — those real write
// endpoints remain MANAGER-only server-side.
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

/** Guaranteed-valid ISO date string (formatDate throws on invalid input) — same convention as managerApi.ts's safeDate(). */
function safeMeetingDate(value: string | null | undefined): string {
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return value;
  }
  return new Date().toISOString();
}

/** Map backend status + date to one of the UI's 5 meeting buckets — mirrors managerApi.ts's normalizeMeetingStatus(). */
function normalizeCompanyMeetingStatus(
  status: string | null | undefined,
  whenIso: string,
): CompanyMeetingStatus {
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

function mapCompanyMeeting(row: BackendMeetingRow): CompanyMeeting {
  const when = safeMeetingDate(
    row.meeting_date ? `${row.meeting_date}T${row.meeting_time ?? "00:00"}` : null,
  );
  return {
    id: String(row.meeting_id),
    title: row.purpose ?? "Meeting",
    projectId: row.project_id != null ? String(row.project_id) : "",
    when,
    durationMin: row.duration_min ?? 0,
    location: row.location ?? "",
    // No real agenda column — never fabricated.
    agenda: "",
    participants: row.participants
      ? row.participants.split(",").map((p) => p.trim()).filter(Boolean)
      : [],
    status: normalizeCompanyMeetingStatus(row.status, when),
    // No real notes column — never fabricated.
    notes: undefined,
  };
}

/** Fetches all meetings once, then keeps only rows whose project_id is owned by this company. */
async function fetchCompanyMeetings(): Promise<CompanyMeeting[]> {
  const ownedIds = await fetchOwnedProjectIds();
  if (ownedIds.length === 0) return [];
  const ownedSet = new Set(ownedIds);

  let rows: BackendMeetingRow[];
  try {
    const res = await apiClient.get<BackendMeetingRow[]>("/meetings");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }

  return rows
    .filter((m) => m.project_id != null && ownedSet.has(String(m.project_id)))
    .map(mapCompanyMeeting);
}

/** Split an ISO datetime into the backend's separate date/time columns — same convention as managerApi.ts's toMeetingDateTime(). */
function toCompanyMeetingDateTime(iso: string): { meeting_date: string; meeting_time: string } {
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return {
    meeting_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    meeting_time: `${pad(d.getHours())}:${pad(d.getMinutes())}:00`,
  };
}

/** Map a UI status bucket to a persisted backend status string — same convention as managerApi.ts's toBackendStatus(). */
function toCompanyBackendMeetingStatus(status: CompanyMeetingStatus | undefined): string {
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

/**
 * Creates a meeting for an owned project. Verifies ownership client-side
 * (defense-in-depth; the real gate is now server-side in routes/meetings.py)
 * via the existing fetchOwnedProjectIds(), then derives project_manager_id
 * from the selected project's OWN real assigned manager — never the Building
 * Company's own user id, and never fabricated when the project has no
 * assigned manager (sent as null, same as an unassigned project would have
 * on creation via any other flow). Only sends fields the real `meetings`
 * table has; agenda/notes are dropped (no backend source, never persisted).
 */
async function createCompanyMeeting(
  input: Parameters<typeof mockCompanyService.createMeeting>[0],
): Promise<CompanyMeeting> {
  const ownedIds = await fetchOwnedProjectIds();
  if (!ownedIds.includes(String(input.projectId))) {
    throw new Error("This project is not owned by your company.");
  }

  let projectManagerId: string | null = null;
  try {
    const rows = await apiClient.get<BackendProjectRow[]>("/projects");
    const project = (Array.isArray(rows) ? rows : []).find(
      (r) => String(r.project_id) === String(input.projectId),
    );
    projectManagerId = project?.project_manager_id ? String(project.project_manager_id) : null;
  } catch {
    projectManagerId = null;
  }

  const { meeting_date, meeting_time } = toCompanyMeetingDateTime(input.when);
  const body = {
    meeting_date,
    meeting_time,
    purpose: input.title,
    status: toCompanyBackendMeetingStatus(input.status),
    location: input.location ?? "",
    duration_min: input.durationMin ?? 0,
    participants: (input.participants ?? []).join(", "),
    project_manager_id: projectManagerId,
  };
  const row = await apiClient.post<BackendMeetingRow>(`/projects/${input.projectId}/meetings`, body);
  return mapCompanyMeeting(row);
}

// ---------------------------------------------------------------------------
// Real backend: construction stages listing (company-scoped)
//
// There is no "/company/stages" endpoint. Stages are derived from the same
// real progress rows already used for Company Projects (GET /progress via
// fetchCompanyProgress), kept only for this company's owned project ids.
// The progress table has no canonical stage-key column, so each project's
// rows are assigned CANONICAL_STAGE_KEYS positionally (index 0 -> first key,
// etc.), mirroring the existing pickCurrentStageKey() convention rather than
// inventing a new one.
// ---------------------------------------------------------------------------

/**
 * Normalizes a free-text backend progress status into the strict
 * CompanyStageStatus union the UI relies on (CompanyStageStatusBadge indexes
 * a Record by this value with no fallback, so an unrecognized string must
 * never be passed through as-is). Mirrors the same keyword patterns already
 * used by stagePercent().
 */
function normalizeStageStatus(status: string | null | undefined): CompanyStageStatus {
  const s = (status ?? "").trim().toLowerCase();
  if (/(complet|done|finish|closed)/.test(s)) return "completed";
  if (/(delay|late|behind)/.test(s)) return "delayed";
  if (/(progress|current|ongoing|active|started)/.test(s)) return "current";
  return "pending";
}

function mapCompanyStage(row: BackendProgressRow, key: ProjectStageKey): CompanyStage {
  const status = normalizeStageStatus(row.status);
  return {
    id: String(row.progress_id ?? ""),
    projectId: row.project_id != null ? String(row.project_id) : "",
    key,
    status,
    progress: stagePercent(row),
    // No responsible_team/updated_at/notes columns on public.progress — never fabricated.
    responsibleTeam: "",
    estimatedCompletion: row.end_date ?? "",
    actualCompletion: status === "completed" ? (row.end_date ?? undefined) : undefined,
    delayDays: 0,
    lastUpdate: "",
    // No per-stage photo/document/comment linkage exists on the backend.
    photosCount: 0,
    documentsCount: 0,
    commentsCount: 0,
    notes: "",
  };
}

/**
 * Orders one project's rows with the same deterministic sequence the Manager
 * mapping uses (orderProgressRowsForStages) before assigning CANONICAL_STAGE_KEYS
 * positionally; extra rows clamp to the last key. GET /progress has no
 * ORDER BY, so without this both portals could resolve a different backend
 * row to the same stage key.
 */
function mapProjectProgressToStages(rows: BackendProgressRow[]): CompanyStage[] {
  const ordered = orderProgressRowsForStages(rows);
  return ordered.map((row, idx) =>
    mapCompanyStage(row, CANONICAL_STAGE_KEYS[Math.min(idx, CANONICAL_STAGE_KEYS.length - 1)]),
  );
}

async function fetchCompanyStages(): Promise<CompanyStage[]> {
  const ownedIds = await fetchOwnedProjectIds();
  if (ownedIds.length === 0) return [];
  const ownedSet = new Set(ownedIds);

  const allProgress = await fetchCompanyProgress();
  const ownedProgress = allProgress.filter(
    (r) => r.project_id != null && ownedSet.has(String(r.project_id)),
  );

  // Group per project BEFORE assigning stage keys so indexes (and therefore
  // keys) are computed within each project's own rows, not across projects.
  const byProject = groupProgressByProject(ownedProgress);
  const stages: CompanyStage[] = [];
  for (const rows of byProject.values()) {
    stages.push(...mapProjectProgressToStages(rows));
  }
  return stages;
}

/** Reuses fetchCompanyStages() so ownership isolation is automatic — never calls GET /progress/<id> directly. */
async function fetchCompanyStage(stageId: string): Promise<CompanyStage | null> {
  const stages = await fetchCompanyStages();
  return stages.find((s) => String(s.id) === String(stageId)) ?? null;
}

/** Reuses fetchCompanyStages() so ownership isolation is automatic. */
async function fetchCompanyStagesForProject(projectId: string): Promise<CompanyStage[]> {
  const stages = await fetchCompanyStages();
  return stages.filter((s) => String(s.projectId) === String(projectId));
}

// ---------------------------------------------------------------------------
// Real backend: tenant requests listing (company-scoped)
//
// There is no "/company/requests" endpoint. Requests live at the existing
// GET /requests (BUILDING_COMPANY sees all rows server-side, same as MANAGER
// — see routes/requests.py's get_requests()). The `requests` table has no
// project_id column, so — exactly like managerApi.ts's fetchManagerRequests()
// — ownership is derived by resolving each request's tenant_id to a project
// via that tenant's apartment (reusing fetchOwnedApartmentRows(), already
// scoped to this company's owned projects). Tenant display names are
// resolved the same way company.tenants.tsx already does, via
// resolveTenantProfiles()/GET /tenants/<id>.
// ---------------------------------------------------------------------------

type BackendRequestRow = {
  request_id: string | number;
  request_date: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  tenant_id: string | number | null;
};

/** Guaranteed-valid ISO date string — same convention as safeMeetingDate() above. */
function safeRequestDate(value: string | null | undefined): string {
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return value;
  }
  return new Date().toISOString();
}

/**
 * Maps a raw backend status to one of the Company UI's 4 buckets. The real
 * `requests` table only ever carries pending/approved/rejected in practice
 * (see routes/requests.py's update_request() and tenantApi.ts's own
 * mapRequestStatus()) — there is no distinct backend "in_progress" state, so
 * "approved" is the closest real signal a request has moved past pending,
 * and is surfaced as "in_progress" here. completed/done map to "completed"
 * for parity with tenantApi.ts's own completed bucket.
 */
function normalizeCompanyRequestStatus(value: string | null | undefined): CompanyRequestStatus {
  const s = (value ?? "").trim().toLowerCase();
  if (s.includes("reject") || s.includes("declin")) return "rejected";
  if (s.includes("complet") || s.includes("done")) return "completed";
  if (s.includes("approv") || s.includes("accept")) return "in_progress";
  return "pending";
}

/** Mirrors managerApi.ts's normalizeRequestPriority() (the same real `priority` column). */
function normalizeCompanyRequestPriority(value: string | null | undefined): TaskPriority {
  const s = (value ?? "").trim().toLowerCase();
  if (s === "low") return "low";
  if (s === "high") return "high";
  if (s === "critical") return "critical";
  return "medium";
}

function mapCompanyRequest(row: BackendRequestRow, projectId: string, tenantName: string): CompanyRequest {
  return {
    id: String(row.request_id),
    // No category column (tenantApi.ts's createRequest never sends one
    // either) — default to "photo", mirroring managerApi.ts's
    // mapManagedRequest() fallback, never fabricated per-row.
    category: "photo",
    status: normalizeCompanyRequestStatus(row.status),
    priority: normalizeCompanyRequestPriority(row.priority),
    projectId,
    tenantName,
    // No real assignment column — left undefined so the UI's optional
    // "assigned to" line simply doesn't render, rather than showing a
    // fabricated employee.
    assignedTo: undefined,
    description: row.description ?? "",
    createdAt: safeRequestDate(row.request_date),
  };
}

/**
 * Fetches every request belonging to a tenant housed in one of this
 * company's owned projects. Ownership is derived transitively: owned
 * projects -> their apartments -> each apartment's tenant_id -> that
 * tenant's requests. A request whose tenant_id resolves to no owned
 * apartment is dropped, so another company's/unrelated tenants' requests
 * are never exposed.
 */
async function fetchCompanyRequests(): Promise<CompanyRequest[]> {
  const apartmentRows = await fetchOwnedApartmentRows();

  const tenantProject = new Map<string, string>();
  for (const a of apartmentRows) {
    if (a.tenant_id != null && a.tenant_id !== "" && a.project_id != null) {
      const tenantId = String(a.tenant_id);
      if (!tenantProject.has(tenantId)) tenantProject.set(tenantId, String(a.project_id));
    }
  }
  if (tenantProject.size === 0) return [];

  let rows: BackendRequestRow[];
  try {
    const res = await apiClient.get<BackendRequestRow[]>("/requests");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }

  const scoped = rows.filter((r) => r.tenant_id != null && tenantProject.has(String(r.tenant_id)));
  if (scoped.length === 0) return [];

  const tenantIds = [...new Set(scoped.map((r) => String(r.tenant_id)))];
  const profiles = await resolveTenantProfiles(tenantIds);

  return scoped.map((r) => {
    const tenantId = String(r.tenant_id);
    return mapCompanyRequest(r, tenantProject.get(tenantId) ?? "", (profiles.get(tenantId)?.full_name ?? "").trim());
  });
}

// ---------------------------------------------------------------------------
// Real backend: team listing (company-scoped)
//
// There is no "/company/team" endpoint. Team members live at the existing
// GET /team (public.team_members — a project-scoped roster row: name, role,
// email, phone, availability; each row belongs to exactly ONE project, there
// is no user_id/login backing it and no building_company_id column at all).
// Ownership is derived the same way as documents/meetings/requests: keep only
// rows whose project_id is in fetchOwnedProjectIds(). Mirrors managerApi.ts's
// fetchManagerTeam()/mapEmployee() exactly, including its Phase-1 workload
// approximation (computed from real tasks, never fabricated — 0 when there
// are no matching tasks) so the same person's workload reads consistently
// whether viewed by their manager or by the owning Building Company.
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

/** Minimal task shape needed for the workload approximation below (GET /tasks — same table managerApi.ts reads). */
type BackendTaskRowForWorkload = {
  project_id: string | number | null;
  assigned_to: string | null;
  status: string | null;
};

/** Backend availability is available/busy/off; the Company UI's vocabulary uses "on_site" instead of "busy". */
function normalizeCompanyAvailability(value: string | null | undefined): CompanyEmployee["availability"] {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "busy") return "on_site";
  if (v === "off") return "off";
  return "available";
}

/**
 * Phase-1 workload approximation — identical convention to managerApi.ts's
 * computeWorkload(): count the member's active (non-completed) tasks by
 * matching tasks.assigned_to text against the member name, scaled to a
 * percentage. There is no stored workload column; 0 when nothing matches.
 */
function computeCompanyWorkload(name: string | null | undefined, tasks: BackendTaskRowForWorkload[]): number {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return 0;
  const active = tasks.filter(
    (t) => (t.assigned_to ?? "").trim().toLowerCase() === key && (t.status ?? "").trim().toLowerCase() !== "completed",
  ).length;
  return Math.max(0, Math.min(100, active * 25));
}

function mapCompanyEmployee(row: BackendTeamMemberRow, workload: number): CompanyEmployee {
  return {
    id: String(row.member_id),
    name: row.name ?? "",
    role: row.role ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    availability: normalizeCompanyAvailability(row.availability),
    workload,
    // Each real row belongs to exactly one project — never fabricated as a
    // multi-project assignment.
    projectIds: row.project_id != null ? [String(row.project_id)] : [],
    // No stage link exists on team_members — never fabricated.
    currentStage: undefined,
    lastActive: safeRequestDate(row.updated_at ?? row.created_at),
  };
}

/** Fetches every team member whose project is owned by this company; a single project's failure never breaks the rest of the list. */
async function fetchCompanyTeam(): Promise<CompanyEmployee[]> {
  const ownedIds = await fetchOwnedProjectIds();
  if (ownedIds.length === 0) return [];
  const ownedSet = new Set(ownedIds);

  let rows: BackendTeamMemberRow[];
  try {
    const res = await apiClient.get<BackendTeamMemberRow[]>("/team");
    rows = Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
  const members = rows.filter((r) => r.project_id != null && ownedSet.has(String(r.project_id)));
  if (members.length === 0) return [];

  // Best-effort workload signal from the same owned projects' real tasks —
  // a failed fetch just leaves everyone at workload 0, never fabricated.
  let tasks: BackendTaskRowForWorkload[] = [];
  try {
    const res = await apiClient.get<BackendTaskRowForWorkload[]>("/tasks");
    tasks = (Array.isArray(res) ? res : []).filter(
      (t) => t.project_id != null && ownedSet.has(String(t.project_id)),
    );
  } catch {
    tasks = [];
  }

  return members.map((r) => mapCompanyEmployee(r, computeCompanyWorkload(r.name, tasks)));
}

export const companyApi = {
  getProjects: () =>
    USE_MOCK_API ? mockCompanyService.getProjects() : fetchCompanyProjects(),
  getProject: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getProject(id) : fetchCompanyProject(id),
  getStages: () =>
    USE_MOCK_API ? mockCompanyService.getStages() : fetchCompanyStages(),
  getStage: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getStage(id) : fetchCompanyStage(id),
  getStagesForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockCompanyService.getStagesForProject(projectId)
      : fetchCompanyStagesForProject(projectId),
  getPhotos: () =>
    USE_MOCK_API ? mockCompanyService.getPhotos() : apiClient.get<PhotoAsset[]>("/company/photos"),
  getDocuments: () =>
    USE_MOCK_API ? mockCompanyService.getDocuments() : fetchCompanyDocuments(),
  getUploads: () =>
    USE_MOCK_API ? mockCompanyService.getUploads() : apiClient.get<UploadItem[]>("/company/uploads"),
  getRequests: () =>
    USE_MOCK_API ? mockCompanyService.getRequests() : fetchCompanyRequests(),
  getMeetings: () =>
    USE_MOCK_API ? mockCompanyService.getMeetings() : fetchCompanyMeetings(),
  getNotifications: () =>
    USE_MOCK_API ? mockCompanyService.getNotifications() : apiClient.get<CompanyNotification[]>("/company/notifications"),
  getActivity: () =>
    USE_MOCK_API ? mockCompanyService.getActivity() : apiClient.get<CompanyActivity[]>("/company/activity"),
  getEmployees: () =>
    USE_MOCK_API ? mockCompanyService.getEmployees() : fetchCompanyTeam(),
  getEmployee: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getEmployee(id) : apiClient.get<CompanyEmployee | null>(`/company/team/${id}`),
  getComments: () =>
    USE_MOCK_API ? mockCompanyService.getComments() : apiClient.get<CompanyComment[]>("/company/comments"),

  // ---- project managers
  getProjectManagers: () =>
    USE_MOCK_API ? mockCompanyService.getProjectManagers() : fetchCompanyProjectManagers(),

  // ---- tenants
  getTenants: () =>
    USE_MOCK_API ? mockCompanyService.getTenants() : fetchCompanyTenants(),
  getTenant: (id: string) =>
    USE_MOCK_API ? mockCompanyService.getTenant(id) : apiClient.get<CompanyTenant | null>(`/company/tenants/${id}`),

  // ---- apartments
  getApartments: () =>
    USE_MOCK_API ? mockCompanyService.getApartments() : fetchCompanyApartments(),
  getApartmentsForProject: (projectId: string) =>
    USE_MOCK_API
      ? mockCompanyService.getApartmentsForProject(projectId)
      : fetchCompanyApartmentsForProject(projectId),
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

  // documents
  createDocument: (input: Parameters<typeof mockCompanyService.addDocument>[0]) =>
    USE_MOCK_API ? mockCompanyService.addDocument(input) : createCompanyDocument(input),

  // stages
  updateStage: (id: string, patch: Partial<CompanyStage>) =>
    USE_MOCK_API ? mockCompanyService.updateStage(id, patch) : apiClient.patch<CompanyStage>(`/company/stages/${id}`, patch),
  addStageComment: (input: Parameters<typeof mockCompanyService.addStageComment>[0]) =>
    USE_MOCK_API ? mockCompanyService.addStageComment(input) : apiClient.post<CompanyComment>(`/company/stages/comments`, input),

  // meetings
  createMeeting: (input: Parameters<typeof mockCompanyService.createMeeting>[0]) =>
    USE_MOCK_API ? mockCompanyService.createMeeting(input) : createCompanyMeeting(input),
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
