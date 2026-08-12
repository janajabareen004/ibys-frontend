/**
 * Mock service for the Project Manager workspace.
 *
 * Mutations mutate an in-memory store and emit a version bump so any
 * subscribed hook (see `useManagerData`) refetches automatically.
 * The shape mirrors what a real REST backend would return so components
 * can be re-wired later without behavioural changes.
 */

export type ProjectStatus = "on_track" | "at_risk" | "delayed" | "on_hold" | "completed";
export type ProjectStageKey =
  | "structural"
  | "electrical"
  | "plaster"
  | "windows"
  | "finishing"
  | "handover";

export type TaskStatus = "not_started" | "in_progress" | "waiting" | "completed" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type Employee = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatarSeed: string;
  workload: number;
  availability: "available" | "busy" | "off";
  projectIds: string[];
  lastActive: string;
};

export type ManagedTenant = {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone: string;
  building: string;
  entrance: string;
  floor: string;
  apartment: string;
};

export type ManagedProject = {
  id: string;
  name: string;
  clientName: string;
  address: string;
  progress: number;
  currentStage: ProjectStageKey;
  expectedCompletion: string;
  startDate: string;
  status: ProjectStatus;
  budget: { planned: number; spent: number; currency: string };
  description: string;
  team: string[];
  building: string;
  entrance: string;
  updatedAt: string;
};

export type ManagedStage = {
  id: string;
  projectId: string;
  key: ProjectStageKey;
  status: "completed" | "current" | "pending" | "delayed";
  progress: number;
  responsibleCompany: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  delayDays: number;
  photosCount: number;
  documentsCount: number;
  commentsCount: number;
  notes: string;
};

export type ManagedTask = {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  projectId: string;
  stageKey?: ProjectStageKey;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  tags: string[];
  subtasks: Array<{ id: string; title: string; done: boolean }>;
  attachments: Array<{ id: string; name: string; size: string }>;
  comments: Array<{ id: string; author: string; message: string; createdAt: string }>;
  activity: Array<{ id: string; action: string; author: string; createdAt: string }>;
  createdAt: string;
};

export type TenantRequestCategory = "photo" | "meeting" | "question" | "document";
export type TenantRequestStatus = "pending" | "approved" | "rejected" | "archived";
export type TenantRequestPriority = "low" | "medium" | "high";
export type ManagedRequest = {
  id: string;
  category: TenantRequestCategory;
  status: TenantRequestStatus;
  priority: TenantRequestPriority;
  projectId: string;
  tenantName: string;
  assignedTo?: string;
  description: string;
  reply?: string;
  createdAt: string;
};

export type ManagedMeeting = {
  id: string;
  title: string;
  projectId: string;
  when: string;
  durationMin: number;
  location: string;
  agenda: string;
  participants: string[];
  status: "upcoming" | "today" | "past" | "cancelled" | "rescheduled";
  notes?: string;
};

