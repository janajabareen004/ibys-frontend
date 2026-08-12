/**
 * Tenant API facade — wired to the real IBYS Flask backend.
 *
 * ALL backend-to-frontend response mapping lives in THIS file. Components and
 * hooks keep consuming the existing frontend types (defined in
 * `@/mocks/mockTenantService`) unchanged, so no UI code is touched.
 *
 * Backend shape (relevant facts):
 *  - Resources are project-scoped: /api/projects/<project_id>/{progress,images,
 *    documents,meetings,comments}. There is NO "my project" endpoint.
 *  - A tenant reaches its project via GET /api/tenants/<tenant_id>/apartments,
 *    where each apartment row carries a project_id.
 *  - Requests are tenant-scoped by the Bearer token: GET/POST /api/requests.
 *
 * The API base URL (VITE_API_BASE_URL) already includes `/api`, so paths below
 * are relative to that (e.g. "/projects/123/images").
 *
 * Empty backend data is surfaced as empty arrays / null — never mock data.
 */
import { apiClient } from "./apiClient";
import { AUTH_STORAGE_KEY } from "./config";
import type {
  Project,
  Stage,
  StageId,
  StageStatus,
  Photo,
  Doc,
  Comment,
  Meeting,
  Notification,
  PhotoRequest,
} from "@/mocks/mockTenantService";

export type {
  Project,
  Stage,
  StageId,
  Photo,
  Doc,
  Comment,
  Meeting,
  Notification,
  PhotoRequest,
};

// ---------------------------------------------------------------------------
// Raw backend row shapes (as returned by the Supabase-backed Flask services)
// ---------------------------------------------------------------------------

type ApartmentRow = {
  apartment_id: string;
  apartment_number: string | null;
  floor: number | null;
  size: number | null;
  status: string | null;
  tenant_id: string | null;
  project_id: string | null;
};

