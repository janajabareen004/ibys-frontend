/**
 * Supabase Storage helper for uploading project files from the browser.
 *
 * Security: this uses ONLY the public anon key (VITE_SUPABASE_ANON_KEY) plus the
 * signed-in user's access token (stored by AuthProvider). The service_role /
 * secret key is never referenced in the frontend. Uploads are therefore subject
 * to the bucket's Storage RLS policies, evaluated for the authenticated user.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  STORAGE_BUCKET,
  DOCUMENTS_STORAGE_BUCKET,
  AUTH_STORAGE_KEY,
} from "@/api/config";

/** True only when both the project URL and the public anon key are configured. */
export const isStorageConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** The access token persisted by AuthProvider (a Supabase auth JWT). */
function getAccessToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { token?: string }).token ?? null;
  } catch {
    return null;
  }
}

/**
 * A per-call client so the current user's token is attached as the Authorization
 * header (the anon key remains the apikey). This keeps Storage writes bound to
 * the authenticated user for RLS, without persisting a Supabase session.
 */
function storageClient(): SupabaseClient {
  const token = getAccessToken();
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });
}

/** Make a filesystem-safe object name segment. */
function sanitizeFileName(name: string, fallback: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

export type UploadedObject = { path: string; publicUrl: string };
/** @deprecated use UploadedObject */
export type UploadedImage = UploadedObject;

/**
 * Upload a File to `bucket` at `project-{projectId}/{timestamp}-{sanitizedName}`
 * and return the storage path plus its public URL. Throws on failure so callers
 * can avoid creating a database row for a file that never landed in storage.
 */
async function uploadToBucket(
  file: File,
  projectId: string,
  bucket: string,
  fallbackName: string,
): Promise<UploadedObject> {
  if (!isStorageConfigured) {
    throw new Error("Supabase Storage is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
  }
  const sb = storageClient();
  const path = `project-${projectId}/${Date.now()}-${sanitizeFileName(file.name, fallbackName)}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/** Best-effort removal of a previously uploaded object (used to avoid orphans). */
async function removeFromBucket(bucket: string, path: string): Promise<void> {
  if (!isStorageConfigured || !path) return;
  try {
    await storageClient().storage.from(bucket).remove([path]);
  } catch {
    // Best effort only — a failed cleanup must not mask the original error.
  }
}

/** Upload a project image to the `project-images` bucket. */
export function uploadProjectImage(file: File, projectId: string): Promise<UploadedObject> {
  return uploadToBucket(file, projectId, STORAGE_BUCKET, "photo");
}

/** Best-effort removal of a previously uploaded image object. */
export function removeProjectImage(path: string): Promise<void> {
  return removeFromBucket(STORAGE_BUCKET, path);
}

/** Upload a project document to the `project-documents` bucket. */
export function uploadProjectDocument(file: File, projectId: string): Promise<UploadedObject> {
  return uploadToBucket(file, projectId, DOCUMENTS_STORAGE_BUCKET, "document");
}

/** Best-effort removal of a previously uploaded document object. */
export function removeProjectDocument(path: string): Promise<void> {
  return removeFromBucket(DOCUMENTS_STORAGE_BUCKET, path);
}
