import * as React from "react";
import { AUTH_STORAGE_KEY } from "../api/config";
import { setAuthFailureHandlers } from "../api/apiClient";
import { notifyError } from "@/components/feedback/SuccessNotification";
import {
  authApi,
  normalizeRole,
  type AuthUser,
  type ChangePasswordPayload,
  type LoginPayload,
  type MeResponse,
  type RegisterRequest,
  type Role,
  type UpdateProfilePayload,
} from "../api/authApi";

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  token: string | null;
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role | Role[]) => boolean;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * Persisted session shape (stored under the existing `ibys.auth` key).
 *
 * `token` intentionally holds the access token so that `apiClient` (which reads
 * `parsed.token`) keeps attaching `Authorization: Bearer <access_token>`
 * without any change on its side.
 */
type PersistedSession = {
  token: string; // access_token
  refreshToken: string;
  userId: string;
  role: Role;
  user: AuthUser;
  profile: Record<string, unknown> | null;
};

function readPersistedSession(): PersistedSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (parsed && parsed.token && parsed.user) return parsed as PersistedSession;
    return null;
  } catch {
    return null;
  }
}

function persistSession(session: PersistedSession) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function clearPersistedSession() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// --- profile -> AuthUser mapping ------------------------------------------
// The backend `profile` object shape is not strictly specified, so we extract
// common fields defensively (supporting both snake_case and camelCase keys).

function pickString(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return undefined;
}

function buildTenantProperty(
  profile: Record<string, unknown> | null,
): AuthUser["property"] {
  if (!profile) return undefined;
  const nested =
    profile.property && typeof profile.property === "object"
      ? (profile.property as Record<string, unknown>)
      : null;
  const source = nested ?? profile;

  const buildingNumber = pickString(source, ["building_number", "buildingNumber", "building"]);
  const apartmentNumber = pickString(source, ["apartment_number", "apartmentNumber", "apartment"]);

  // Only expose a property block if we actually have identifying unit info.
  if (!buildingNumber && !apartmentNumber) return undefined;

  return {
    projectId: pickString(source, ["project_id", "projectId"]) ?? "",
    projectName: pickString(source, ["project_name", "projectName"]) ?? "",
    buildingNumber: buildingNumber ?? "",
    entranceNumber: pickString(source, ["entrance_number", "entranceNumber", "entrance"]) ?? "",
    floorNumber: pickString(source, ["floor_number", "floorNumber", "floor"]) ?? "",
    apartmentNumber: apartmentNumber ?? "",
  };
}

function buildUser(
  userId: string,
  role: Role,
  profile: Record<string, unknown> | null,
): AuthUser {
  return {
    id: userId,
    role,
    name: pickString(profile, ["full_name", "fullName", "name", "display_name", "displayName"]) ?? "",
    email: pickString(profile, ["email"]) ?? "",
    phone: pickString(profile, ["phone", "phone_number", "phoneNumber"]),
    avatarUrl: pickString(profile, ["avatar_url", "avatarUrl", "avatar"]),
    company: pickString(profile, ["company", "company_name", "companyName"]),
    property: role === "TENANT" ? buildTenantProperty(profile) : undefined,
  };
}

