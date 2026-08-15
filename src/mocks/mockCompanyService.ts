/**
 * Mock service for the Building Company workspace.
 * Async so components can be wired to a real backend later without behavioural changes.
 */

import type { ProjectStageKey, TaskPriority } from "@/mocks/mockManagerService";

export type { ProjectStageKey, TaskPriority };

export type CompanyProjectStatus = "planning" | "in_progress" | "on_hold" | "delayed" | "completed";
export type CompanyStageStatus = "pending" | "current" | "completed" | "delayed";

export type CompanyEmployee = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  availability: "available" | "on_site" | "off";
  workload: number;
  projectIds: string[];
  currentStage?: ProjectStageKey;
  lastActive: string;
};

export type CompanyProject = {
  id: string;
  name: string;
  address: string;
  clientName: string;
  projectManager: string;
  progress: number;
  currentStage: ProjectStageKey;
  expectedCompletion: string;
  status: CompanyProjectStatus;
  photosCount: number;
  documentsCount: number;
  updatedAt: string;
  description: string;
  team: string[];
  floors?: number;
  units?: number;
  projectType?: string;
  projectManagerId?: string;
};

export type CompanyStage = {
  id: string;
  projectId: string;
  key: ProjectStageKey;
  status: CompanyStageStatus;
  progress: number;
  responsibleTeam: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  delayDays: number;
  lastUpdate: string;
  photosCount: number;
  documentsCount: number;
  commentsCount: number;
  notes: string;
};

export type PhotoAsset = {
  id: string;
  projectId: string;
  stageKey: ProjectStageKey;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  status: "published" | "pending_review" | "flagged";
  hue: number; // used to render a color placeholder
};

export type DocumentCategory = "contract" | "permit" | "drawing" | "report" | "invoice";
export type DocumentAsset = {
  id: string;
  projectId: string;
  stageKey?: ProjectStageKey;
  name: string;
  category: DocumentCategory;
  version: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  // Public Storage URL (real backend's file_url). Absent on rows with no real source.
  url?: string;
};

export type UploadItem = {
  id: string;
  fileName: string;
  size: string;
  kind: "photo" | "document";
  projectId: string;
  stageKey?: ProjectStageKey;
  progress: number;
  status: "queued" | "uploading" | "completed" | "failed";
  message?: string;
};

export type CompanyRequestCategory = "photo" | "document" | "meeting" | "general";
export type CompanyRequestStatus = "pending" | "in_progress" | "completed" | "rejected";
export type CompanyRequest = {
  id: string;
  category: CompanyRequestCategory;
  status: CompanyRequestStatus;
  priority: TaskPriority;
  projectId: string;
  tenantName: string;
  assignedTo?: string;
  description: string;
  createdAt: string;
};

export type CompanyMeetingStatus = "upcoming" | "today" | "past" | "cancelled" | "rescheduled";
export type CompanyMeeting = {
  id: string;
  title: string;
  projectId: string;
  when: string;
  durationMin: number;
  location: string;
  agenda: string;
  participants: string[];
  status: CompanyMeetingStatus;
  notes?: string;
};

export type CompanyNotificationCategory = "project" | "construction" | "upload" | "meeting" | "request" | "system";
export type CompanyNotification = {
  id: string;
  category: CompanyNotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type CompanyActivityType =
  // Original mock-only vocabulary — kept as-is so existing mock data/mutations
  // below remain valid; never emitted by the real backend.
  | "stage_updated"
  | "photo_uploaded"
  | "document_uploaded"
  | "meeting_approved"
  | "meeting_rejected"
  | "request_completed"
  | "request_received"
  // Real public.activity_events vocabulary (see ibys-backend/models/activity_event.py) —
  // added so real events read from the backend are never recategorized/fabricated.
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "task_completed"
  | "meeting_scheduled"
  | "meeting_updated"
  | "document_added"
  | "request_replied"
  | "request_approved"
  | "request_rejected"
  | "note_added";

export type CompanyActivity = {
  id: string;
  type: CompanyActivityType;
  actor: string;
  projectId?: string;
  message: string;
  createdAt: string;
};

export type CompanyComment = {
  id: string;
  projectId: string;
  stageKey?: ProjectStageKey;
  author: string;
  role: string;
  message: string;
  createdAt: string;
  attachments: number;
};

export type ProjectManagerPerson = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarSeed: string;
  activeProjects: number;
};

export type CompanyTenant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
  notes?: string;
  createdAt: string;
};

