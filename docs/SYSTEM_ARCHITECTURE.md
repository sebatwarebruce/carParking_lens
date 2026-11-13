# SYSTEM_ARCHITECTURE

## 1. Decisions at a glance

| Decision | Choice | Why |
|---|---|---|
| Mock strategy | **Mock at the Axios adapter level**, not in services | Services/hooks/UI contain only real HTTP code. Flipping `VITE_USE_MOCKS=false` removes the mock server entirely. No UI rewrite at integration. |
| Mock isolation | `src/mocks/` is dynamically imported only when `VITE_USE_MOCKS=true` | Keeps mocks out of production bundles. |
| Server state | TanStack Query | Caching, polling (slots, payment status), retry, invalidation |
| Client state | React Context: Auth, Lot (selected lot), Network, Theme, Toast | Small and non-authoritative; nothing financial is stored client-side |
| Authority | Backend only | Timestamps, fees, status, permissions, slot availability |
| Permissions | UI reads `permissions[]` from `GET /me` | Backend decides; frontend has a default role map used only by the mock server |
| Styling | Tailwind v4 + semantic CSS variables (dark default, cream theme) | One token source for both themes |
| Motion | `motion` (Framer Motion API) + local Motion-Primitives-style components (`AnimatedBackground`, `Disclosure`, `TextMorph`-style counters) | No extra animation dependency; reduced-motion respected globally |
| Forms | React Hook Form + Zod | Schemas in `src/schemas`, reused for client validation only |
| QR | `qrcode.react` (render), `html5-qrcode` (scan, lazy-loaded) | Small, maintained |
| PDF / print | `jspdf` for receipt PDF; browser print with print stylesheet | No server needed |
| Photos | `browser-image-compression` before upload, `XHR/Axios onUploadProgress` | Compress, preview, real progress |
| PWA | `vite-plugin-pwa` (generateSW), `NetworkOnly` for `/api` | Shell/static caching only; never cache API data |
| Language | JavaScript (ES2022), no TypeScript | MP requirement. Shapes are documented as JSDoc typedefs in `docs/API_INTEGRATION_CONTRACTS.md` (a `src/types/contracts.js` file was not created) |

## 2. Layered architecture

```
UI (pages, features/*/components, components/ui)
        |  uses
Hooks (features/*/hooks: useActiveSessions, useCheckout ...)  <- TanStack Query
        |  calls
Services (services/*.js: pure functions -> axios)            <- the contract surface
        |  through
API client (services/api.js: baseURL, auth header, refresh, error normalisation)
        |  [if VITE_USE_MOCKS]
Mock adapter (mocks/server.js -> handlers -> in-memory db)   <- replaceable by the real backend
```

Rules:
1. Components never import `axios` or `mocks/`.
2. Services never import React.
3. Hooks own query keys, cache policy, invalidation. Pages compose hooks and components.
4. Business constants (statuses, labels, permission keys) live in `constants/` and are shared.
5. No pricing, no duration billing, no payment outcome logic anywhere in `src/` outside `src/mocks/`.

## 3. Application bootstrap

`main.jsx` -> `bootstrap()` (async: installs mock adapter if enabled) -> `<AppProviders><App/></AppProviders>`.

Provider order (outer to inner): `ErrorBoundary` -> `ThemeProvider` -> `QueryClientProvider` -> `NetworkProvider` -> `ToastProvider` -> `AuthProvider` -> `LotProvider` -> `RouterProvider`.

## 4. Routing and guards

- `createBrowserRouter`, all feature pages `React.lazy` via route `lazy`.
- `RequireAuth`: shows splash while `/me` loads; redirects to `/login?next=` when unauthenticated.
- `RequirePermission permission="..."`: renders `<ForbiddenState/>` (never a blank page). Navigation items are filtered by the same `can()`.
- `RoleHome`: `/` redirects by role: SUPER_ADMIN -> `/platform`, OWNER/MANAGER -> `/dashboard`, ATTENDANT -> `/home`, CASHIER -> `/cashier`.
- Layouts: `AppShell` (mobile neumorphic dock + sheet, tablet rail, desktop sidebar; navigation is filtered per role, so super admin gets a platform-only menu from the same shell) and `AuthLayout`. A separate `PlatformShell` was judged unnecessary duplication; `PublicLayout` is not built because no public screens exist yet (Q-09).
- Guards are UX. Every API call still fails with 403 if the server disagrees, and the UI handles that (`ForbiddenState` + toast).

## 5. Server-state conventions (TanStack Query)

Query keys are produced by factories in each feature (`sessionKeys.active(lotId)`), never inline strings.

| Data | staleTime | refetch | gcTime | Notes |
|---|---|---|---|---|
| `me` | 5 min | on focus | default | |
| slots | 5 s | 15 s interval while visible | 1 min | live grid |
| active sessions | 5 s | 20 s | 1 min | |
| session detail / checkout | 0 | on mount | 30 s | financial; never trusted stale |
| payment status | 0 | **2.5 s while PENDING**, then stops | 30 s | stops on terminal |
| receipts, history | 30 s | none | 5 min | paginated, `placeholderData: keepPreviousData` |
| reports | 60 s | none | 5 min | |
| pricing, staff, lots | 60 s | none | 5 min | invalidated on mutation |

