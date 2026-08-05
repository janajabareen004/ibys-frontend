/**
 * Mock tenant data service.
 * Simulates async responses so components can be wired to real APIs later
 * without any behavioural changes.
 */

export type StageStatus = "completed" | "current" | "pending" | "delayed";

export type StageId =
  | "structural"
  | "electrical"
  | "plaster"
  | "windows"
  | "finishing"
  | "handover";

export type Stage = {
  id: StageId;
  order: number;
  nameKey: string;
  status: StageStatus;
  progress: number;
  description: string;
  estimatedDate: string; // ISO
  completionDate?: string;
  photosCount: number;
  documentsCount: number;
  commentsCount: number;
  delayReason?: string;
  responsibleCompany: string;
  latestUpdate: string;
};

export type Project = {
  id: string;
  name: string;
  address: string;
  developer: string;
  manager: { name: string; email: string; phone: string };
  progress: number;
  expectedDelivery: string;
  description: string;
  building: {
    floors: number;
    units: number;
    apartmentArea: string;
    type: string;
    reference: string;
  };
  currentStageId: StageId;
};

export type Photo = {
  id: string;
  stageId: StageId;
  title: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type Doc = {
  id: string;
  name: string;
  category: "contract" | "permit" | "drawing" | "report" | "invoice";
  updatedAt: string;
  size: string;
  url?: string;
};

export type Comment = {
  id: string;
  stageId?: StageId;
  author: string;
  role: "TENANT" | "PROJECT_MANAGER" | "BUILDING_COMPANY";
  message: string;
  createdAt: string;
  likes: number;
  replies?: Array<{ id: string; author: string; role: Comment["role"]; message: string; createdAt: string }>;
};

export type Meeting = {
  id: string;
  title: string;
  when: string; // ISO
  durationMin: number;
  location: string;
  participants: string[];
  status: "upcoming" | "past" | "cancelled";
  notes?: string;
};

export type Notification = {
  id: string;
  category: "project" | "meeting" | "documents" | "construction" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type PhotoRequest = {
  id: string;
  stageId: StageId;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "approved" | "completed" | "rejected";
  createdAt: string;
};

const delay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));

// ------------------------------------------------------------------
// Seed data
// ------------------------------------------------------------------

const PROJECT: Project = {
  id: "prj-marina-b",
  name: "Marina Heights, Block B",
  address: "45 Coastline Avenue, Marina District",
  developer: "Horizon Developments Ltd.",
  manager: { name: "Omar Haddad", email: "omar@horizon.dev", phone: "+972 50 123 4567" },
  progress: 62,
  expectedDelivery: "2026-11-30",
  description:
    "A boutique residential tower featuring 12 stories of premium apartments with a marina-facing lobby, rooftop terrace, and underground parking.",
  building: {
    floors: 12,
    units: 84,
    apartmentArea: "112 m²",
    type: "3 bedroom, sea view",
    reference: "B-702",
  },
  currentStageId: "plaster",
};

