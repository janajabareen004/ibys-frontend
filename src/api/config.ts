/**
 * Centralized API configuration.
 *
 * Environment variables (declared in .env / .env.local):
 *   VITE_API_BASE_URL       Base URL of the real REST API, e.g. http://localhost:8080/api
 *   VITE_USE_MOCK_API       "true" to use in-memory mocks (default in dev), "false" for real API
 *   VITE_API_TIMEOUT_MS     Optional request timeout in milliseconds (default 15000)
 *   VITE_SUPABASE_URL       Supabase project URL (public) — used for Storage uploads
 *   VITE_SUPABASE_ANON_KEY  Supabase anon/public key — NEVER the service_role/secret key
 *
 * IMPORTANT: never hardcode backend URLs inside pages/components — always import from here.
 * Only the PUBLIC anon key belongs in the frontend; the service_role key must stay server-side.
 */

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

export const API_BASE_URL: string = env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export const USE_MOCK_API: boolean = (env.VITE_USE_MOCK_API ?? "true").toLowerCase() === "true";

export const API_TIMEOUT_MS: number = Number(env.VITE_API_TIMEOUT_MS ?? 15000);

export const AUTH_STORAGE_KEY = "ibys.auth";

// Supabase Storage (image uploads). URL is public; only the anon key is used here.
export const SUPABASE_URL: string = env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY ?? "";
export const STORAGE_BUCKET = "project-images";
// Dedicated bucket for manager/tenant documents (matches the file_url of existing
// backend document rows: .../storage/v1/object/public/project-documents/...).
export const DOCUMENTS_STORAGE_BUCKET = "project-documents";
