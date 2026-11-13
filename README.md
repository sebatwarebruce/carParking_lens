# ParkWise: Parking Management Frontend

Mobile-first React frontend for the Digital Parking Management SaaS Platform. It is built to run **independently** today (against an in-browser mock backend) and to connect to the future Node/Express REST API **without rebuilding the app**.

Stack: React 19, Vite 7, JavaScript (no TypeScript), Tailwind CSS 4, React Router 7, Axios, TanStack Query 5, React Hook Form + Zod, Motion (Framer Motion API), Lucide, Recharts, `qrcode.react`, `html5-qrcode`, `jspdf`, `vite-plugin-pwa`.

## Quick start

```bash
npm install
cp .env.example .env     # VITE_USE_MOCKS=true by default
npm run dev              # http://localhost:5173
npm test                 # 27 tests: contract, UI lifecycle, components, nav, formatting
npm run build            # env guard + production build + PWA service worker
```

Camera and PWA features need **HTTPS** (or `localhost`). Test on a phone through a tunnel or your staging domain.

### Demo accounts (mock mode only, password `demo1234`)

| Account | Role | Lands on |
|---|---|---|
| `attendant@parkwise.demo` | Attendant | `/home` (Entry / Exit) |
| `cashier@parkwise.demo` | Cashier | `/cashier` (payment queue) |
| `manager@parkwise.demo` | Manager | `/dashboard` |
| `owner@parkwise.demo` | Owner | `/dashboard` (+ pricing, staff, locations) |
| `admin@parkwise.demo` | Platform admin | `/platform` |
| `disabled@parkwise.demo` | Disabled account | shows the "account disabled" state |

Five wrong passwords trigger the rate-limited state. Seeded ticket `PKG-DEMO-000123` / plate `RAD 123 A` is parked and ready for a checkout demo. The floating flask button (bottom right) opens **Demo controls** to rehearse: API unreachable, slot conflict, photo upload failure, failed mobile money.

> Mock sign-in is **not** real authentication, and mock payments are **not** real transactions. A "Demo mode" banner is shown at all times.

## Connecting the real backend

1. `.env`: `VITE_USE_MOCKS=false`, `VITE_API_BASE_URL=https://api.example.com/api/v1`.
2. The backend must send CORS headers for the frontend origin with credentials, and set the httpOnly refresh cookie.
3. Run the **same contract test** against the backend: `VITE_USE_MOCKS=false VITE_API_BASE_URL=... npm run test:contract` (the suite installs the mock itself today; see "Pointing the contract test at a real API" in `docs/API_INTEGRATION_CONTRACTS.md`).
4. If a path differs, edit `src/services/endpoints.js`. If a field name differs, adjust the one service function. Components never change.
5. Delete `src/mocks/` when no longer wanted. Nothing outside `main.jsx`'s dynamic import references it.

All shapes, endpoints, error codes and open assumptions are in `docs/API_INTEGRATION_CONTRACTS.md` and `docs/OPEN_QUESTIONS.md`.

## How it is organised

See `docs/FRONTEND_FOLDER_STRUCTURE.md`. In short: `features/*` (one folder per module), `components/*` (shared UI), `services/*` (the only code that talks HTTP), `mocks/*` (the only fake business logic), `constants/*` (statuses, permissions, nav, copy).

## Trust rules the UI enforces

- The **server** sets entry/exit time, ticket numbers, fees, statuses and slot availability. The UI never calculates a fee or duration for billing.
- A payment is "confirmed" only when the server reports `SUCCESS`. Mobile money shows *pending* (and polls) until then; a second request is blocked while one is pending.
- Photos: "captured on this device" and "uploaded" are separate states; entry cannot be confirmed until the upload finished.
- Offline: banner + disabled actions. Nothing is shown as saved without server confirmation. API responses are never cached by the service worker.
- Permissions come from the server (`/me.permissions`); route guards are UX only.
- No secrets in `VITE_*` (the build fails if a variable name looks like one).

## Scripts

`dev`, `build`, `preview`, `test`, `test:watch`, `test:contract`, `lint`, `e2e` (Playwright, optional: `npm i -D @playwright/test && npx playwright install chromium`).

## Status and known limitations

Verified here: production build, ESLint (0 errors), 27 automated tests including full entry and checkout/cash flows driven through the UI against the mock API.
**Not verified here** (no browser or device was available in the build environment): visual appearance at real viewport sizes, real camera capture, QR scanning, PWA install, print/PDF layout, screen-reader behaviour, and Lighthouse scores. Run through `docs/IMPLEMENTATION_ROADMAP.md` > "Verification still required" on iPhone Safari and Android Chrome before relying on any of those.
Real social login, real mobile money and SMS/WhatsApp sending depend on backend work and open product decisions (`docs/OPEN_QUESTIONS.md`).