export type ApartmentStatus = "vacant" | "assigned" | "sold" | "reserved";
export type Apartment = {
  id: string;
  projectId: string;
  building: string;
  entrance: string;
  floor: string;
  number: string;
  rooms: number;
  sizeSqm: number;
  status: ApartmentStatus;
  tenantId?: string;
  notes?: string;
};

const delay = <T,>(v: T, ms = 180) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const iso = (offsetDays: number, offsetHours = 0) =>
  new Date(Date.now() + offsetDays * 86400000 + offsetHours * 3600000).toISOString();
const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

// pub/sub bus so hooks refetch after mutations
const listeners = new Set<() => void>();
let version = 0;
const emit = () => { version++; listeners.forEach((cb) => cb()); };
export const mockCompanyBus = {
  subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  version: () => version,
};


// ---------------------------------------------------------------------------

const EMPLOYEES: CompanyEmployee[] = [
  { id: "ce1", name: "Yusuf Amir", role: "Site Engineer", email: "yusuf@ibys.co", phone: "+972 50 121 3311", availability: "on_site", workload: 88, projectIds: ["cp1", "cp2"], currentStage: "plaster", lastActive: iso(0, -1) },
  { id: "ce2", name: "Hana Kaplan", role: "Structural Lead", email: "hana@ibys.co", phone: "+972 50 232 4411", availability: "on_site", workload: 76, projectIds: ["cp1", "cp3"], currentStage: "structural", lastActive: iso(0, -2) },
  { id: "ce3", name: "Farid Odeh", role: "MEP Foreman", email: "farid@ibys.co", phone: "+972 50 343 5511", availability: "available", workload: 60, projectIds: ["cp2"], currentStage: "electrical", lastActive: iso(0, -3) },
  { id: "ce4", name: "Danielle Peled", role: "Finishing Supervisor", email: "danielle@ibys.co", phone: "+972 50 454 6611", availability: "available", workload: 52, projectIds: ["cp3", "cp4"], currentStage: "finishing", lastActive: iso(-1) },
  { id: "ce5", name: "Ibrahim Nasrallah", role: "Safety Officer", email: "ibrahim@ibys.co", phone: "+972 50 565 7711", availability: "on_site", workload: 71, projectIds: ["cp1", "cp2", "cp4"], lastActive: iso(0, -5) },
  { id: "ce6", name: "Roni Bar-Levi", role: "Document Controller", email: "roni@ibys.co", phone: "+972 50 676 8811", availability: "off", workload: 30, projectIds: ["cp1", "cp3"], lastActive: iso(-2) },
];

const PROJECTS: CompanyProject[] = [
  { id: "cp1", name: "Marina Heights, Block B", address: "45 Coastline Ave, Marina District", clientName: "Sara Tenant", projectManager: "Omar Haddad", progress: 62, currentStage: "plaster", expectedCompletion: iso(220), status: "in_progress", photosCount: 128, documentsCount: 42, updatedAt: iso(0, -2), description: "12-story boutique residential tower with rooftop terrace and underground parking.", team: ["ce1", "ce2", "ce5"] },
  { id: "cp2", name: "Palm Residences", address: "12 Palm Boulevard, Hadera", clientName: "David Ben-Ami", projectManager: "Omar Haddad", progress: 34, currentStage: "electrical", expectedCompletion: iso(310), status: "delayed", photosCount: 96, documentsCount: 51, updatedAt: iso(-1), description: "Two mid-rise residential blocks with shared garden podium.", team: ["ce1", "ce3", "ce5"] },
  { id: "cp3", name: "Cedar Grove Villas", address: "8 Cedar Grove, Ramat Gan", clientName: "Mira Sasson", projectManager: "Lena Cohen", progress: 78, currentStage: "finishing", expectedCompletion: iso(90), status: "in_progress", photosCount: 74, documentsCount: 33, updatedAt: iso(-2), description: "Cluster of eight luxury villas with private pools and shared clubhouse.", team: ["ce2", "ce4", "ce6"] },
  { id: "cp4", name: "Old Town Refurbishment", address: "Old Town Square, Jaffa", clientName: "Municipality of Jaffa", projectManager: "Rachel Levi", progress: 88, currentStage: "handover", expectedCompletion: iso(30), status: "in_progress", photosCount: 210, documentsCount: 66, updatedAt: iso(-1), description: "Heritage restoration of six façades and a public plaza.", team: ["ce4", "ce5"] },
  { id: "cp5", name: "Harbor View Lofts", address: "3 Harbor Rd, Ashdod", clientName: "Ella Katz", projectManager: "Omar Haddad", progress: 5, currentStage: "structural", expectedCompletion: iso(560), status: "planning", photosCount: 12, documentsCount: 9, updatedAt: iso(-6), description: "Loft-style residential development pending permit approval.", team: ["ce2"] },
];