const STAGES: Stage[] = [
  {
    id: "structural",
    order: 1,
    nameKey: "tenant.timeline.stages.structural",
    status: "completed",
    progress: 100,
    description: "Foundations, columns, slabs and structural frame across all floors.",
    estimatedDate: "2025-08-15",
    completionDate: "2025-08-02",
    photosCount: 128,
    documentsCount: 14,
    commentsCount: 6,
    responsibleCompany: "Delta Structural Group",
    latestUpdate: "All structural inspections passed with zero deficiencies.",
  },
  {
    id: "electrical",
    order: 2,
    nameKey: "tenant.timeline.stages.electrical",
    status: "completed",
    progress: 100,
    description: "Full MEP rough-in: electrical conduits, plumbing risers and HVAC ducting.",
    estimatedDate: "2025-11-20",
    completionDate: "2025-12-05",
    photosCount: 96,
    documentsCount: 22,
    commentsCount: 9,
    responsibleCompany: "Vector MEP Services",
    latestUpdate: "Final pressure test on plumbing risers completed successfully.",
  },
  {
    id: "plaster",
    order: 3,
    nameKey: "tenant.timeline.stages.plaster",
    status: "current",
    progress: 58,
    description: "Interior plastering, screed leveling and ceramic flooring installation.",
    estimatedDate: "2026-04-10",
    photosCount: 41,
    documentsCount: 7,
    commentsCount: 12,
    responsibleCompany: "Marble & Line Interiors",
    latestUpdate: "Floors 5–8 completed. Team currently working on floors 9–10.",
  },
  {
    id: "windows",
    order: 4,
    nameKey: "tenant.timeline.stages.windows",
    status: "pending",
    progress: 0,
    description: "Aluminium window frames, glazing and internal doors on every unit.",
    estimatedDate: "2026-06-15",
    photosCount: 0,
    documentsCount: 3,
    commentsCount: 1,
    responsibleCompany: "Clearview Facade Co.",
    latestUpdate: "Material samples approved. Awaiting stage kickoff.",
  },
  {
    id: "finishing",
    order: 5,
    nameKey: "tenant.timeline.stages.finishing",
    status: "delayed",
    progress: 5,
    description: "Kitchen, bathroom, painting, trims and final finishes per unit.",
    estimatedDate: "2026-09-01",
    photosCount: 4,
    documentsCount: 5,
    commentsCount: 3,
    delayReason: "Kitchen supplier lead time extended by 3 weeks.",
    responsibleCompany: "Atelier Finishing Studio",
    latestUpdate: "Revised schedule under review with the developer.",
  },
  {
    id: "handover",
    order: 6,
    nameKey: "tenant.timeline.stages.handover",
    status: "pending",
    progress: 0,
    description: "Final inspection, snag list, key handover and warranty documentation.",
    estimatedDate: "2026-11-30",
    photosCount: 0,
    documentsCount: 2,
    commentsCount: 0,
    responsibleCompany: "Horizon Developments Ltd.",
    latestUpdate: "Handover checklist template shared with tenant.",
  },
];

const STAGE_IMAGES: Record<StageId, string[]> = {
  structural: [
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541976590-713941681591?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590725140246-20acdee442be?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80&auto=format&fit=crop",
  ],
  electrical: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581091870622-1c6a4ce7f4b0?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1609205807107-e8ec2120f9de?w=1200&q=80&auto=format&fit=crop",
  ],
  plaster: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&q=80&auto=format&fit=crop",
  ],
  windows: [
    "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600566753051-6057b6947b40?w=1200&q=80&auto=format&fit=crop",
  ],
  finishing: [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600566753086-00f18fe6b3ea?w=1200&q=80&auto=format&fit=crop",
  ],
  handover: [
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80&auto=format&fit=crop",
  ],
};

const stagePhoto = (stageId: StageId, i: number): Photo => {
  const pool = STAGE_IMAGES[stageId] ?? STAGE_IMAGES.structural;
  return {
    id: `${stageId}-p${i}`,
    stageId,
    title: `${stageId.charAt(0).toUpperCase() + stageId.slice(1)} progress #${i}`,
    url: pool[(i - 1) % pool.length],
    uploadedAt: new Date(Date.now() - i * 86400000).toISOString(),
    uploadedBy: "Site Foreman",
  };
};

const PHOTOS: Photo[] = [
  ...Array.from({ length: 6 }, (_, i) => stagePhoto("structural", i + 1)),
  ...Array.from({ length: 5 }, (_, i) => stagePhoto("electrical", i + 1)),
  ...Array.from({ length: 8 }, (_, i) => stagePhoto("plaster", i + 1)),
  ...Array.from({ length: 2 }, (_, i) => stagePhoto("finishing", i + 1)),
];

const DOCS: Doc[] = [
  { id: "d1", name: "Purchase Agreement – Unit B-702.pdf", category: "contract", updatedAt: "2025-02-14", size: "1.4 MB" },
  { id: "d2", name: "Building Permit – Marina B.pdf", category: "permit", updatedAt: "2025-03-02", size: "820 KB" },
  { id: "d3", name: "Architectural Plans – Floor 7.pdf", category: "drawing", updatedAt: "2025-06-19", size: "3.2 MB" },
  { id: "d4", name: "MEP Coordination Report.pdf", category: "report", updatedAt: "2025-12-08", size: "2.1 MB" },
  { id: "d5", name: "Progress Report – Q1 2026.pdf", category: "report", updatedAt: "2026-04-04", size: "1.9 MB" },
  { id: "d6", name: "Invoice #INV-0042.pdf", category: "invoice", updatedAt: "2026-03-15", size: "310 KB" },
  { id: "d7", name: "Finishes Selection Guide.pdf", category: "drawing", updatedAt: "2026-05-01", size: "4.6 MB" },
];

