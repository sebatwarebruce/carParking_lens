# IMPLEMENTATION_ROADMAP

Mirrors MP section 15, ordered so the P0 lifecycle is demoable early. Each phase ends with a verifiable exit criterion.

| Phase | Scope | Exit criterion | Status |
|---|---|---|---|
| 1 Requirements & architecture | 9 docs in `docs/` | Reviewed, open questions listed | Done (awaiting your review) |
| 2 Design foundation | Tokens, two themes, fonts, UI primitives, motion helpers, layouts, navigation, feedback components | Renders correctly at 360 px and 1280 px | Built; **visual check pending** |
| 3 Auth + role-aware structure | Env config, Axios client, error normalisation, mock server, AuthContext, guards, login (social-first), role dashboards | All 5 demo roles log in and see different nav/dashboards | Built; nav logic unit-tested |
| 4 Core operations | Slots, vehicles, entry wizard + camera, active sessions, exit lookup + QR, checkout | Entry -> exit checkout through the UI | Built; entry + checkout driven by an automated UI test |
| 5 Payments & receipts | Cash, mobile money pending/success/failed, cashier queue, receipts, print/PDF/share | Pending never shown as paid | Built; pending/failed/permission rules unit-tested; **print/PDF layout not visually checked** |
| 6 Management | Pricing, staff, reports + CSV, audit, settings, notifications, organizations, history, locations | Every nav route resolves to a real page | Built |
| 7 PWA & optimisation | Manifest, icons, Workbox (API NetworkOnly), offline banner, draft recovery, code-splitting | Installable; offline banner works | Configured; **needs device verification** |
| 8 Testing & integration readiness | Vitest unit/component/contract/UI, README, integration switch | `npm test` and `npm run build` green | Done (27 tests); Playwright spec authored, **not run** |

## Verification still required (needs a real browser/device)
1. Visual pass at 360, 390, 768, 1280 px in dark and cream themes (contrast, spacing, neumorphic dock, Lens motif).
2. Real camera capture and QR scan on iPhone Safari and Android Chrome (HTTPS).
3. PWA install + offline behaviour; confirm API responses are not cached.
4. Print and PDF receipt layout (80 mm) on a real printer/PDF viewer.
5. Screen reader and keyboard walkthrough of login, entry, checkout, payment.
6. Lighthouse (performance, accessibility, PWA) and bundle review (charts and jsPDF chunks are lazy but large).
7. Run `npx playwright test` (spec in `e2e/`).

## Out of scope (future) [F]
ANPR, customer portal, subscriptions, reservations, gates/IoT, advanced analytics, offline sync, SaaS billing, multi-country payments, dynamic pricing.

## Backend integration checklist
See API_INTEGRATION_CONTRACTS.md section 11, plus: confirm Q-01..Q-18 in OPEN_QUESTIONS.md, enable CORS + cookies for the frontend origin, serve the app over HTTPS (camera + PWA), configure `X-Request-Id`.