const STAGE_KEYS: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

const STAGES: CompanyStage[] = PROJECTS.flatMap((project) =>
  STAGE_KEYS.map<CompanyStage>((key, idx) => {
    const currentIdx = STAGE_KEYS.indexOf(project.currentStage);
    let status: CompanyStageStatus = "pending";
    let progress = 0;
    if (idx < currentIdx) { status = "completed"; progress = 100; }
    else if (idx === currentIdx) { status = project.status === "delayed" ? "delayed" : "current"; progress = project.progress % 100 || 40; }
    const delayDays = status === "delayed" ? 9 : 0;
    return {
      id: `${project.id}-${key}`,
      projectId: project.id,
      key,
      status,
      progress,
      responsibleTeam: ["Delta Structural", "Vector MEP", "Marble & Line", "Clearview Facade", "Atelier Finishing", "Horizon Handover"][idx],
      estimatedCompletion: iso(20 + idx * 45),
      actualCompletion: status === "completed" ? iso(-8 - idx * 15) : undefined,
      delayDays,
      lastUpdate: iso(-Math.floor(Math.random() * 3), -Math.floor(Math.random() * 12)),
      photosCount: [42, 36, 28, 12, 8, 4][idx],
      documentsCount: [6, 9, 4, 3, 5, 2][idx],
      commentsCount: [4, 8, 6, 1, 3, 0][idx],
      notes:
        status === "delayed"
          ? "Supplier delivery delayed; recovery plan in progress."
          : status === "current"
            ? "Team currently working on this stage."
            : status === "completed"
              ? "Stage completed and signed off."
              : "Awaiting kickoff.",
    };
  }),
);

const PHOTO_TITLES = ["East façade progress", "Concrete pour — Floor 6", "MEP rough-in", "Kitchen finish sample", "Lobby marble layout", "Rooftop waterproofing", "Window frame install", "Handover snag list", "Balcony rail install", "Elevator shaft check"];
const PHOTOS: PhotoAsset[] = Array.from({ length: 24 }).map((_, i) => {
  const project = PROJECTS[i % PROJECTS.length];
  return {
    id: `ph${i + 1}`,
    projectId: project.id,
    stageKey: STAGE_KEYS[i % STAGE_KEYS.length],
    title: PHOTO_TITLES[i % PHOTO_TITLES.length],
    uploadedBy: EMPLOYEES[i % EMPLOYEES.length].name,
    uploadedAt: iso(-i, -Math.floor(Math.random() * 12)),
    status: (["published", "published", "pending_review", "flagged"] as const)[i % 4],
    hue: (i * 37) % 360,
  };
});

const DOC_NAMES: Array<[string, DocumentCategory]> = [
  ["Structural drawings v3.pdf", "drawing"],
  ["Building permit A-2025.pdf", "permit"],
  ["MEP inspection report.pdf", "report"],
  ["Contract addendum #4.pdf", "contract"],
  ["Weekly progress report.pdf", "report"],
  ["Invoice #1024.pdf", "invoice"],
  ["Façade drawings v2.pdf", "drawing"],
  ["Handover checklist.pdf", "report"],
  ["Occupancy permit.pdf", "permit"],
  ["Material invoice batch 12.pdf", "invoice"],
];
const DOCUMENTS: DocumentAsset[] = Array.from({ length: 20 }).map((_, i) => {
  const [name, cat] = DOC_NAMES[i % DOC_NAMES.length];
  const project = PROJECTS[i % PROJECTS.length];
  return {
    id: `dc${i + 1}`,
    projectId: project.id,
    stageKey: STAGE_KEYS[i % STAGE_KEYS.length],
    name,
    category: cat,
    version: `v${1 + (i % 4)}.${i % 3}`,
    size: `${(200 + (i * 137) % 1800)} KB`,
    uploadedBy: EMPLOYEES[i % EMPLOYEES.length].name,
    uploadedAt: iso(-i - 1),
  };
});