export type ManagedNotification = {
  id: string;
  category: "project" | "task" | "meeting" | "construction" | "system" | "request";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type ActivityEvent = {
  id: string;
  type:
    | "task_completed"
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "meeting_scheduled"
    | "meeting_updated"
    | "stage_updated"
    | "photo_uploaded"
    | "document_added"
    | "request_received"
    | "request_replied"
    | "request_approved"
    | "request_rejected"
    | "note_added";
  actor: string;
  projectId?: string;
  message: string;
  createdAt: string;
};

export type ManagedPhoto = {
  id: string;
  projectId: string;
  stageKey: ProjectStageKey;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  color: string; // seed for the placeholder swatch
  url?: string; // real image URL; falls back to the placeholder swatch when absent
};

export type ManagedDocumentCategory = "contract" | "permit" | "drawing" | "report" | "invoice";
export type ManagedDocument = {
  id: string;
  projectId: string;
  stageKey?: ProjectStageKey;
  name: string;
  category: ManagedDocumentCategory;
  size: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string; // persisted file_url (used for download); absent for legacy rows
};

export type ManagedNote = {
  id: string;
  projectId: string;
  author: string;
  body: string;
  createdAt: string;
};

const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const iso = (offsetDays: number, offsetHours = 0) =>
  new Date(Date.now() + offsetDays * 86400000 + offsetHours * 3600000).toISOString();
const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

// ---------------------------------------------------------------------------
// Pub/sub — hooks subscribe and refetch when the store changes.
// ---------------------------------------------------------------------------
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((cb) => cb());
};
export const mockManagerBus = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  version: () => version,
};

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Omar Haddad", role: "Senior Project Manager", email: "omar@ibys.co", phone: "+972 50 111 2211", avatarSeed: "omar", workload: 82, availability: "busy", projectIds: ["p1", "p2", "p4"], lastActive: iso(0, -1) },
  { id: "e2", name: "Lena Cohen", role: "Site Coordinator", email: "lena@ibys.co", phone: "+972 50 222 3311", avatarSeed: "lena", workload: 68, availability: "available", projectIds: ["p1", "p3"], lastActive: iso(0, -3) },
  { id: "e3", name: "Karim Nasser", role: "MEP Supervisor", email: "karim@ibys.co", phone: "+972 50 333 4411", avatarSeed: "karim", workload: 90, availability: "busy", projectIds: ["p2", "p4"], lastActive: iso(0, -2) },
  { id: "e4", name: "Rachel Levi", role: "Quality Inspector", email: "rachel@ibys.co", phone: "+972 50 444 5511", avatarSeed: "rachel", workload: 55, availability: "available", projectIds: ["p1", "p3", "p5"], lastActive: iso(-1) },
  { id: "e5", name: "Tariq Amin", role: "Finishing Lead", email: "tariq@ibys.co", phone: "+972 50 555 6611", avatarSeed: "tariq", workload: 40, availability: "off", projectIds: ["p5"], lastActive: iso(-2) },
  { id: "e6", name: "Noa Bar", role: "Document Controller", email: "noa@ibys.co", phone: "+972 50 666 7711", avatarSeed: "noa", workload: 60, availability: "available", projectIds: ["p2", "p3", "p4"], lastActive: iso(0, -4) },
];

const PROJECTS: ManagedProject[] = [
  { id: "p1", name: "Marina Heights, Block B", clientName: "Sara Tenant", address: "45 Coastline Ave, Marina District", progress: 62, currentStage: "plaster", expectedCompletion: iso(220), startDate: iso(-360), status: "on_track", budget: { planned: 4200000, spent: 2500000, currency: "USD" }, description: "12-story boutique residential tower with marina-facing lobby, rooftop terrace and underground parking.", team: ["e1", "e2", "e4"], building: "B", entrance: "2", updatedAt: iso(0, -2) },
  { id: "p2", name: "Palm Residences", clientName: "David Ben-Ami", address: "12 Palm Boulevard, Hadera", progress: 34, currentStage: "electrical", expectedCompletion: iso(310), startDate: iso(-240), status: "at_risk", budget: { planned: 3100000, spent: 1400000, currency: "USD" }, description: "Two mid-rise residential blocks with shared garden podium and retail ground floor.", team: ["e1", "e3", "e6"], building: "A", entrance: "1", updatedAt: iso(-1) },
  { id: "p3", name: "Cedar Grove Villas", clientName: "Mira Sasson", address: "8 Cedar Grove, Ramat Gan", progress: 78, currentStage: "finishing", expectedCompletion: iso(90), startDate: iso(-540), status: "on_track", budget: { planned: 2400000, spent: 1900000, currency: "USD" }, description: "Cluster of eight luxury villas with private pools and shared clubhouse.", team: ["e2", "e4", "e6"], building: "V", entrance: "—", updatedAt: iso(-2) },
  { id: "p4", name: "Skyline Offices", clientName: "Northline Holdings", address: "1 Skyline Plaza, Tel Aviv", progress: 22, currentStage: "structural", expectedCompletion: iso(480), startDate: iso(-120), status: "delayed", budget: { planned: 8600000, spent: 2100000, currency: "USD" }, description: "22-story LEED-gold office tower with double-height lobby and rooftop restaurant.", team: ["e1", "e3", "e6"], building: "T", entrance: "1", updatedAt: iso(-3) },
  { id: "p5", name: "Old Town Refurbishment", clientName: "Municipality of Jaffa", address: "Old Town Square, Jaffa", progress: 88, currentStage: "handover", expectedCompletion: iso(30), startDate: iso(-600), status: "on_track", budget: { planned: 1200000, spent: 1100000, currency: "USD" }, description: "Heritage restoration of six façades and a public plaza with new lighting.", team: ["e4", "e5"], building: "—", entrance: "—", updatedAt: iso(-1) },
  { id: "p6", name: "Harbor View Lofts", clientName: "Ella Katz", address: "3 Harbor Rd, Ashdod", progress: 5, currentStage: "structural", expectedCompletion: iso(560), startDate: iso(-30), status: "on_hold", budget: { planned: 2800000, spent: 200000, currency: "USD" }, description: "Loft-style residential development pending permit approval.", team: ["e1"], building: "L", entrance: "1", updatedAt: iso(-6) },
];

