import * as React from "react";
import en, { type Dictionary } from "./locales/en";
import ar from "./locales/ar";
import he from "./locales/he";

export type LangCode = "en" | "ar" | "he";
export type Direction = "ltr" | "rtl";

const DICTIONARIES: Record<LangCode, Dictionary> = { en, ar, he };
export const LANGUAGES: Array<{ code: LangCode; name: string; dir: Direction }> = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "he", name: "עברית", dir: "rtl" },
];

const STORAGE_KEY = "ibys.lang";

type Ctx = {
  lang: LangCode;
  dir: Direction;
  dict: Dictionary;
  setLang: (l: LangCode) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  formatDate: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (n: number, opts?: Intl.NumberFormatOptions) => string;
};

const I18nContext = React.createContext<Ctx | null>(null);

function resolve(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<LangCode>("en");

  // Read persisted language after mount to avoid SSR/hydration mismatch.
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as LangCode | null;
      if (saved && DICTIONARIES[saved]) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const dict = DICTIONARIES[lang];
  const dir: Direction = dict.meta.dir;

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = React.useCallback((l: LangCode) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = React.useCallback<Ctx["t"]>(
    (path, vars) => {
      const v = resolve(dict, path);
      if (typeof v === "string") return interpolate(v, vars);
      // fall back to English
      const fb = resolve(en, path);
      return typeof fb === "string" ? interpolate(fb, vars) : path;
    },
    [dict],
  );

  const formatDate = React.useCallback<Ctx["formatDate"]>(
    (d, opts) =>
      new Intl.DateTimeFormat(lang, opts ?? { dateStyle: "medium" }).format(new Date(d)),
    [lang],
  );

  const formatNumber = React.useCallback<Ctx["formatNumber"]>(
    (n, opts) => new Intl.NumberFormat(lang, opts).format(n),
    [lang],
  );

  const value = React.useMemo<Ctx>(
    () => ({ lang, dir, dict, setLang, t, formatDate, formatNumber }),
    [lang, dir, dict, setLang, t, formatDate, formatNumber],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const FALLBACK_CTX: Ctx = {
  lang: "en",
  dir: "ltr",
  dict: en,
  setLang: () => {},
  t: (path, vars) => {
    const v = resolve(en, path);
    return typeof v === "string" ? interpolate(v, vars) : path;
  },
  formatDate: (d, opts) =>
    new Intl.DateTimeFormat("en", opts ?? { dateStyle: "medium" }).format(new Date(d)),
  formatNumber: (n, opts) => new Intl.NumberFormat("en", opts).format(n),
};

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  return ctx ?? FALLBACK_CTX;
}

export const useTranslation = useI18n;