const UPLOADS: UploadItem[] = [
  { id: "u1", fileName: "east_facade_9.jpg", size: "3.4 MB", kind: "photo", projectId: "cp1", stageKey: "plaster", progress: 100, status: "completed" },
  { id: "u2", fileName: "kitchen_sample.jpg", size: "2.1 MB", kind: "photo", projectId: "cp3", stageKey: "finishing", progress: 68, status: "uploading" },
  { id: "u3", fileName: "MEP_report_v3.pdf", size: "1.4 MB", kind: "document", projectId: "cp2", stageKey: "electrical", progress: 34, status: "uploading" },
  { id: "u4", fileName: "permit_scan.pdf", size: "820 KB", kind: "document", projectId: "cp5", progress: 0, status: "queued" },
  { id: "u5", fileName: "roof_wp_video.mov", size: "48 MB", kind: "photo", projectId: "cp1", stageKey: "plaster", progress: 12, status: "failed", message: "File type not accepted." },
  { id: "u6", fileName: "handover_checklist.pdf", size: "540 KB", kind: "document", projectId: "cp4", stageKey: "handover", progress: 100, status: "completed" },
];

const REQUESTS: CompanyRequest[] = [
  { id: "cr1", category: "photo", status: "pending", priority: "high", projectId: "cp1", tenantName: "Sara Tenant", assignedTo: "ce1", description: "Please share updated photos of the master bathroom finish.", createdAt: iso(-1, -2) },
  { id: "cr2", category: "meeting", status: "pending", priority: "medium", projectId: "cp2", tenantName: "David Ben-Ami", assignedTo: "ce3", description: "Requesting an on-site walkthrough for MEP rough-in.", createdAt: iso(-2) },
  { id: "cr3", category: "document", status: "in_progress", priority: "high", projectId: "cp3", tenantName: "Mira Sasson", assignedTo: "ce6", description: "Need the latest structural inspection report.", createdAt: iso(-3) },
  { id: "cr4", category: "general", status: "completed", priority: "low", projectId: "cp1", tenantName: "Sara Tenant", assignedTo: "ce5", description: "Confirm the paint finish for the living room.", createdAt: iso(-6) },
  { id: "cr5", category: "photo", status: "rejected", priority: "low", projectId: "cp2", tenantName: "David Ben-Ami", description: "Requested photos of restricted safety zone.", createdAt: iso(-7) },
  { id: "cr6", category: "meeting", status: "in_progress", priority: "medium", projectId: "cp4", tenantName: "Municipality of Jaffa", assignedTo: "ce4", description: "Coordinating handover walkthrough date.", createdAt: iso(-2, -6) },
];

const MEETINGS: CompanyMeeting[] = [
  { id: "cm1", title: "Weekly site sync — Marina B", projectId: "cp1", when: iso(0, 3), durationMin: 45, location: "Video call", agenda: "Site progress, upcoming pours, risks.", participants: ["Yusuf Amir", "Omar Haddad", "Sara Tenant"], status: "today" },
  { id: "cm2", title: "MEP coordination — Palm Residences", projectId: "cp2", when: iso(1, 2), durationMin: 60, location: "Site office", agenda: "Rough-in coordination and sign-off checklist.", participants: ["Farid Odeh", "Vector MEP"], status: "upcoming" },
  { id: "cm3", title: "Finishes walkthrough — Cedar Grove", projectId: "cp3", when: iso(3, 4), durationMin: 90, location: "On-site", agenda: "Client finishes selection.", participants: ["Danielle Peled", "Mira Sasson"], status: "upcoming" },
  { id: "cm4", title: "Old Town handover prep", projectId: "cp4", when: iso(-1, -4), durationMin: 45, location: "Site office", agenda: "Handover checklist and snag list.", participants: ["Danielle Peled", "Ibrahim Nasrallah"], status: "past", notes: "Snag list agreed; final walkthrough scheduled next week." },
  { id: "cm5", title: "Harbor View kickoff", projectId: "cp5", when: iso(-2, -1), durationMin: 60, location: "HQ boardroom", agenda: "Project kickoff.", participants: ["Hana Kaplan"], status: "cancelled" },
  { id: "cm6", title: "Marina B safety briefing", projectId: "cp1", when: iso(5, 3), durationMin: 30, location: "On-site", agenda: "Monthly safety briefing.", participants: ["Ibrahim Nasrallah"], status: "rescheduled" },
];

const NOTIFICATIONS: CompanyNotification[] = [
  { id: "cn1", category: "construction", title: "Plaster stage reached 58%", body: "Floors 5–8 completed on Marina B.", createdAt: iso(0, -1), read: false },
  { id: "cn2", category: "request", title: "New tenant request", body: "Sara Tenant requested master bathroom photos.", createdAt: iso(0, -3), read: false },
  { id: "cn3", category: "meeting", title: "Meeting rescheduled", body: "Marina B safety briefing moved to next Friday.", createdAt: iso(-1), read: true },
  { id: "cn4", category: "upload", title: "Upload failed", body: "roof_wp_video.mov could not be uploaded.", createdAt: iso(-1, -4), read: false },
  { id: "cn5", category: "project", title: "Palm Residences flagged delayed", body: "MEP rough-in is 9 days behind schedule.", createdAt: iso(-2), read: true },
  { id: "cn6", category: "system", title: "Weekly summary ready", body: "Weekly stage report is ready for review.", createdAt: iso(-3), read: true },
];