const STAGE_KEYS: ProjectStageKey[] = ["structural", "electrical", "plaster", "windows", "finishing", "handover"];

const STAGES: ManagedStage[] = PROJECTS.flatMap((project) =>
  STAGE_KEYS.map<ManagedStage>((key, idx) => {
    const currentIdx = STAGE_KEYS.indexOf(project.currentStage);
    let status: ManagedStage["status"] = "pending";
    let progress = 0;
    if (idx < currentIdx) { status = "completed"; progress = 100; }
    else if (idx === currentIdx) { status = project.status === "delayed" ? "delayed" : "current"; progress = project.progress % 100 || 40; }
    const delayDays = status === "delayed" ? 12 : 0;
    return {
      id: `${project.id}-${key}`,
      projectId: project.id,
      key,
      status,
      progress,
      responsibleCompany: ["Delta Structural", "Vector MEP", "Marble & Line", "Clearview Facade", "Atelier Finishing", "Horizon Dev"][idx],
      estimatedCompletion: iso(30 + idx * 45),
      actualCompletion: status === "completed" ? iso(-10 - idx * 20) : undefined,
      delayDays,
      photosCount: [128, 96, 41, 0, 4, 0][idx],
      documentsCount: [14, 22, 7, 3, 5, 2][idx],
      commentsCount: [6, 9, 12, 1, 3, 0][idx],
      notes:
        status === "delayed"
          ? "Kitchen supplier lead time extended by 3 weeks."
          : status === "current"
            ? "Team currently working on this stage."
            : status === "completed"
              ? "Stage completed and signed off."
              : "Awaiting kickoff.",
    };
  }),
);

const TASK_TITLES = [
  "Coordinate MEP inspection",
  "Review structural drawings v3",
  "Approve plaster finish samples",
  "Order kitchen cabinet units",
  "Site safety audit walkthrough",
  "Prepare monthly tenant update",
  "Schedule crane delivery",
  "Reply to tenant photo request",
  "Sign off electrical rough-in",
  "Update project risk register",
  "Confirm window glazing spec",
  "Verify concrete pour test report",
];