function sessionFromMe(
  me: MeResponse,
  tokens: { token: string; refreshToken: string },
): PersistedSession {
  const userId = me.user?.user_id ?? "";
  const role = normalizeRole(me.role ?? me.user?.role);
  const profile = me.profile ?? null;
  return {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    userId,
    role,
    user: buildUser(userId, role, profile),
    profile,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    status: "loading",
    user: null,
    token: null,
  });

  const setUnauthenticated = React.useCallback(() => {
    clearPersistedSession();
    setState({ status: "unauthenticated", user: null, token: null });
  }, []);

  // Register centralized 401/403 handling once. On 401 the session is cleared
  // and status flips to unauthenticated; the `_authenticated` route guard then
  // redirects to /login. On 403 we keep the session and show a permission error.
  React.useEffect(() => {
    setAuthFailureHandlers({
      onUnauthorized: () => {
        setUnauthenticated();
      },
      onForbidden: (error) => {
        notifyError(error.message || "You do not have permission to perform this action.");
      },
    });
    return () => setAuthFailureHandlers({});
  }, [setUnauthenticated]);

  // On mount, validate the stored access token against GET /auth/me.
  // Never trust localStorage alone.
  React.useEffect(() => {
    let alive = true;
    const persisted = readPersistedSession();

    if (!persisted) {
      setState({ status: "unauthenticated", user: null, token: null });
      return;
    }

    authApi
      .me()
      .then((me) => {
        if (!alive) return;
        const session = sessionFromMe(me, {
          token: persisted.token,
          refreshToken: persisted.refreshToken,
        });
        persistSession(session);
        setState({ status: "authenticated", user: session.user, token: session.token });
      })
      .catch((err) => {
        if (!alive) return;
        const status = (err as { status?: number }).status;
        if (status === 401) {
          // Handled centrally by onUnauthorized as well; ensure state is clean.
          setUnauthenticated();
          return;
        }
        // Transient/network error (not an auth rejection): fall back to the
        // persisted session rather than logging the user out unexpectedly.
        setState({ status: "authenticated", user: persisted.user, token: persisted.token });
      });

    return () => {
      alive = false;
    };
  }, [setUnauthenticated]);

  const login = React.useCallback<AuthContextValue["login"]>(async (payload) => {
    // Map the UI's "identifier" field to the backend's "email" field.
    const res = await authApi.login({
      email: payload.identifier.trim(),
      password: payload.password,
    });

    const tokens = { token: res.access_token, refreshToken: res.refresh_token };
    const role = normalizeRole(res.role);

    // Persist tokens immediately so the follow-up /auth/me call is authorized.
    let session: PersistedSession = {
      ...tokens,
      userId: res.user_id,
      role,
      user: buildUser(res.user_id, role, null),
      profile: null,
    };
    persistSession(session);

    // Hydrate the full user/profile from /auth/me. If it fails for a
    // non-auth reason, keep the minimal user built from the login response.
    try {
      const me = await authApi.me();
      session = sessionFromMe(me, tokens);
      persistSession(session);
    } catch (err) {
      if ((err as { status?: number }).status === 401) throw err;
      /* keep minimal session */
    }

    setState({ status: "authenticated", user: session.user, token: session.token });
    return session.user;
  }, []);

  const register = React.useCallback<AuthContextValue["register"]>(async (payload) => {
    // Registration does not return tokens; the caller redirects to /login.
    await authApi.register(payload);
  }, []);

  const logout = React.useCallback<AuthContextValue["logout"]>(async () => {
    try {
      // Ask the backend to invalidate the token (Bearer attached by apiClient).
      await authApi.logout();
    } catch {
      /* ignore backend logout errors — we still clear locally below */
    } finally {
      setUnauthenticated();
    }
  }, [setUnauthenticated]);

  const updateProfile = React.useCallback<AuthContextValue["updateProfile"]>(
    async (payload) => {
      const current = state.user;
      if (!current) throw new Error("Not authenticated");
      const updated = await authApi.updateProfile(current.id, payload);
      setState((prev) => {
        const persisted = readPersistedSession();
        if (persisted) persistSession({ ...persisted, user: updated });
        return { ...prev, user: updated };
      });
      return updated;
    },
    [state.user],
  );

  const changePassword = React.useCallback<AuthContextValue["changePassword"]>(
    async (payload) => {
      const current = state.user;
      if (!current) throw new Error("Not authenticated");
      await authApi.changePassword(current.id, payload);
    },
    [state.user],
  );

  const hasRole = React.useCallback<AuthContextValue["hasRole"]>(
    (role) => {
      if (!state.user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(state.user.role);
    },
    [state.user],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout, hasRole, updateProfile, changePassword }),
    [state, login, register, logout, hasRole, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "TENANT":
      return "/tenant/dashboard";
    case "PROJECT_MANAGER":
      return "/manager/dashboard";
    case "BUILDING_COMPANY":
      return "/company/dashboard";
  }
}