const ACTIVITY: CompanyActivity[] = [
  { id: "ca1", type: "photo_uploaded", actor: "Yusuf Amir", projectId: "cp1", message: "uploaded 6 photos to the plaster stage", createdAt: iso(0, -1) },
  { id: "ca2", type: "stage_updated", actor: "Hana Kaplan", projectId: "cp1", message: "updated plaster stage progress to 58%", createdAt: iso(0, -3) },
  { id: "ca3", type: "meeting_approved", actor: "Farid Odeh", projectId: "cp2", message: "approved MEP coordination meeting", createdAt: iso(-1) },
  { id: "ca4", type: "document_uploaded", actor: "Roni Bar-Levi", projectId: "cp3", message: "added Structural drawings v3.pdf", createdAt: iso(-1, -5) },
  { id: "ca5", type: "request_completed", actor: "Ibrahim Nasrallah", projectId: "cp1", message: "completed a tenant photo request", createdAt: iso(-2) },
  { id: "ca6", type: "request_received", actor: "Sara Tenant", projectId: "cp1", message: "requested master bathroom photos", createdAt: iso(-2, -6) },
  { id: "ca7", type: "meeting_rejected", actor: "Omar Haddad", projectId: "cp2", message: "rejected a tenant meeting request", createdAt: iso(-3) },
  { id: "ca8", type: "stage_updated", actor: "Delta Structural", projectId: "cp2", message: "flagged electrical stage as delayed", createdAt: iso(-3, -2) },
];

const COMMENTS: CompanyComment[] = [
  { id: "cc1", projectId: "cp1", stageKey: "plaster", author: "Omar Haddad", role: "Project Manager", message: "Please confirm plaster completion date for floors 9–12.", createdAt: iso(-1, -2), attachments: 0 },
  { id: "cc2", projectId: "cp1", stageKey: "plaster", author: "Yusuf Amir", role: "Site Engineer", message: "On track. Aiming to complete by end of next week.", createdAt: iso(-1, -1), attachments: 1 },
  { id: "cc3", projectId: "cp2", stageKey: "electrical", author: "Farid Odeh", role: "MEP Foreman", message: "Delivery delayed by supplier — recovery plan attached.", createdAt: iso(-2), attachments: 2 },
];

// ---------------------------------------------------------------------------
// Project managers, tenants, apartments (buildings/entrances/floors/units)
// ---------------------------------------------------------------------------

const PROJECT_MANAGERS: ProjectManagerPerson[] = [
  { id: "pm1", name: "Omar Haddad", email: "omar@ibys.co", phone: "+972 50 111 2211", avatarSeed: "omar", activeProjects: 3 },
  { id: "pm2", name: "Lena Cohen", email: "lena@ibys.co", phone: "+972 50 222 3311", avatarSeed: "lena", activeProjects: 1 },
  { id: "pm3", name: "Rachel Levi", email: "rachel@ibys.co", phone: "+972 50 444 5511", avatarSeed: "rachel", activeProjects: 1 },
];

const TENANTS: CompanyTenant[] = [
  { id: "ct1", name: "Sara Tenant", email: "sara@example.com", phone: "+972 50 123 4567", nationalId: "301234567", notes: "Prefers email communication.", createdAt: iso(-120) },
  { id: "ct2", name: "David Ben-Ami", email: "david@example.com", phone: "+972 54 900 2233", nationalId: "302345678", createdAt: iso(-90) },
  { id: "ct3", name: "Mira Sasson", email: "mira@example.com", phone: "+972 50 800 4411", nationalId: "303456789", createdAt: iso(-70) },
  { id: "ct4", name: "Ella Katz", email: "ella@example.com", phone: "+972 52 501 8822", createdAt: iso(-40) },
  { id: "ct5", name: "Noa Levi", email: "noa@example.com", phone: "+972 52 765 4321", createdAt: iso(-30) },
];