const TASKS: ManagedTask[] = TASK_TITLES.map((title, i) => {
  const project = PROJECTS[i % PROJECTS.length];
  const employee = EMPLOYEES[i % EMPLOYEES.length];
  const priorities: TaskPriority[] = ["low", "medium", "high", "critical"];
  const statuses: TaskStatus[] = ["not_started", "in_progress", "waiting", "completed", "blocked"];
  const status = statuses[i % statuses.length];
  const progress = status === "completed" ? 100 : status === "in_progress" ? 55 : status === "waiting" ? 30 : status === "blocked" ? 15 : 0;
  return {
    id: `t${i + 1}`,
    title,
    description: "Ensure documentation is up to date and stakeholders are notified.",
    assignedTo: employee.id,
    projectId: project.id,
    stageKey: STAGE_KEYS[i % STAGE_KEYS.length],
    dueDate: iso(i - 3),
    priority: priorities[i % priorities.length],
    status,
    progress,
    tags: [["safety"], ["structural"], ["finishing"], ["procurement"], ["quality"], ["client"]][i % 6],
    subtasks: [
      { id: `t${i + 1}-s1`, title: "Prepare checklist", done: true },
      { id: `t${i + 1}-s2`, title: "Coordinate with contractor", done: progress > 40 },
      { id: `t${i + 1}-s3`, title: "Final sign-off", done: progress === 100 },
    ],
    attachments: [{ id: `t${i + 1}-a1`, name: `${title.slice(0, 12)}.pdf`, size: "820 KB" }],
    comments: [
      { id: `t${i + 1}-c1`, author: "Omar Haddad", message: "Please prioritise this before Friday.", createdAt: iso(-2, -3) },
      { id: `t${i + 1}-c2`, author: employee.name, message: "Working on it, will update tomorrow.", createdAt: iso(-1, -1) },
    ],
    activity: [
      { id: `t${i + 1}-e1`, action: "Task created", author: "Omar Haddad", createdAt: iso(-5) },
      { id: `t${i + 1}-e2`, action: "Task assigned", author: "Omar Haddad", createdAt: iso(-4) },
      { id: `t${i + 1}-e3`, action: "Status updated", author: employee.name, createdAt: iso(-1) },
    ],
    createdAt: iso(-10 + i),
  };
});

const REQUESTS: ManagedRequest[] = [
  { id: "r1", category: "photo", status: "pending", priority: "high", projectId: "p1", tenantName: "Sara Tenant", description: "Please share updated photos of the master bathroom finish.", createdAt: iso(-1, -2), assignedTo: "e2" },
  { id: "r2", category: "meeting", status: "pending", priority: "medium", projectId: "p2", tenantName: "David Ben-Ami", description: "Requesting a walkthrough next week to review MEP.", createdAt: iso(-2), assignedTo: "e1" },
  { id: "r3", category: "question", status: "approved", priority: "low", projectId: "p1", tenantName: "Sara Tenant", description: "Which paint finish will be used in the living room?", createdAt: iso(-4), assignedTo: "e4" },
  { id: "r4", category: "document", status: "pending", priority: "high", projectId: "p3", tenantName: "Mira Sasson", description: "Requesting the latest structural inspection report.", createdAt: iso(-3), assignedTo: "e6" },
  { id: "r5", category: "meeting", status: "rejected", priority: "medium", projectId: "p4", tenantName: "Northline Holdings", description: "Requested meeting time conflicts with structural pour.", createdAt: iso(-6) },
  { id: "r6", category: "photo", status: "approved", priority: "medium", projectId: "p3", tenantName: "Mira Sasson", description: "Landscape progress photos requested.", createdAt: iso(-1, -8), assignedTo: "e2" },
];

