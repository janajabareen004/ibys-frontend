import type {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  Role,
  TenantProperty,
  UpdateProfilePayload,
} from "../api/authApi";

const DEFAULT_PASSWORD = "demo1234";

type MockUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  company?: string;
  property?: TenantProperty;
};

const MOCK_USERS: MockUser[] = [
  {
    id: "u-tenant-1",
    email: "tenant@ibys.dev",
    name: "Sara Tenant",
    role: "TENANT",
    phone: "+972 50 123 4567",
    company: "Marina Heights",
    property: {
      projectId: "prj-marina-b",
      projectName: "Marina Heights",
      buildingNumber: "B",
      entranceNumber: "2",
      floorNumber: "5",
      apartmentNumber: "12",
    },
  },
  {
    id: "u-tenant-2",
    email: "tenant2@ibys.dev",
    name: "Noa Levi",
    role: "TENANT",
    phone: "+972 52 765 4321",
    company: "Marina Heights",
    property: {
      projectId: "prj-marina-b",
      projectName: "Marina Heights",
      buildingNumber: "A",
      entranceNumber: "1",
      floorNumber: "8",
      apartmentNumber: "27",
    },
  },
  {
    id: "u-pm-1",
    email: "manager@ibys.dev",
    name: "Omar Manager",
    role: "PROJECT_MANAGER",
    phone: "+972 54 222 3344",
    company: "IBYS Projects",
  },
  {
    id: "u-bc-1",
    email: "company@ibys.dev",
    name: "BuildCo Ltd.",
    role: "BUILDING_COMPANY",
    phone: "+972 3 555 8899",
    company: "BuildCo Ltd.",
  },
];

// Per-user password store (mock). In real app this lives on the backend.
const PASSWORDS: Record<string, string> = Object.fromEntries(
  MOCK_USERS.map((u) => [u.id, DEFAULT_PASSWORD]),
);

export function listMockUsers(): MockUser[] {
  return MOCK_USERS;
}

function delay<T>(v: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(v), ms));
}

function toAuthUser(u: MockUser): AuthUser {
  return { ...u };
}

export async function mockLogin(payload: LoginPayload): Promise<AuthResponse> {
  const user = MOCK_USERS.find(
    (u) =>
      u.email.toLowerCase() === payload.identifier.toLowerCase() ||
      u.id === payload.identifier,
  );
  if (!user || PASSWORDS[user.id] !== payload.password) {
    const err = new Error("Invalid credentials");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return delay({
    token: `mock-token.${user.id}.${Date.now()}`,
    user: toAuthUser(user),
  });
}

export async function mockUpdateProfile(
  userId: string,
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) {
    const err = new Error("User not found");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }
  if (payload.name !== undefined) user.name = payload.name;
  if (payload.email !== undefined) user.email = payload.email;
  if (payload.phone !== undefined) user.phone = payload.phone;
  if (payload.avatarUrl !== undefined) user.avatarUrl = payload.avatarUrl;
  if (payload.company !== undefined) user.company = payload.company;
  return delay(toAuthUser(user));
}

export async function mockChangePassword(
  userId: string,
  payload: ChangePasswordPayload,
): Promise<void> {
  const current = PASSWORDS[userId];
  if (!current) {
    const err = new Error("User not found");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }
  if (payload.currentPassword !== current) {
    const err = new Error("Current password is incorrect");
    (err as Error & { status?: number }).status = 400;
    throw err;
  }
  PASSWORDS[userId] = payload.newPassword;
  return delay(undefined);
}
