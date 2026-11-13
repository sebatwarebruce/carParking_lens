# PROJECT_ANALYSIS

Unified frontend specification merged from four sources:

| Code | Source | Authority |
|---|---|---|
| **BP** | Parking_Platform_Development_Blueprint_v1.pdf | Business rules, status model, API surface, financial controls |
| **UX** | Parking_Platform_UI_UX_Designer_Guide.docx | Screen specs, states, microcopy, accessibility |
| **SP** | Digital_Parking_MVP_2_Week_Development_Plan.docx | MVP boundary, engineering rules, acceptance tests |
| **MP** | Master prompt (frontend architect brief) | Stack, visual identity, deliverables, phases |

Tags used below: **[C]** confirmed requirement, **[R]** recommended frontend decision, **[Q]** needs product-owner answer (see OPEN_QUESTIONS.md), **[F]** future / outside MVP.

## 1. Objectives

Replace paper parking operations with an auditable digital lifecycle:

`vehicle entry -> active session -> vehicle exit -> fee calculation -> payment -> session completion -> receipt` **[C: BP, UX, SP, MP all agree]**

The frontend is presentation + device access. It never owns time, price, permissions, payment outcome or slot state **[C: BP 10.1, SP 6]**.

## 2. MVP scope

### P0 (the essential lifecycle) [C: UX 2.2]
Sign in, dashboard, live slots, vehicle entry, photo capture, active sessions, exit lookup, fee summary, payment status, receipt.

### P1 [C: UX 2.2]
Session history, payment history, pricing settings, slot management, staff management, basic reports, audit history.

### Later [F]
ANPR/OCR, customer portal, subscriptions, corporate accounts, reservations, gate hardware, sensors, advanced analytics, full offline sync, multi-country payments, SaaS billing, dynamic pricing. The frontend leaves hooks but ships no UI that implies these exist.

## 3. Functional requirements -> frontend modules

| BP ID | Requirement | Frontend module | Notes |
|---|---|---|---|
| FR-001 | Login, disabled accounts blocked | auth | Disabled / locked / rate-limited / expired states |
| FR-002 | Lot selection | parking-lots | `LotContext`, switcher in header |
| FR-003 | Slot list with real-time availability | parking-slots | Polling via TanStack Query (no websockets in contract) |
| FR-004 | Vehicle entry | vehicle-entry | Server entry time, read-only on screen |
| FR-005 | Unique ticket | vehicle-entry | Displayed from server only |
| FR-006 | Prevent double allocation | vehicle-entry | Handle `SLOT_CONFLICT` 409, refresh slots, keep form |
| FR-007 | Lookup by ticket/plate/phone/slot/QR | vehicle-exit | Search + QR scanner |
| FR-008 | Exit capture | vehicle-exit | Exit photo, server time |
| FR-009 | Fee calculation | vehicle-exit | Display only what `checkout` returns |
| FR-010 | Payment initiation | payments | Idempotency-Key header |
| FR-011 | Payment confirmation | payments | Poll status; success only from server |
| FR-012 | Complete session | payments | Slot release shown only when server says so |
| FR-013 | Receipt | receipts | View / print / PDF / share |
| FR-014 | Reports | reports | Date, method, lot, user, status filters |
| FR-015 | Pricing configuration | pricing | Effective-dated rules, preview |
| FR-016 | Audit log | audit-logs | Read-only viewer |
| FR-017 | Notifications (Should) | settings | Preferences UI only |
| FR-018 | QR ticket (Should) | receipts / entry | Encodes ticket URL, no secrets |
| FR-019 | Photo retention (Should) | settings | Placeholder; policy undefined [Q] |
| FR-020 | Exports (Should) | reports | CSV client-side from server data; PDF via print |

## 4. Non-functional requirements [C]