const MEETINGS: ManagedMeeting[] = [
  { id: "m1", title: "Weekly project sync — Marina B", projectId: "p1", when: iso(0, 3), durationMin: 45, location: "Video call", agenda: "Progress review, risks, blockers.", participants: ["Omar Haddad", "Sara Tenant", "Marble & Line"], status: "today" },
  { id: "m2", title: "MEP coordination — Palm Residences", projectId: "p2", when: iso(1, 2), durationMin: 60, location: "Site office", agenda: "Rough-in coordination and sign-off checklist.", participants: ["Karim Nasser", "Vector MEP"], status: "upcoming" },
  { id: "m3", title: "Finishes walkthrough — Cedar Grove", projectId: "p3", when: iso(3, 4), durationMin: 90, location: "On-site", agenda: "Client selection walkthrough.", participants: ["Lena Cohen", "Mira Sasson"], status: "upcoming" },
  { id: "m4", title: "Skyline structural review", projectId: "p4", when: iso(-3, -2), durationMin: 60, location: "Video call", agenda: "Recovery plan for delayed pours.", participants: ["Omar Haddad", "Delta Structural"], status: "past", notes: "Agreed on revised pour schedule; sub-contractor to send updated plan by Friday." },
  { id: "m5", title: "Old Town handover prep", projectId: "p5", when: iso(-1, -4), durationMin: 45, location: "Site office", agenda: "Handover checklist and snag list.", participants: ["Tariq Amin", "Rachel Levi"], status: "past" },
  { id: "m6", title: "Harbor View kickoff", projectId: "p6", when: iso(-2, -1), durationMin: 60, location: "HQ boardroom", agenda: "Kickoff meeting.", participants: ["Omar Haddad"], status: "cancelled" },
  { id: "m7", title: "Marina B safety briefing", projectId: "p1", when: iso(5, 3), durationMin: 30, location: "On-site", agenda: "Monthly safety briefing.", participants: ["Rachel Levi"], status: "rescheduled" },
];

const NOTIFICATIONS: ManagedNotification[] = [
  { id: "n1", category: "construction", title: "Plaster stage reached 58%", body: "Floors 5–8 completed on Marina B.", createdAt: iso(0, -1), read: false },
  { id: "n2", category: "request", title: "New tenant request", body: "Sara Tenant requested master bathroom photos.", createdAt: iso(0, -3), read: false },
  { id: "n3", category: "meeting", title: "Meeting scheduled", body: "MEP coordination scheduled for tomorrow.", createdAt: iso(-1), read: true },
  { id: "n4", category: "task", title: "Task overdue", body: "Order kitchen cabinet units is 2 days overdue.", createdAt: iso(-1, -4), read: false },
  { id: "n5", category: "project", title: "Project flagged at risk", body: "Palm Residences has been flagged at risk.", createdAt: iso(-2), read: true },
  { id: "n6", category: "system", title: "Weekly report ready", body: "Portfolio report for last week is ready for review.", createdAt: iso(-3), read: true },
];

const ACTIVITY: ActivityEvent[] = [
  { id: "a1", type: "task_completed", actor: "Rachel Levi", projectId: "p3", message: "completed Site safety audit walkthrough", createdAt: iso(0, -1) },
  { id: "a2", type: "meeting_scheduled", actor: "Omar Haddad", projectId: "p2", message: "scheduled MEP coordination meeting", createdAt: iso(0, -3) },
  { id: "a3", type: "stage_updated", actor: "Marble & Line", projectId: "p1", message: "updated plaster stage progress to 58%", createdAt: iso(-1) },
  { id: "a4", type: "photo_uploaded", actor: "Lena Cohen", projectId: "p3", message: "uploaded 6 new site photos", createdAt: iso(-1, -5) },
  { id: "a5", type: "document_added", actor: "Noa Bar", projectId: "p2", message: "added MEP coordination report v2", createdAt: iso(-2) },
  { id: "a6", type: "request_received", actor: "Sara Tenant", projectId: "p1", message: "requested master bathroom photos", createdAt: iso(-2, -6) },
  { id: "a7", type: "task_created", actor: "Omar Haddad", projectId: "p4", message: "created Update project risk register", createdAt: iso(-3) },
  { id: "a8", type: "stage_updated", actor: "Delta Structural", projectId: "p4", message: "flagged structural stage as delayed", createdAt: iso(-3, -2) },
];

const COLORS = ["#0F4C5C", "#2C7A7B", "#D9A441", "#5B7C99", "#8B5E3C", "#4A6D7C"];
const PHOTOS: ManagedPhoto[] = PROJECTS.flatMap((p, pi) =>
  STAGE_KEYS.slice(0, 4).map<ManagedPhoto>((k, i) => ({
    id: `ph-${p.id}-${k}-${i}`,
    projectId: p.id,
    stageKey: k,
    title: `${p.name} — ${k} #${i + 1}`,
    uploadedBy: EMPLOYEES[(pi + i) % EMPLOYEES.length].name,
    uploadedAt: iso(-i * 2 - pi),
    color: COLORS[(pi + i) % COLORS.length],
  })),
);