const COMMENTS: Comment[] = [
  {
    id: "c1",
    stageId: "plaster",
    author: "Omar Haddad",
    role: "PROJECT_MANAGER",
    message: "Great progress this week. Floors 5–8 plaster works are visually excellent.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: 4,
    replies: [
      {
        id: "c1r1",
        author: "Marble & Line Interiors",
        role: "BUILDING_COMPANY",
        message: "Thank you! Team is proud of the finish quality.",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
  },
  {
    id: "c2",
    author: "Sara Tenant",
    role: "TENANT",
    message: "Could we please have more photos of the master bathroom area?",
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    likes: 1,
  },
  {
    id: "c3",
    stageId: "finishing",
    author: "Atelier Finishing Studio",
    role: "BUILDING_COMPANY",
    message: "We've locked in the revised kitchen delivery for July 12.",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    likes: 2,
  },
];

const MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Monthly progress review",
    when: new Date(Date.now() + 86400000 * 3 + 3600000 * 10).toISOString(),
    durationMin: 45,
    location: "Video call",
    participants: ["Sara Tenant", "Omar Haddad", "Delta Structural"],
    status: "upcoming",
  },
  {
    id: "m2",
    title: "Finishes selection walkthrough",
    when: new Date(Date.now() + 86400000 * 10 + 3600000 * 14).toISOString(),
    durationMin: 90,
    location: "Site office, Marina B",
    participants: ["Sara Tenant", "Atelier Finishing Studio"],
    status: "upcoming",
  },
  {
    id: "m3",
    title: "Structural stage sign-off",
    when: new Date(Date.now() - 86400000 * 30).toISOString(),
    durationMin: 60,
    location: "Site office, Marina B",
    participants: ["Sara Tenant", "Omar Haddad", "Delta Structural"],
    status: "past",
    notes: "All structural drawings approved and archived.",
  },
  {
    id: "m4",
    title: "MEP kickoff",
    when: new Date(Date.now() - 86400000 * 90).toISOString(),
    durationMin: 60,
    location: "Video call",
    participants: ["Sara Tenant", "Vector MEP"],
    status: "cancelled",
  },
];

const NOTIFICATIONS: Notification[] = [
  { id: "n1", category: "construction", title: "Plaster stage reached 58%", body: "Floors 5–8 completed.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), read: false },
  { id: "n2", category: "meeting", title: "Meeting scheduled", body: "Monthly progress review on Thursday, 10:00.", createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), read: false },
  { id: "n3", category: "documents", title: "New document shared", body: "Progress Report – Q1 2026 was uploaded.", createdAt: new Date(Date.now() - 3600000 * 20).toISOString(), read: false },
  { id: "n4", category: "project", title: "Delay flagged", body: "Finishing stage is currently delayed by ~3 weeks.", createdAt: new Date(Date.now() - 3600000 * 30).toISOString(), read: true },
  { id: "n5", category: "system", title: "Welcome to IBYS", body: "Your tenant workspace is ready.", createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), read: true },
];

const REQUESTS: PhotoRequest[] = [
  { id: "r1", stageId: "plaster", description: "Master bathroom close-ups.", priority: "medium", status: "pending", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "r2", stageId: "electrical", description: "Panel board and wiring diagrams.", priority: "low", status: "completed", createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
];

// ------------------------------------------------------------------
// Service surface
// ------------------------------------------------------------------

export const mockTenantService = {
  getProject: () => delay(PROJECT),
  getStages: () => delay(STAGES),
  getStage: (id: StageId) => delay(STAGES.find((s) => s.id === id) ?? null),
  getPhotos: () => delay(PHOTOS),
  getDocuments: () => delay(DOCS),
  getComments: () => delay(COMMENTS),
  getMeetings: () => delay(MEETINGS),
  getNotifications: () => delay(NOTIFICATIONS),
  getRequests: () => delay(REQUESTS),
  createRequest: (input: Omit<PhotoRequest, "id" | "status" | "createdAt">) => {
    const r: PhotoRequest = {
      ...input,
      id: `r${REQUESTS.length + 1}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    REQUESTS.unshift(r);
    return delay(r);
  },
};