- Mobile-first, ~360 px (UX allows 320 px), no horizontal scroll, 44 px+ targets.
- WCAG 2.2 AA where practical; status never by colour alone.
- PWA: installable, app shell cache, offline indicator, **no offline transaction completion**, no broad API caching.
- Performance: lazy routes, client-side photo compression, optimistic UI only for non-financial toggles.
- Security UX: route guards are UX only, masked phones, no secrets in `VITE_*`, confirmation + reason for sensitive actions.
- Time: UTC from server, displayed in `Africa/Kigali` (or the lot's timezone) **[C: SP 6]**.
- Money: integer RWF, formatted `2,500 RWF` **[C: UX 7.8, SP 6]**.

## 5. User types

SUPER_ADMIN, PARKING_OWNER, MANAGER, ATTENDANT, CASHIER **[C: BP 5, MP 4.3]**. A Customer role is optional-MVP in UX 3 and has no account; the frontend ships a minimal public ticket/receipt view **[Q-09]**.

## 6. Business rules mirrored in the UI

1. Session statuses: `ACTIVE, EXIT_PENDING, PAYMENT_PENDING, PAYMENT_FAILED, DISPUTED, COMPLETED, CANCELLED` and allowed transitions (BP 8.1). The UI renders only transitions the server reports in `allowedActions`; the transition table in `constants/sessionStatus.js` exists for labels and badges, not for authorisation.
2. Slot statuses: `AVAILABLE, OCCUPIED, OUT_OF_SERVICE`.
3. One non-terminal session per slot (server enforced; UI handles conflict).
4. Client clock is display-only (BP 8.2). Elapsed timers tick from the server `entryTime` and a measured server-clock offset.
5. Payment `SUCCESS` only from server (provider callback or authorised cash).
6. Overrides (manual fee, slot, void, manual completion) need a reason; the UI collects it and the server audits it.
7. Photos are evidence, not identifiers. Replacing/deleting is restricted, so the UI offers no delete.
8. Duplicate payment attempt while one is pending: UI blocks and warns (UX 7.9).

## 7. Dependencies on the backend (frontend assumes)

Auth + `/me` with permissions; lots/slots; sessions incl. search, checkout, payments, complete; pricing rules; photo upload returning a controlled URL; reports; staff; audit; notifications. All defined in API_INTEGRATION_CONTRACTS.md.

## 8. Conflicts and resolutions between the documents

| # | Conflict | Resolution |
|---|---|---|
| X-1 | **Palette**: UX proposes navy `#14213D` / blue `#2563EB` on light; MP mandates cream/black/burnt orange. UX itself says its palette is a "proposed starting point for approval". | **MP wins** (later, explicit, owner-authored). Functional status colours from UX (green/red/amber/blue) are kept as semantic tokens, retuned for dark and cream surfaces. |
| X-2 | **API prefix**: BP uses `/api/v1/...`; SP uses `/api/...` and says "examples, not fixed". | Use **BP** paths. Base URL + prefix come from env (`VITE_API_BASE_URL`, default `/api/v1`). |
| X-3 | **Endpoint names**: BP `/parking-sessions`, SP `/sessions`, `/locations`; BP `/lots`. | BP names. Centralised in `services/endpoints.js` so a rename is a one-file change. |
| X-4 | **Quote vs checkout**: SP has `quote` and `checkout`; BP has only `checkout` (records exit time + calculates). | Use BP `checkout` as the single call (it moves ACTIVE -> EXIT_PENDING). SP-style recalculation is a re-`GET` of the session. [Q-06] |
| X-5 | **Photo upload**: BP `POST /uploads/vehicle-photo`; SP `upload-url` or `POST /photos`. | BP multipart upload with progress; service has a signed-URL strategy stub behind the same function. |
| X-6 | **Money type**: BP SQL shows `DECIMAL`, also says integer minor units are fine; SP and UX say integer RWF. | Frontend contract = **integer RWF**. `formatMoney` rejects non-integers in dev. |
| X-7 | **Roles in SP** list "administrator, owner/manager, attendant, cashier". | Map to the 5 BP roles. |
| X-8 | **Social login first** (MP) vs documented email/phone + password and JWT (BP/UX/SP). | Social buttons are first and prominent but **disabled until `/auth/providers` says enabled** (MP: do not assume a provider). Password login always works. [Q-01] |
| X-9 | **Slot "ANY" / vehicle types**: BP slot enum has `CAR, MOTORCYCLE, TRUCK, ANY`; vehicle enum `CAR, MOTORCYCLE, TRUCK, OTHER`. | Both supported; `ANY` slots fit every type; `OTHER` vehicles only fit `ANY` slots. [Q-10] |
| X-10 | **Rounding/discount**: UX shows rounding, discounts, adjustments; BP pricing table has none. | Breakdown component renders whatever line items the server returns, so adding them later needs no UI change. Pricing form includes rounding as optional/disabled until confirmed. [Q-06] |
| X-11 | **Super admin**: MP wants a separate experience; BP/UX say "organizations, platform analytics". | Separate `/platform/*` layout and routes. |
| X-12 | **Phone required?** BP "customer phone" in FR-004; UX says confirm policy. | Configurable by `GET /settings/policy` (`requireCustomerPhone`, `requirePhotos`), default **required phone, required photo** with documented exception path stub. [Q-02, Q-03] |
| X-13 | **Session completion / slot release timing** differs in wording ("normally after payment"). | UI never assumes release; it displays slot state from the server after completion. [Q-05] |
| X-14 | **Tokens**: JWT mentioned; storage not defined. | Access token in memory only, refresh via httpOnly cookie (backend). Never `localStorage` for tokens. [Q-04] |
| X-15 | **Social/`Forgot password`** appear in UX only "if recovery is included". | UI present, gated by `/auth/providers` capabilities. |

## 9. Feature priorities (build order)

1. Foundation: design system, app shell, auth, role guards, mock server.
2. P0 lifecycle: lots/slots -> entry (+camera) -> active sessions -> exit -> checkout -> payments -> receipts.
3. P1: history/search, pricing, staff, reports, audit, settings, super-admin.
4. PWA hardening, accessibility pass, tests, integration-readiness.
