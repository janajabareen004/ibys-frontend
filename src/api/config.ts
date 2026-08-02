/**
 * Centralized API configuration.
 *
 * Environment variables (declared in .env / .env.local):
 *   VITE_API_BASE_URL   Base URL of the real REST API, e.g. http://localhost:8080/api
 *   VITE_USE_MOCK_API   "true" to use in-memory mocks (default in dev), "false" for real API
 *   VITE_API_TIMEOUT_MS Optional request timeout in milliseconds (default 15000)
 *
 * IMPORTANT: never hardcode backend URLs inside pages/components — always import from here.
 */

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

export const API_BASE_URL: string = env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export const USE_MOCK_API: boolean = (env.VITE_USE_MOCK_API ?? "true").toLowerCase() === "true";

export const API_TIMEOUT_MS: number = Number(env.VITE_API_TIMEOUT_MS ?? 15000);

export const AUTH_STORAGE_KEY = "ibys.auth";
