/**
 * User preference storage (Phase 1 mock layer).
 * Persists notification preferences and theme locally per browser.
 * Replace with backend integration when the API is ready.
 */
import * as React from "react";

export type ThemePreference = "system" | "light" | "dark";

export type UserSettings = {
  emailNotifications: boolean;
  meetingReminders: boolean;
  projectUpdates: boolean;
  theme: ThemePreference;
};

const STORAGE_PREFIX = "ibys.settings.";

const DEFAULTS: UserSettings = {
  emailNotifications: true,
  meetingReminders: true,
  projectUpdates: true,
  theme: "light",
};

function keyFor(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadSettings(userId: string): UserSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(userId: string, settings: UserSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function useUserSettings(userId: string | undefined) {
  const [settings, setSettings] = React.useState<UserSettings>(DEFAULTS);

  React.useEffect(() => {
    if (!userId) return;
    setSettings(loadSettings(userId));
  }, [userId]);

  const update = React.useCallback(
    (patch: Partial<UserSettings>) => {
      if (!userId) return;
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(userId, next);
        return next;
      });
    },
    [userId],
  );

  return { settings, update };
}

export function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}