type ProjectRow = {
  project_id: string;
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

type ProgressRow = {
  progress_id: string;
  task_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  project_id: string | null;
};

type ImageRow = {
  image_id: string | number;
  image_path: string | null;
  image_url?: string | null;
  title?: string | null;
  stage?: string | null;
  upload_date: string | null;
  project_id: string | null;
};

type DocumentRow = {
  document_id: string;
  file_name: string | null;
  upload_date: string | null;
  project_id: string | null;
  file_url: string | null;
  category: string | null;
};

type MeetingRow = {
  meeting_id: string;
  meeting_date: string | null;
  meeting_time: string | null;
  purpose: string | null;
  status: string | null;
  project_id: string | null;
  project_manager_id: string | null;
  location: string | null;
  duration_min: number | null;
  participants: string | null;
  meeting_link: string | null;
};

type CommentRow = {
  comment_id: string;
  content: string | null;
  comment_date: string | null;
  project_id: string | null;
  user_id: string | null;
};

type RequestRow = {
  request_id: string;
  request_date: string | null;
  description: string | null;
  status: string | null;
  tenant_id: string | null;
  priority: string | null;
};

type NotificationRow = {
  notification_id?: string | number | null;
  id?: string | number | null;
  title?: string | null;
  body?: string | null;
  message?: string | null;
  category?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  read?: boolean | null;
  created_at?: string | null;
  tenant_id?: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CANONICAL_STAGES: StageId[] = [
  "structural",
  "electrical",
  "plaster",
  "windows",
  "finishing",
  "handover",
];

// Construction stages must always render in this real-world sequence, regardless
// of the (arbitrary) order the backend returns progress rows in. Matching is done
// on the backend task_name, case-insensitively. Unknown names sort to the end.
const TIMELINE_STAGE_ORDER: string[] = [
  "site preparation",
  "foundation",
  "structure construction",
  "electrical installation",
  "interior finishing",
];

function stageOrderRank(taskName: string | null | undefined): number {
  const name = (taskName ?? "").trim().toLowerCase();
  const index = TIMELINE_STAGE_ORDER.indexOf(name);
  return index === -1 ? TIMELINE_STAGE_ORDER.length : index;
}

/** Normalize a stage/task name for matching: trimmed, lower-cased, null-safe. */
function normalizeStageName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Return a guaranteed-valid ISO date string; `formatDate` throws on invalid input. */
function safeDate(value: string | null | undefined): string {
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return value;
  }
  return new Date().toISOString();
}

/** Read the authenticated tenant's user id from the persisted auth session. */
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

/** Map a free-form backend progress status to the frontend's fixed stage status. */
function mapStageStatus(status: string | null | undefined): StageStatus {
  const s = (status ?? "").toLowerCase();
  if (/(complet|done|finish|closed)/.test(s)) return "completed";
  if (/(delay|late|behind|block|stuck)/.test(s)) return "delayed";
  if (/(progress|current|ongoing|active|started)/.test(s)) return "current";
  return "pending";
}

function stageProgressFor(status: StageStatus): number {
  switch (status) {
    case "completed":
      return 100;
    case "current":
      return 50;
    case "delayed":
      return 25;
    case "pending":
    default:
      return 0;
  }
}

/** Map a backend request status to the frontend enum (defaults to "pending"). */
function mapRequestStatus(status: string | null | undefined): PhotoRequest["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("approv")) return "approved";
  if (s.includes("complet") || s.includes("done")) return "completed";
  if (s.includes("reject") || s.includes("declin")) return "rejected";
  return "pending";
}

/** Derive a tenant-facing meeting status from backend status + date. */
function mapMeetingStatus(status: string | null | undefined, whenIso: string): Meeting["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("cancel") || s.includes("reject") || s.includes("declin")) return "cancelled";
  return new Date(whenIso).getTime() >= Date.now() ? "upcoming" : "past";
}

// ---------------------------------------------------------------------------
// Tenant context resolution (tenant_id -> apartment -> project_id)
// ---------------------------------------------------------------------------

type TenantContext = {
  tenantId: string | null;
  projectId: string | null;
  apartment: ApartmentRow | null;
};

let contextCache: { key: string; promise: Promise<TenantContext> } | null = null;

/**
 * Resolve the current tenant's project via their first apartment assignment.
 * Cached per tenant id for the session to avoid repeated apartment lookups
 * when several tenant hooks mount together.
 */
function loadTenantContext(): Promise<TenantContext> {
  const tenantId = getStoredUserId();
  const key = tenantId ?? "anon";
  if (contextCache && contextCache.key === key) return contextCache.promise;

  const promise = (async (): Promise<TenantContext> => {
    if (!tenantId) return { tenantId: null, projectId: null, apartment: null };
    let apartments: ApartmentRow[] = [];
    try {
      const res = await apiClient.get<ApartmentRow[]>(`/tenants/${tenantId}/apartments`);
      apartments = Array.isArray(res) ? res : [];
    } catch {
      apartments = [];
    }
    const apartment = apartments.length ? apartments[0] : null;
    return { tenantId, projectId: apartment?.project_id ?? null, apartment };
  })();

  contextCache = { key, promise };
  return promise;
}

// ---------------------------------------------------------------------------
// Mappers (backend row -> frontend type)
// ---------------------------------------------------------------------------

function mapProject(
  row: ProjectRow,
  apartment: ApartmentRow | null,
  progressRows: ProgressRow[],
): Project {
  const total = progressRows.length;
  const done = progressRows.filter((p) => mapStageStatus(p.status) === "completed").length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  // Latest task end_date acts as the "expected delivery" (backend has no such
  // field). Falls back to today's date so date formatting never throws.
  const endDates = progressRows
    .map((p) => p.end_date)
    .filter((d): d is string => typeof d === "string" && d !== "")
    .sort();
  const expectedDelivery = safeDate(endDates.length ? endDates[endDates.length - 1] : null);

  const stages = mapStages(progressRows);
  const currentStageId =
    stages.find((s) => s.status === "current")?.id ?? stages[0]?.id ?? "structural";

  return {
    id: row.project_id,
    name: row.project_name ?? "",
    address: row.location ?? "",
    developer: "",
    manager: { name: "", email: "", phone: "" },
    progress,
    expectedDelivery,
    description: row.description ?? "",
    building: {
      floors: row.floors ?? 0,
      units: row.units ?? 0,
      apartmentArea: apartment?.size != null ? `${apartment.size} m²` : "",
      type: row.project_type ?? "",
      reference: apartment?.apartment_number ?? "",
    },
    currentStageId,
  };
}

function mapStages(rows: ProgressRow[], images: ImageRow[] = []): Stage[] {
  // Order backend tasks by the fixed construction sequence (by task_name), falling
  // back to start date for any unknown names, then assign each to a canonical stage
  // id by index so the timeline/detail routes (which only accept the fixed 6 ids)
  // keep working. Backend supplies at most 6 usable stages this way.
  const ordered = [...rows].sort((a, b) => {
    const rankDiff = stageOrderRank(a.task_name) - stageOrderRank(b.task_name);
    if (rankDiff !== 0) return rankDiff;
    return safeDate(a.start_date).localeCompare(safeDate(b.start_date));
  });

  return ordered.slice(0, CANONICAL_STAGES.length).map((row, index) => {
    const status = mapStageStatus(row.status);
    const estimatedDate = safeDate(row.end_date ?? row.start_date);
    // Count project images whose `stage` matches this progress row's task_name
    // (case-insensitive, trimmed, null-safe). A blank task_name counts nothing.
    const stageName = normalizeStageName(row.task_name);
    const photosCount = stageName
      ? images.filter((img) => normalizeStageName(img.stage) === stageName).length
      : 0;
    return {
      id: CANONICAL_STAGES[index],
      order: index + 1,
      // task_name is shown verbatim (t() returns the string when it's not a key).
      nameKey: row.task_name ?? `tenant.timeline.stages.${CANONICAL_STAGES[index]}`,
      status,
      progress: stageProgressFor(status),
      description: "",
      estimatedDate,
      completionDate: status === "completed" ? safeDate(row.end_date) : undefined,
      photosCount,
      documentsCount: 0,
      commentsCount: 0,
      responsibleCompany: "",
      latestUpdate: "",
    };
  });
}

function mapPhoto(row: ImageRow): Photo {
  return {
    id: String(row.image_id),
    stageId: (row.stage ?? "") as StageId,
    title: row.title ?? "Project photo",
    // `||` (not `??`) so an empty-string image_url still falls back to image_path.
    url: row.image_url || row.image_path || "",
    uploadedAt: row.upload_date ?? "",
    uploadedBy: "",
  };
}

const DOC_CATEGORIES: Doc["category"][] = ["contract", "permit", "drawing", "report", "invoice"];

/** Normalize the backend document category to a valid enum (defaults to report). */
function mapDocCategory(value: string | null | undefined): Doc["category"] {
  const s = (value ?? "").trim().toLowerCase();
  return (DOC_CATEGORIES as string[]).includes(s) ? (s as Doc["category"]) : "report";
}

function mapDoc(row: DocumentRow): Doc {
  return {
    id: row.document_id,
    name: row.file_name ?? "",
    // Use the backend category when present (managers now set it); fall back to
    // a valid enum value for legacy rows that have an empty category column.
    category: mapDocCategory(row.category),
    updatedAt: safeDate(row.upload_date),
    size: "",
    url: row.file_url ?? "",
  };
}

function mapMeeting(row: MeetingRow): Meeting {
  const when = safeDate(
    row.meeting_date ? `${row.meeting_date}T${row.meeting_time ?? "00:00"}` : null,
  );
  return {
    id: row.meeting_id,
    title: row.purpose ?? "Meeting",
    when,
    durationMin: row.duration_min ?? 0,
    location: row.location ?? "",
    participants: row.participants
      ? row.participants.split(",").map((p: string) => p.trim())
      : [],
    status: mapMeetingStatus(row.status, when),
    notes: undefined,
    meetingLink: row.meeting_link ?? "",
  };
}

function mapComment(row: CommentRow, tenantId: string | null): Comment {
  const isOwn = !!tenantId && row.user_id === tenantId;
  return {
    id: row.comment_id,
    stageId: undefined,
    // Backend comments store only user_id (no name/role). Best-effort display.
    author: isOwn ? "You" : "Project team",
    role: isOwn ? "TENANT" : "PROJECT_MANAGER",
    message: row.content ?? "",
    createdAt: safeDate(row.comment_date),
    likes: 0,
  };
}

function mapPriority(value: string | null | undefined): PhotoRequest["priority"] {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function mapNotificationCategory(value: string | null | undefined): Notification["category"] {
  const c = (value ?? "").trim().toLowerCase();
  const valid: Notification["category"][] = ["project", "meeting", "documents", "construction", "system"];
  return (valid as string[]).includes(c) ? (c as Notification["category"]) : "system";
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: String(row.notification_id ?? row.id ?? ""),
    category: mapNotificationCategory(row.category ?? row.type),
    title: row.title ?? "",
    body: row.body ?? row.message ?? "",
    createdAt: safeDate(row.created_at),
    read: row.is_read ?? row.read ?? false,
  };
}

function mapRequest(row: RequestRow): PhotoRequest {
  return {
    id: row.request_id,
    // Backend requests have no stage column.
    stageId: "" as StageId,
    description: row.description ?? "",
    priority: mapPriority(row.priority),
    status: mapRequestStatus(row.status),
    createdAt: safeDate(row.request_date),
  };
}

// ---------------------------------------------------------------------------
// Public facade (signatures unchanged so hooks/components stay untouched)
// ---------------------------------------------------------------------------

export const tenantApi = {
  getProject: async (): Promise<Project | null> => {
    const ctx = await loadTenantContext();
    if (!ctx.projectId) return null;
    let row: ProjectRow;
    try {
      row = await apiClient.get<ProjectRow>(`/projects/${ctx.projectId}`);
    } catch {
      return null;
    }
    let progressRows: ProgressRow[] = [];
    try {
      const res = await apiClient.get<ProgressRow[]>(`/projects/${ctx.projectId}/progress`);
      progressRows = Array.isArray(res) ? res : [];
    } catch {
      progressRows = [];
    }
    return mapProject(row, ctx.apartment, progressRows);
  },

  getStages: async (): Promise<Stage[]> => {
    const ctx = await loadTenantContext();
    if (!ctx.projectId) return [];
    try {
      // Fetch progress and images once, then reuse images for every stage's count.
      const [progressRes, imagesRes] = await Promise.all([
        apiClient.get<ProgressRow[]>(`/projects/${ctx.projectId}/progress`),
        apiClient
          .get<ImageRow[]>(`/projects/${ctx.projectId}/images`)
          .catch(() => [] as ImageRow[]),
      ]);
      const progressRows = Array.isArray(progressRes) ? progressRes : [];
      const images = Array.isArray(imagesRes) ? imagesRes : [];
      return mapStages(progressRows, images);
    } catch {
      return [];
    }
  },

  getStage: async (id: StageId): Promise<Stage | null> => {
    const stages = await tenantApi.getStages();
    return stages.find((s) => s.id === id) ?? null;
  },

  getPhotos: async (): Promise<Photo[]> => {
    const ctx = await loadTenantContext();
    if (!ctx.projectId) return [];
    try {
      const res = await apiClient.get<ImageRow[]>(`/projects/${ctx.projectId}/images`);
      return (Array.isArray(res) ? res : []).map(mapPhoto);
    } catch {
      return [];
    }
  },

  getDocuments: async (): Promise<Doc[]> => {
    const ctx = await loadTenantContext();
    if (!ctx.projectId) return [];
    try {
      const res = await apiClient.get<DocumentRow[]>(`/projects/${ctx.projectId}/documents`);
      return (Array.isArray(res) ? res : []).map(mapDoc);
    } catch {
      return [];
    }
  },

  getComments: async (): Promise<Comment[]> => {
    const ctx = await loadTenantContext();
    if (!ctx.projectId) return [];
    try {
      const res = await apiClient.get<CommentRow[]>(`/projects/${ctx.projectId}/comments`);
      return (Array.isArray(res) ? res : []).map((row) => mapComment(row, ctx.tenantId));
    } catch {
      return [];
    }
  },

  getMeetings: async (): Promise<Meeting[]> => {
    const ctx = await loadTenantContext();
    if (!ctx.projectId) return [];
    try {
      const res = await apiClient.get<MeetingRow[]>(`/projects/${ctx.projectId}/meetings`);
      return (Array.isArray(res) ? res : []).map(mapMeeting);
    } catch {
      return [];
    }
  },

  getNotifications: async (): Promise<Notification[]> => {
    try {
      const res = await apiClient.get<NotificationRow[]>("/notifications");
      return (Array.isArray(res) ? res : []).map(mapNotification);
    } catch {
      return [];
    }
  },

  getRequests: async (): Promise<PhotoRequest[]> => {
    try {
      const res = await apiClient.get<RequestRow[]>("/requests");
      return (Array.isArray(res) ? res : []).map(mapRequest);
    } catch {
      return [];
    }
  },

  createRequest: async (
    input: Omit<PhotoRequest, "id" | "status" | "createdAt">,
  ): Promise<PhotoRequest> => {
    // tenant_id comes from the token. stageId has no backend column and is
    // dropped; priority is sent through to the backend `priority` column.
    const row = await apiClient.post<RequestRow>("/requests", {
      description: input.description,
      priority: input.priority ?? "medium",
      status: "pending",
    });
    return mapRequest(row);
  },
};