const APARTMENTS: Apartment[] = [
  { id: "ap1", projectId: "cp1", building: "B", entrance: "2", floor: "5", number: "12", rooms: 4, sizeSqm: 110, status: "assigned", tenantId: "ct1" },
  { id: "ap2", projectId: "cp1", building: "B", entrance: "2", floor: "8", number: "27", rooms: 5, sizeSqm: 135, status: "assigned", tenantId: "ct5" },
  { id: "ap3", projectId: "cp1", building: "B", entrance: "3", floor: "3", number: "7", rooms: 3, sizeSqm: 82, status: "vacant" },
  { id: "ap4", projectId: "cp1", building: "B", entrance: "3", floor: "10", number: "34", rooms: 4, sizeSqm: 120, status: "reserved" },
  { id: "ap5", projectId: "cp2", building: "A", entrance: "1", floor: "2", number: "4", rooms: 3, sizeSqm: 90, status: "assigned", tenantId: "ct2" },
  { id: "ap6", projectId: "cp2", building: "A", entrance: "1", floor: "4", number: "11", rooms: 4, sizeSqm: 105, status: "vacant" },
  { id: "ap7", projectId: "cp3", building: "V", entrance: "—", floor: "—", number: "3", rooms: 5, sizeSqm: 180, status: "assigned", tenantId: "ct3" },
  { id: "ap8", projectId: "cp3", building: "V", entrance: "—", floor: "—", number: "5", rooms: 5, sizeSqm: 180, status: "sold" },
  { id: "ap9", projectId: "cp5", building: "L", entrance: "1", floor: "1", number: "1", rooms: 3, sizeSqm: 95, status: "vacant" },
];

// ---------------------------------------------------------------------------

const nowIso = () => new Date().toISOString();