On logout or 401 -> `queryClient.clear()` so no data leaks between users on shared phones.

## 6. Mutation safety

- `useGuardedMutation` wraps mutations: blocks re-entrancy (double tap), exposes `isSubmitting`, converts errors to `AppError` with user-facing `message` + `action`.
- Money-moving mutations send an `Idempotency-Key` (UUID generated once per payment *intent* and kept in component state until the intent finishes or is explicitly restarted).
- On network failure the mutation result is **UNKNOWN**: UI shows "Connection lost. This action has not been confirmed as saved." and offers *Check status* (re-fetch) before *Retry*. Retrying a payment re-uses the same key.
- No optimistic updates for entry, checkout, payments, completion.

## 7. Error handling pipeline

`axios error` -> `normalizeError()` -> `AppError { code, message, status, details, requestId, retryable, kind }` where `kind` is one of `network | auth | forbidden | validation | conflict | notFound | rateLimited | server | upload`.

| Where | Behaviour |
|---|---|
| Interceptor | 401 once -> try `/auth/refresh`; failure -> `SESSION_EXPIRED` -> clear cache, redirect `/login?reason=expired` |
| Forms | `validation` details mapped onto fields via `setError` |
| Pages | `<QueryState/>` renders skeleton / empty / error (with Retry) / offline for any query |
| Mutations | `toast` for non-blocking, inline `<Alert>` for blocking flows (payment, entry) |
| Render errors | `ErrorBoundary` per route with reset |

## 8. Photo pipeline

`CameraCapture` (state machine): `idle -> requesting -> live | fallback -> captured -> compressing -> uploading(progress) -> uploaded | failed`.

- Primary: `getUserMedia({video:{facingMode:{ideal:'environment'}}})` in an in-app viewfinder (UX 7.5).
- Fallback: `<input type="file" accept="image/*" capture="environment">` when permission denied/unavailable/insecure context (BP 11.2).
- Validates type (jpeg/png/webp/heic), max size (default 10 MB pre-compression), compresses to ~1600 px / ~0.5 MB, shows local preview, **"Captured on this device" vs "Uploaded"** badges are separate states.
- The entry/exit forms keep their field state in the parent; retaking never resets the form.
- Upload returns `{ key, url, ... }`; only `key/url` returned by the server is sent in the entry request.

## 9. Offline / PWA

- Workbox `generateSW`: precache app shell + static assets; `navigateFallback` to `index.html`; runtime rule: all `/api/*` = `NetworkOnly`.
- `useNetworkStatus` (navigator.onLine + failed-request heuristic) -> `OfflineBanner` ("You are offline. Entries, exits and payments are paused until you reconnect.").
- Actions requiring authority disable with an explanation when offline.
- Draft recovery: entry form *text fields only* in `sessionStorage` (cleared on submit success/logout), with "Restore draft?" prompt. Never photos, never payments, never tokens.
- Update flow: `registerType: 'prompt'` with an "Update available" toast.

## 10. Security posture (frontend)

- No secrets in `VITE_*` (README + a build-time check script `scripts/check-env.mjs` fails the build if a var name contains `SECRET|KEY|TOKEN|PASSWORD`).
- Access token in memory only; refresh via httpOnly cookie handled by the backend (`withCredentials: true`).
- Photos: fetched through the authenticated API client as blobs -> `URL.createObjectURL`; no public URLs rendered; no download button.
- Phone masking (`078****123`) in lists; full number only in permitted detail views.
- Confirmation + reason dialogs for: cancel session, manual completion, void payment, cash confirmation (shows amount), slot out-of-service, staff deactivation, pricing publish.
- Error messages are mapped from server `code`, never rendered raw from the server string if not whitelisted.
- No `dangerouslySetInnerHTML`.

## 11. Visual / interaction architecture

See UI_UX_DESIGN_SYSTEM.md. Highlights: semantic tokens, two themes, neumorphic mobile dock (`MobileDock`), subtle active indicators via a shared `layoutId` pill, Lucide icon registry (`constants/icons.js`) so each concept has exactly one icon.

## 12. Testing architecture

- Theme choice is stored in `localStorage` (`pw-theme`) as a UI preference only. Nothing business-related uses localStorage.
- Unit/component: Vitest + React Testing Library + jsdom; tests run against the **mock adapter**, which doubles as contract tests for the service layer.
- E2E: Playwright spec authored in `e2e/` (390x844), **not yet executed**. The Vitest suite drives the real pages through the mock API (`lifecycle.ui.test.jsx`).
- `src/services/__tests__/contract.test.js` asserts mock responses against the shapes in `types/contracts.js`; the same suite can be pointed at a real staging API via `VITE_USE_MOCKS=false VITE_API_BASE_URL=...` to validate the backend.
