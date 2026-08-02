import { apiClient } from "./apiClient";

/**
 * Auth API — wired to the real IBYS backend.
 *
 *   POST /auth/login     -> { access_token, refresh_token, user_id, role }
 *   GET  /auth/me        -> { user, role, profile }
 *   POST /auth/logout    -> { message }
 *   POST /auth/register  -> (no tokens; redirect to login afterwards)
 *
 * The base URL (which already includes `/api`) comes from VITE_API_BASE_URL,
 * so the effective URLs are e.g. https://ibys-backend.onrender.com/api/auth/login.
 */

/** Frontend canonical roles used across routing, navigation and guards. */
export type Role = "TENANT" | "PROJECT_MANAGER" | "BUILDING_COMPANY";

/** Roles as the backend represents them (note: MANAGER, not PROJECT_MANAGER). */
export type BackendRole = "TENANT" | "MANAGER" | "BUILDING_COMPANY";

/**
 * Centralized role mapping.
 *
 * The backend returns `MANAGER` while the entire frontend (routes, navConfig,
 * RoleGuard, dashboardPathForRole, i18n keys) expects `PROJECT_MANAGER`. This
 * is the ONLY place that translates between the two vocabularies — do not add
 * ad-hoc role mappings in components.
 */
export function normalizeRole(role: string | null | undefined): Role {
  switch (role) {
    case "MANAGER":
    case "PROJECT_MANAGER":
      return "PROJECT_MANAGER";
    case "BUILDING_COMPANY":
      return "BUILDING_COMPANY";
    case "TENANT":
      return "TENANT";
    default:
      // Unknown/unexpected role: default to the least-privileged role.
      return "TENANT";
  }
}

/** Inverse mapping, used when sending a role to the backend (e.g. register). */
export function toBackendRole(role: Role): BackendRole {
  return role === "PROJECT_MANAGER" ? "MANAGER" : role;
}

export type TenantProperty = {
  projectId: string;
  projectName: string;
  buildingNumber: string;
  entranceNumber: string;
  floorNumber: string;
  apartmentNumber: string;
};

/** Shape consumed by the UI (sidebar, profile, tenant dashboard, etc.). */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  company?: string;
  property?: TenantProperty;
};

/** Public login payload used by the login page / AuthProvider (identifier-based). */
export type LoginPayload = {
  identifier: string;
  password: string;
  remember?: boolean;
};

/** Legacy mock response shape — retained so the mock service still type-checks. */
export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  company?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

// ---------------------------------------------------------------------------
// Real backend request/response contracts
// ---------------------------------------------------------------------------

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: string;
};

export type MeResponse = {
  user: {
    user_id: string;
    role: string;
  };
  role: string;
  profile: Record<string, unknown> | null;
};

export type LogoutResponse = {
  message: string;
};

/**
 * Register payload. `role` is a backend role; the `name` field is role-specific
 * (the caller supplies the appropriate key, plus optional phone).
 */
export type RegisterRequest = {
  email: string;
  password: string;
  role: BackendRole;
  phone?: string;
} & Record<string, unknown>;

export const authApi = {
  login(body: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/login", body, { auth: false });
  },

  me(): Promise<MeResponse> {
    return apiClient.get<MeResponse>("/auth/me");
  },

  logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>("/auth/logout");
  },

  register(body: RegisterRequest): Promise<unknown> {
    return apiClient.post<unknown>("/auth/register", body, { auth: false });
  },

  // --- Profile operations (not part of the auth task) --------------------
  // Retained so the existing profile page compiles. These are NOT wired to a
  // verified backend contract yet and are out of scope for this integration.
  updateProfile(userId: string, payload: UpdateProfilePayload): Promise<AuthUser> {
    return apiClient.patch<AuthUser>(`/users/${userId}`, payload);
  },

  changePassword(userId: string, payload: ChangePasswordPayload): Promise<void> {
    return apiClient.post<void>(`/users/${userId}/change-password`, payload);
  },
};
