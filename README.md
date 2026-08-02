# IBYS – I Build You See

**Phase 1 frontend foundation.**
IBYS is a construction-project tracking and communication platform for tenants,
project managers, and building companies. This repo contains only the
foundation: design system, i18n, mock auth, role-based routing shell, and
reusable components. Domain features (real dashboards, timelines, meetings,
uploads, etc.) will be added in later phases and must not require rewriting
this foundation.

## Tech stack

- React 19 + TypeScript
- TanStack Start (Vite 7) — file-based routing under `src/routes/`
- TanStack Query
- Tailwind CSS v4 + shadcn/ui components
- Sonner for toasts, lucide-react for icons

> The task brief asked for plain JavaScript. The Lovable template on which this
> project runs requires TypeScript + TanStack Start; the architecture, file
> layout, and every Phase 1 goal are otherwise implemented exactly as
> specified. TypeScript types are kept light — refactoring to `.jsx` later is
> mechanical.

## Folder structure

```
src/
├── api/                    Centralized API layer
│   ├── apiClient.ts        fetch wrapper: base URL, auth, timeouts, errors
│   ├── authApi.ts          login / logout — switches mock ↔ real via config
│   └── config.ts           reads VITE_* env vars, no URLs elsewhere
├── mocks/
│   └── mockAuthService.ts  in-memory demo users (TENANT / PM / BUILDING_COMPANY)
├── context/
│   └── AuthProvider.tsx    session state + role helpers, localStorage persistence
├── lib/i18n/               EN / AR / HE dictionaries + <I18nProvider>
│   ├── I18nProvider.tsx
│   └── locales/{en,ar,he}.ts
├── components/
│   ├── common/             LanguageSwitcher, PageHeader, RoleGuard, ...
│   ├── feedback/           LoadingState, EmptyState, ErrorState, SuccessNotification
│   ├── forms/              FormField, PasswordInput
│   ├── layout/             AppShell, AppSidebar, AppHeader, navConfig
│   └── ui/                 shadcn primitives (button, input, sidebar, ...)
├── routes/                 TanStack file-based routes
│   ├── __root.tsx          Providers, head metadata, error/404 boundaries
│   ├── index.tsx           Redirects to role dashboard or /login
│   ├── login.tsx           Login page (mock auth)
│   ├── unauthorized.tsx
│   └── _authenticated/     Protected shell + role dashboards (placeholders)
│       ├── tenant.dashboard.tsx
│       ├── manager.dashboard.tsx
│       └── company.dashboard.tsx
└── styles.css              Design tokens (oklch), fonts, focus styles
```

## Running the project

```bash
bun install
bun run dev
```

The dev server serves the app at `http://localhost:8080`.

## Environment variables