const DOC_SEEDS: Array<{ name: string; category: ManagedDocumentCategory }> = [
  { name: "Structural drawings v3.pdf", category: "drawing" },
  { name: "Building permit A-2025.pdf", category: "permit" },
  { name: "MEP inspection report.pdf", category: "report" },
  { name: "Contract addendum #4.pdf", category: "contract" },
  { name: "Weekly progress report.pdf", category: "report" },
  { name: "Invoice #1024.pdf", category: "invoice" },
  { name: "Façade drawings v2.pdf", category: "drawing" },
];
const DOCUMENTS: ManagedDocument[] = PROJECTS.flatMap((p, pi) =>
  DOC_SEEDS.slice(0, 4 + (pi % 3)).map<ManagedDocument>((d, i) => ({
    id: `doc-${p.id}-${i}`,
    projectId: p.id,
    stageKey: STAGE_KEYS[i % STAGE_KEYS.length],
    name: d.name,
    category: d.category,
    size: `${(400 + i * 120).toString()} KB`,
    version: `v${1 + (i % 3)}`,
    uploadedBy: EMPLOYEES[(pi + i) % EMPLOYEES.length].name,
    uploadedAt: iso(-i - pi),
  })),
);

const NOTES: ManagedNote[] = [
  { id: "note-1", projectId: "p1", author: "Omar Haddad", body: "Client confirmed handover ceremony date. Prepare invitations.", createdAt: iso(-2) },
  { id: "note-2", projectId: "p2", author: "Karim Nasser", body: "MEP subcontractor requested revised schedule; discuss Monday.", createdAt: iso(-1) },
];

const TENANTS: ManagedTenant[] = [
  { id: "tn-1", projectId: "p1", name: "Sara Tenant", email: "sara@example.com", phone: "+972 50 123 4567", building: "B", entrance: "2", floor: "5", apartment: "12" },
  { id: "tn-2", projectId: "p1", name: "Noa Levi", email: "noa@example.com", phone: "+972 52 765 4321", building: "B", entrance: "2", floor: "8", apartment: "27" },
  { id: "tn-3", projectId: "p1", name: "Yosef Amir", email: "yosef@example.com", phone: "+972 53 445 1122", building: "B", entrance: "3", floor: "3", apartment: "7" },
  { id: "tn-4", projectId: "p2", name: "David Ben-Ami", email: "david@example.com", phone: "+972 54 900 2233", building: "A", entrance: "1", floor: "2", apartment: "4" },
  { id: "tn-5", projectId: "p3", name: "Mira Sasson", email: "mira@example.com", phone: "+972 50 800 4411", building: "V", entrance: "—", floor: "—", apartment: "3" },
  { id: "tn-6", projectId: "p4", name: "Northline Holdings", email: "contact@northline.co", phone: "+972 3 555 8899", building: "T", entrance: "1", floor: "12", apartment: "A" },
];

// ---------------------------------------------------------------------------
// Public store — getters + mutations
// ---------------------------------------------------------------------------

const nowIso = () => new Date().toISOString();
const activityFor = (type: ActivityEvent["type"], actor: string, message: string, projectId?: string) => {
  ACTIVITY.unshift({ id: uid("a-"), type, actor, projectId, message, createdAt: nowIso() });
};