export const mockCompanyService = {
  getProjects: () => delay([...PROJECTS]),
  getProject: (id: string) => delay(PROJECTS.find((p) => p.id === id) ?? null),
  getStages: () => delay([...STAGES]),
  getStage: (id: string) => delay(STAGES.find((s) => s.id === id) ?? null),
  getStagesForProject: (projectId: string) => delay(STAGES.filter((s) => s.projectId === projectId)),
  getPhotos: () => delay([...PHOTOS]),
  getDocuments: () => delay([...DOCUMENTS]),
  getUploads: () => delay([...UPLOADS]),
  getRequests: () => delay([...REQUESTS]),
  getMeetings: () => delay([...MEETINGS]),
  getNotifications: () => delay([...NOTIFICATIONS]),
  getActivity: () => delay([...ACTIVITY]),
  getEmployees: () => delay([...EMPLOYEES]),
  getEmployee: (id: string) => delay(EMPLOYEES.find((e) => e.id === id) ?? null),
  getComments: () => delay([...COMMENTS]),
  addDocument(input: { projectId: string; name: string; category: DocumentCategory; fileUrl?: string }) {
    const doc: DocumentAsset = {
      id: uid("dc-"),
      projectId: input.projectId,
      name: input.name,
      category: input.category,
      // No real size/version/uploader source — never fabricated, same as the real backend mapping.
      version: "",
      size: "",
      uploadedBy: "",
      uploadedAt: nowIso(),
      url: input.fileUrl || undefined,
    };
    DOCUMENTS.unshift(doc);
    emit();
    return doc;
  },

  // ---- project managers
  getProjectManagers: () => delay([...PROJECT_MANAGERS]),
  createProjectManager(input: Omit<ProjectManagerPerson, "id" | "activeProjects"> & Partial<Pick<ProjectManagerPerson, "activeProjects">>) {
    const pm: ProjectManagerPerson = {
      id: uid("pm-"),
      activeProjects: input.activeProjects ?? 0,
      avatarSeed: input.avatarSeed || input.name.toLowerCase().replace(/\s+/g, "-"),
      name: input.name,
      email: input.email,
      phone: input.phone,
    };
    PROJECT_MANAGERS.unshift(pm);
    emit();
    return pm;
  },
  updateProjectManager(id: string, patch: Partial<ProjectManagerPerson>) {
    const pm = PROJECT_MANAGERS.find((x) => x.id === id);
    if (!pm) return null;
    Object.assign(pm, patch);
    emit();
    return pm;
  },
  deleteProjectManager(id: string) {
    const idx = PROJECT_MANAGERS.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    PROJECT_MANAGERS.splice(idx, 1);
    emit();
    return true;
  },
  assignProjectManager(projectId: string, managerId: string) {
    const project = PROJECTS.find((p) => p.id === projectId);
    const pm = PROJECT_MANAGERS.find((m) => m.id === managerId);
    if (!project || !pm) return null;
    project.projectManager = pm.name;
    project.updatedAt = nowIso();
    ACTIVITY.unshift({ id: uid("ca-"), type: "stage_updated", actor: pm.name, projectId, message: `assigned as project manager`, createdAt: nowIso() });
    emit();
    return project;
  },

  // ---- projects CRUD
  createProject(input: Omit<CompanyProject, "id" | "updatedAt" | "photosCount" | "documentsCount"> & Partial<Pick<CompanyProject, "photosCount" | "documentsCount">>) {
    const project: CompanyProject = {
      id: uid("cp-"),
      updatedAt: nowIso(),
      photosCount: input.photosCount ?? 0,
      documentsCount: input.documentsCount ?? 0,
      name: input.name,
      address: input.address,
      clientName: input.clientName,
      projectManager: input.projectManager,
      progress: input.progress,
      currentStage: input.currentStage,
      expectedCompletion: input.expectedCompletion,
      status: input.status,
      description: input.description,
      team: input.team,
    };
    PROJECTS.unshift(project);
    ACTIVITY.unshift({ id: uid("ca-"), type: "stage_updated", actor: project.projectManager || "System", projectId: project.id, message: `created project ${project.name}`, createdAt: nowIso() });
    STAGE_KEYS.forEach((key, idx) => {
      STAGES.push({
        id: `${project.id}-${key}`,
        projectId: project.id,
        key,
        status: idx === 0 ? "current" : "pending",
        progress: idx === 0 ? 5 : 0,
        responsibleTeam: ["Delta Structural", "Vector MEP", "Marble & Line", "Clearview Facade", "Atelier Finishing", "Horizon Handover"][idx],
        estimatedCompletion: iso(30 + idx * 45),
        delayDays: 0,
        lastUpdate: nowIso(),
        photosCount: 0,
        documentsCount: 0,
        commentsCount: 0,
        notes: idx === 0 ? "Team currently working on this stage." : "Awaiting kickoff.",
      });
    });
    emit();
    return project;
  },
  updateProject(id: string, patch: Partial<CompanyProject>) {
    const p = PROJECTS.find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, patch, { updatedAt: nowIso() });
    emit();
    return p;
  },
  deleteProject(id: string) {
    const idx = PROJECTS.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    PROJECTS.splice(idx, 1);
    for (let i = STAGES.length - 1; i >= 0; i--) if (STAGES[i].projectId === id) STAGES.splice(i, 1);
    for (let i = APARTMENTS.length - 1; i >= 0; i--) if (APARTMENTS[i].projectId === id) APARTMENTS.splice(i, 1);
    emit();
    return true;
  },

  // ---- tenants CRUD
  getTenants: () => delay([...TENANTS]),
  getTenant: (id: string) => delay(TENANTS.find((t) => t.id === id) ?? null),
  createTenant(input: Omit<CompanyTenant, "id" | "createdAt">) {
    const tenant: CompanyTenant = { id: uid("ct-"), createdAt: nowIso(), ...input };
    TENANTS.unshift(tenant);
    emit();
    return tenant;
  },
  updateTenant(id: string, patch: Partial<CompanyTenant>) {
    const t = TENANTS.find((x) => x.id === id);
    if (!t) return null;
    Object.assign(t, patch);
    emit();
    return t;
  },
  deleteTenant(id: string) {
    const idx = TENANTS.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    TENANTS.splice(idx, 1);
    APARTMENTS.forEach((a) => { if (a.tenantId === id) { a.tenantId = undefined; a.status = "vacant"; } });
    emit();
    return true;
  },

  // ---- apartments (locations)
  getApartments: () => delay([...APARTMENTS]),
  getApartmentsForProject: (projectId: string) => delay(APARTMENTS.filter((a) => a.projectId === projectId)),
  createApartment(input: Omit<Apartment, "id" | "status"> & Partial<Pick<Apartment, "status">>) {
    const status: ApartmentStatus = input.tenantId ? "assigned" : (input.status ?? "vacant");
    const apt: Apartment = {
      id: uid("ap-"),
      status,
      projectId: input.projectId,
      building: input.building,
      entrance: input.entrance,
      floor: input.floor,
      number: input.number,
      rooms: input.rooms,
      sizeSqm: input.sizeSqm,
      tenantId: input.tenantId,
      notes: input.notes,
    };
    APARTMENTS.unshift(apt);
    emit();
    return apt;
  },
  updateApartment(id: string, patch: Partial<Apartment>) {
    const a = APARTMENTS.find((x) => x.id === id);
    if (!a) return null;
    Object.assign(a, patch);
    emit();
    return a;
  },
  deleteApartment(id: string) {
    const idx = APARTMENTS.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    APARTMENTS.splice(idx, 1);
    emit();
    return true;
  },
  assignTenantToApartment(apartmentId: string, tenantId: string | null) {
    const a = APARTMENTS.find((x) => x.id === apartmentId);
    if (!a) return null;
    if (tenantId) {
      a.tenantId = tenantId;
      a.status = "assigned";
      const tenant = TENANTS.find((t) => t.id === tenantId);
      if (tenant) ACTIVITY.unshift({ id: uid("ca-"), type: "stage_updated", actor: tenant.name, projectId: a.projectId, message: `assigned to apartment ${a.building}/${a.entrance}/${a.floor}/${a.number}`, createdAt: nowIso() });
    } else {
      a.tenantId = undefined;
      a.status = "vacant";
    }
    emit();
    return a;
  },

  // ---- stages
  updateStage(id: string, patch: Partial<CompanyStage>) {
    const s = STAGES.find((x) => x.id === id);
    if (!s) return null;
    Object.assign(s, patch, { lastUpdate: nowIso() });
    if (typeof patch.progress === "number") {
      const p = PROJECTS.find((x) => x.id === s.projectId);
      if (p && p.currentStage === s.key) { p.progress = patch.progress; p.updatedAt = nowIso(); }
      if (patch.progress >= 100) { s.status = "completed"; s.actualCompletion = nowIso(); }
    }
    ACTIVITY.unshift({ id: uid("ca-"), type: "stage_updated", actor: s.responsibleTeam, projectId: s.projectId, message: `updated stage ${s.key} (${s.progress}%)`, createdAt: nowIso() });
    emit();
    return s;
  },
  addStageComment(input: Omit<CompanyComment, "id" | "createdAt" | "attachments"> & Partial<Pick<CompanyComment, "attachments">>) {
    const c: CompanyComment = { id: uid("cc-"), createdAt: nowIso(), attachments: input.attachments ?? 0, ...input };
    COMMENTS.unshift(c);
    const s = STAGES.find((x) => x.projectId === c.projectId && x.key === c.stageKey);
    if (s) s.commentsCount += 1;
    emit();
    return c;
  },

  // ---- meetings
  createMeeting(input: Omit<CompanyMeeting, "id">) {
    const m: CompanyMeeting = { id: uid("cm-"), ...input };
    MEETINGS.unshift(m);
    ACTIVITY.unshift({ id: uid("ca-"), type: "meeting_approved", actor: "Company", projectId: m.projectId, message: `scheduled meeting ${m.title}`, createdAt: nowIso() });
    emit();
    return m;
  },
  updateMeeting(id: string, patch: Partial<CompanyMeeting>) {
    const m = MEETINGS.find((x) => x.id === id);
    if (!m) return null;
    Object.assign(m, patch);
    emit();
    return m;
  },
  setMeetingStatus(id: string, status: CompanyMeetingStatus) {
    const m = MEETINGS.find((x) => x.id === id);
    if (!m) return null;
    m.status = status;
    ACTIVITY.unshift({ id: uid("ca-"), type: status === "cancelled" ? "meeting_rejected" : "meeting_approved", actor: "Company", projectId: m.projectId, message: `${status} meeting ${m.title}`, createdAt: nowIso() });
    emit();
    return m;
  },
  deleteMeeting(id: string) {
    const idx = MEETINGS.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    MEETINGS.splice(idx, 1);
    emit();
    return true;
  },

  // ---- requests
  setRequestStatus(id: string, status: CompanyRequestStatus) {
    const r = REQUESTS.find((x) => x.id === id);
    if (!r) return null;
    r.status = status;
    ACTIVITY.unshift({ id: uid("ca-"), type: status === "completed" ? "request_completed" : "request_received", actor: "Company", projectId: r.projectId, message: `${status} request from ${r.tenantName}`, createdAt: nowIso() });
    emit();
    return r;
  },
  replyToRequest(id: string, message: string) {
    const r = REQUESTS.find((x) => x.id === id);
    if (!r) return null;
    if (r.status === "pending") r.status = "in_progress";
    COMMENTS.unshift({ id: uid("cc-"), projectId: r.projectId, author: "Company", role: "Building Company", message, createdAt: nowIso(), attachments: 0 });
    ACTIVITY.unshift({ id: uid("ca-"), type: "request_received", actor: "Company", projectId: r.projectId, message: `replied to ${r.tenantName}`, createdAt: nowIso() });
    emit();
    return r;
  },
};