Create a `.env.local` at the repo root:

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK_API=true
VITE_API_TIMEOUT_MS=15000
```

All three are read from `src/api/config.ts`. **Never hardcode a backend URL
inside a page or component** — always import from there.

## Switching between mock and real API

- `VITE_USE_MOCK_API=true` → `authApi` and future services call the in-memory
  mocks under `src/mocks/`.
- `VITE_USE_MOCK_API=false` → the same functions call the real REST API at
  `VITE_API_BASE_URL` via `apiClient` (fetch wrapper with Bearer token,
  JSON handling, timeouts, and user-friendly error messages).

To add a new endpoint later:

1. Add a typed function in `src/api/<domain>Api.ts` that branches on
   `USE_MOCK_API`.
2. Add the mock implementation in `src/mocks/<domain>MockService.ts`.
3. Call the api function from components / TanStack Query — never call `fetch`
   directly and never reference a URL string outside `src/api/`.

## Multilingual system (EN / AR / HE)

- Dictionaries live in `src/lib/i18n/locales/{en,ar,he}.ts`. The English file
  is the shape source of truth (`Dictionary` type); the other locales must
  match.
- `<I18nProvider>` (in `__root.tsx`) provides `useI18n()` → `{ t, lang, dir,
  setLang, formatDate, formatNumber }`.
- The selected language is persisted to `localStorage` under the key
  `ibys.lang`.
- On every change, `<html lang>` and `<html dir>` are updated dynamically.
- All visible text comes from dictionaries — never hardcode strings in
  components. Use `t("path.to.key")` (with optional `{name}`-style variables).

## RTL / LTR handling

- Arabic and Hebrew are declared as `dir: "rtl"` in their locale meta. English
  is `"ltr"`.
- The layout uses **CSS logical properties** (`ms-*`, `me-*`, `ps-*`, `pe-*`,
  `start-*`, `end-*`, `text-start`, `text-end`) so alignment, padding and
  spacing flip automatically.
- `AppSidebar` sets `side={dir === "rtl" ? "right" : "left"}` so the sidebar
  moves to the correct side.
- Use `dir="auto"` on inputs / user-generated content when needed.
- Dates and numbers are formatted with `Intl.DateTimeFormat` /
  `Intl.NumberFormat` using the active locale.

## Role-based routing

Three roles are defined in `src/api/authApi.ts`:

| Role                | Post-login destination |
| ------------------- | ---------------------- |
| `TENANT`            | `/tenant/dashboard`    |
| `PROJECT_MANAGER`   | `/manager/dashboard`   |
| `BUILDING_COMPANY`  | `/company/dashboard`   |

- Every protected page lives under `src/routes/_authenticated/`. The layout
  redirects unauthenticated users to `/login` and preserves the intended
  destination.
- Individual pages wrap themselves in `<RoleGuard allow="…">` and redirect to
  `/unauthorized` if the role doesn't match.
- **SECURITY:** these are UI guards only. The backend MUST enforce
  authentication and role-based authorization on every endpoint. Never rely
  on the frontend for access control.

## Mock demo accounts

Password for all demo accounts: **`demo1234`**

| Email               | Role               |
| ------------------- | ------------------ |
| `tenant@ibys.dev`   | `TENANT`           |
| `manager@ibys.dev`  | `PROJECT_MANAGER`  |
| `company@ibys.dev`  | `BUILDING_COMPANY` |

These are visible on the login page for convenience during Phase 1 and should
be removed before production.

## Future backend integration

When the external REST API is ready:

1. Set `VITE_API_BASE_URL` to the deployed API URL and `VITE_USE_MOCK_API=false`.
2. Ensure the API returns `{ token, user: { id, email, name, role } }` from
   `POST /auth/login`, matching the `AuthResponse` type in `src/api/authApi.ts`.
   Adjust the type + mapping if the real API uses different field names.
3. Add domain services (`projectsApi.ts`, `meetingsApi.ts`, …) following the
   same pattern as `authApi`.
4. Wire them into TanStack Query hooks under `src/hooks/` — do not fetch
   directly from components.

## Design system

Colors, spacing, radius, typography and shadows are defined as CSS custom
properties in `src/styles.css` (oklch). Palette:

- **Primary:** Deep Navy
- **Accent:** Muted gold
- **Success / Warning / Destructive** for state
- **Neutral warm background** for a clean, trustworthy feel

Do not use hex color utilities in components — always use semantic tokens
(`bg-primary`, `text-muted-foreground`, `border-border`, …).

## Accessibility baseline

- Semantic HTML, visible labels, keyboard navigation.
- Visible focus ring (`:focus-visible` in `styles.css`).
- Password toggle, language switcher, and menu triggers all expose accessible
  names.
- Loading, empty, and error states use `role="status"` / `role="alert"`
  appropriately.
- Do not rely on color alone to convey state.

## Do NOT (Phase 1 boundaries)

- Do not build the full tenant / project manager / building company
  experiences yet.
- Do not add Supabase, Firebase, or any direct database access.
- Do not hardcode API URLs or visible text inside pages/components.
- Do not rewrite the foundation in later phases — extend it.