export const mockManagerService = {
  // ---- reads
  getProjects: () => delay([...PROJECTS]),
  getProject: (id: string) => delay(PROJECTS.find((p) => p.id === id) ?? null),
  getStagesForProject: (projectId: string) => delay(STAGES.filter((s) => s.projectId === projectId)),
  getAllStages: () => delay([...STAGES]),
  getTasks: () => delay([...TASKS]),
  getTask: (id: string) => delay(TASKS.find((t) => t.id === id) ?? null),
  getRequests: () => delay([...REQUESTS]),
  getMeetings: () => delay([...MEETINGS]),
  getNotifications: () => delay([...NOTIFICATIONS]),
  getEmployees: () => delay([...EMPLOYEES]),
  getEmployee: (id: string) => delay(EMPLOYEES.find((e) => e.id === id) ?? null),
  getActivity: () => delay([...ACTIVITY]),
  getPhotos: () => delay([...PHOTOS]),
  getDocuments: () => delay([...DOCUMENTS]),
  getNotes: () => delay([...NOTES]),
  getTenants: () => delay([...TENANTS]),

  // ---- task mutations
  createTask(input: Partial<ManagedTask> & { title: string; projectId: string; assignedTo: string }) {
    const now = nowIso();
    const task: ManagedTask = {
      id: uid("t-"),
      title: input.title,
      description: input.description ?? "",
      assignedTo: input.assignedTo,
      projectId: input.projectId,
      stageKey: input.stageKey,
      dueDate: input.dueDate ?? iso(7),
      priority: input.priority ?? "medium",
      status: input.status ?? "not_started",
      progress: input.progress ?? 0,
      tags: input.tags ?? [],
      subtasks: input.subtasks ?? [],
      attachments: input.attachments ?? [],
      comments: input.comments ?? [],
      activity: [{ id: uid("ev-"), action: "Task created", author: "Omar Haddad", createdAt: now }],
      createdAt: now,
    };
    TASKS.unshift(task);
    activityFor("task_created", "Omar Haddad", `created ${task.title}`, task.projectId);
    emit();
    return task;
  },
  updateTask(id: string, patch: Partial<ManagedTask>) {
    const idx = TASKS.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const prev = TASKS[idx];
    const next: ManagedTask = { ...prev, ...patch };
    if (patch.status === "completed") next.progress = 100;
    next.activity = [...prev.activity, { id: uid("ev-"), action: "Task updated", author: "Omar Haddad", createdAt: nowIso() }];
    TASKS[idx] = next;
    activityFor(next.status === "completed" ? "task_completed" : "task_updated", "Omar Haddad", `${next.status === "completed" ? "completed" : "updated"} ${next.title}`, next.projectId);
    emit();
    return next;
  },
  deleteTask(id: string) {
    const idx = TASKS.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    const [t] = TASKS.splice(idx, 1);
    activityFor("task_deleted", "Omar Haddad", `deleted ${t.title}`, t.projectId);
    emit();
    return true;
  },
  addTaskComment(taskId: string, message: string, author = "Omar Haddad") {
    const t = TASKS.find((t) => t.id === taskId);
    if (!t) return null;
    t.comments = [...t.comments, { id: uid("c-"), author, message, createdAt: nowIso() }];
    t.activity = [...t.activity, { id: uid("ev-"), action: "Comment added", author, createdAt: nowIso() }];
    emit();
    return t;
  },
  toggleSubtask(taskId: string, subtaskId: string) {
    const t = TASKS.find((t) => t.id === taskId);
    if (!t) return null;
    t.subtasks = t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
    emit();
    return t;
  },

  // ---- team mutations
  addEmployee(input: { projectId: string; name: string; role?: string; email?: string; phone?: string; availability?: Employee["availability"] }) {
    const employee: Employee = {
      id: uid("e-"),
      name: input.name,
      role: input.role ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      avatarSeed: input.name,
      workload: 0,
      availability: input.availability ?? "available",
      projectIds: [input.projectId],
      lastActive: nowIso(),
    };
    EMPLOYEES.unshift(employee);
    emit();
    return employee;
  },

  // ---- stage mutations
  updateStage(id: string, patch: Partial<Pick<ManagedStage, "progress" | "status" | "notes" | "estimatedCompletion" | "actualCompletion">>) {
    const s = STAGES.find((s) => s.id === id);
    if (!s) return null;
    Object.assign(s, patch);
    if (patch.status === "completed") { s.progress = 100; s.actualCompletion = s.actualCompletion ?? nowIso(); }
    activityFor("stage_updated", "Omar Haddad", `updated ${s.key} stage progress to ${s.progress}%`, s.projectId);
    // Reflect on parent project progress if applicable
    const proj = PROJECTS.find((p) => p.id === s.projectId);
    if (proj && s.key === proj.currentStage) proj.updatedAt = nowIso();
    emit();
    return s;
  },

  // ---- meeting mutations
  createMeeting(input: Partial<ManagedMeeting> & { title: string; projectId: string; when: string }) {
    const m: ManagedMeeting = {
      id: uid("m-"),
      title: input.title,
      projectId: input.projectId,
      when: input.when,
      durationMin: input.durationMin ?? 60,
      location: input.location ?? "Video call",
      agenda: input.agenda ?? "",
      participants: input.participants ?? [],
      status: input.status ?? "upcoming",
      notes: input.notes,
    };
    MEETINGS.unshift(m);
    activityFor("meeting_scheduled", "Omar Haddad", `scheduled ${m.title}`, m.projectId);
    emit();
    return m;
  },
  updateMeeting(id: string, patch: Partial<ManagedMeeting>) {
    const m = MEETINGS.find((m) => m.id === id);
    if (!m) return null;
    Object.assign(m, patch);
    activityFor("meeting_updated", "Omar Haddad", `updated ${m.title}`, m.projectId);
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

  // ---- request mutations
  updateRequest(id: string, patch: Partial<ManagedRequest>) {
    const r = REQUESTS.find((r) => r.id === id);
    if (!r) return null;
    Object.assign(r, patch);
    if (patch.status === "approved") activityFor("request_approved", "Omar Haddad", `approved ${r.category} request from ${r.tenantName}`, r.projectId);
    if (patch.status === "rejected") activityFor("request_rejected", "Omar Haddad", `rejected ${r.category} request from ${r.tenantName}`, r.projectId);
    if (patch.reply) activityFor("request_replied", "Omar Haddad", `replied to ${r.tenantName}`, r.projectId);
    emit();
    return r;
  },

  // ---- notifications
  markNotificationRead(id: string, read = true) {
    const n = NOTIFICATIONS.find((n) => n.id === id);
    if (!n) return;
    n.read = read;
    emit();
  },
  markAllNotificationsRead() {
    NOTIFICATIONS.forEach((n) => { n.read = true; });
    emit();
  },

  // ---- photos
  addPhoto(input: Omit<ManagedPhoto, "id" | "uploadedAt" | "color"> & Partial<Pick<ManagedPhoto, "color">>) {
    const p: ManagedPhoto = {
      id: uid("ph-"),
      color: input.color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
      uploadedAt: nowIso(),
      ...input,
    };
    PHOTOS.unshift(p);
    activityFor("photo_uploaded", input.uploadedBy, `uploaded ${p.title}`, p.projectId);
    emit();
    return p;
  },
  deletePhoto(id: string) {
    const idx = PHOTOS.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    PHOTOS.splice(idx, 1);
    emit();
    return true;
  },

  // ---- documents
  addDocument(input: Omit<ManagedDocument, "id" | "uploadedAt">) {
    const d: ManagedDocument = { id: uid("doc-"), uploadedAt: nowIso(), ...input };
    DOCUMENTS.unshift(d);
    activityFor("document_added", input.uploadedBy, `added ${d.name}`, d.projectId);
    emit();
    return d;
  },
  deleteDocument(id: string) {
    const idx = DOCUMENTS.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    DOCUMENTS.splice(idx, 1);
    emit();
    return true;
  },

  // ---- notes
  addNote(projectId: string, body: string, author = "Omar Haddad") {
    const n: ManagedNote = { id: uid("note-"), projectId, author, body, createdAt: nowIso() };
    NOTES.unshift(n);
    activityFor("note_added", author, "added a project note", projectId);
    emit();
    return n;
  },
  deleteNote(id: string) {
    const idx = NOTES.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    NOTES.splice(idx, 1);
    emit();
    return true;
  },
};

export type MockManagerService = typeof mockManagerService;
