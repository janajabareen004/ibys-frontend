import { API_BASE_URL, API_TIMEOUT_MS, AUTH_STORAGE_KEY } from "./config";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Centralized auth-failure handlers.
 *
 * Registered once by the AuthProvider so that 401/403 responses are handled in
 * a single place instead of being scattered across pages/components:
 *   - 401 -> clear auth storage + move the user to an unauthenticated state
 *            (the _authenticated route guard then redirects to /login).
 *   - 403 -> keep the session; surface a permission error only.
 */
type AuthFailureHandlers = {
  onUnauthorized?: () => void;
  onForbidden?: (error: ApiError) => void;
};

let authFailureHandlers: AuthFailureHandlers = {};

export function setAuthFailureHandlers(handlers: AuthFailureHandlers): void {
  authFailureHandlers = handlers;
}

function getToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, timeoutMs = API_TIMEOUT_MS, auth = true, headers, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && "message" in data && String((data as { message: unknown }).message)) ||
        `Request failed with status ${res.status}`;

      if (res.status === 401) {
        // Unauthorized — token missing/expired/invalid. Clear session centrally.
        const unauthorized = new ApiError("Unauthorized", 401, data);
        authFailureHandlers.onUnauthorized?.();
        throw unauthorized;
      }

      if (res.status === 403) {
        // Forbidden — authenticated but lacks permission. Do NOT log out.
        const forbidden = new ApiError(message, 403, data);
        authFailureHandlers.onForbidden?.(forbidden);
        throw forbidden;
      }

      throw new ApiError(message, res.status, data);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError("Request timed out", 0);
    }
    throw new ApiError("Network error", 0, err);
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
