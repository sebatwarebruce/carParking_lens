# API_INTEGRATION_CONTRACTS

Base URL: `VITE_API_BASE_URL` (default `/api/v1`, matches Blueprint section 14). All paths below are relative to it. Endpoint strings live only in `src/services/endpoints.js`.

Status of each endpoint: **BP** = in Blueprint, **SP** = illustrated in Sprint plan, **PROPOSED** = not in source documents but required by a confirmed screen; backend must confirm or change it (then edit `endpoints.js` + the service function only).

## 1. Conventions

- JSON, UTF-8. Dates: ISO-8601 UTC (`2026-10-20T06:15:32Z`). Display timezone = lot/org timezone (`Africa/Kigali`).
- Money: **integer RWF** (`2500`), field names `amount`, `amountDue`, `total`. Currency in `currency: "RWF"`.
- IDs: opaque strings or numbers; the UI never parses them.
- Single resources: bare object (as in the BP example). Lists: `{ "items": [], "page": 1, "pageSize": 20, "total": 134 }`.
- Auth: `Authorization: Bearer <accessToken>`; refresh cookie is httpOnly (`withCredentials: true`).
- Idempotency: `Idempotency-Key` header on `POST .../payments`, `POST /parking-sessions`, `POST .../checkout`.
- Request correlation: server returns `X-Request-Id`; UI shows it in error details for support.
- Pagination query: `page`, `pageSize`, `sort=field:asc|desc`. Filters are query params named as below.

### Error envelope (all non-2xx)
```json
{ "error": { "code": "SLOT_CONFLICT", "message": "Slot A-023 is no longer available.",
             "details": { "slotId": 23 }, "requestId": "req_8f2c" } }
```
Validation: `code: "VALIDATION_ERROR"`, `details: { "fields": { "plateNumber": "Required" } }`.

| HTTP | code | UI handling |
|---|---|---|
| 400/422 | VALIDATION_ERROR | map to fields |
| 401 | UNAUTHENTICATED / SESSION_EXPIRED | refresh once, else login |
| 401 | INVALID_CREDENTIALS | inline login error |
| 403 | FORBIDDEN | ForbiddenState |
| 403 | ACCOUNT_DISABLED | disabled screen |
| 404 | NOT_FOUND / SESSION_NOT_FOUND | empty/not-found state |
| 409 | SLOT_CONFLICT | refresh slots, keep form |
| 409 | DUPLICATE_ACTIVE_SESSION | link to existing session |
| 409 | SESSION_ALREADY_CLOSED | closed state + receipt link |
| 409 | PAYMENT_ALREADY_PENDING | block + show pending |
| 409 | INVALID_STATE_TRANSITION | refresh session |
| 413 / 415 | UPLOAD_TOO_LARGE / UPLOAD_INVALID_TYPE | upload error state |
| 422 | PRICING_UNAVAILABLE | cannot price message |
| 429 | RATE_LIMITED | `retryAfterSeconds` countdown |
| 5xx | INTERNAL_ERROR | retry, show requestId |
| none | (client) NETWORK_ERROR | "Connection lost..." |

## 2. Auth service (`authService.js`)

| Method | Path | Source | Request | Response |
|---|---|---|---|---|
| POST | /auth/login | BP | `{ identifier, password }` | `{ accessToken, expiresIn, user }` |
| POST | /auth/refresh | PROPOSED | cookie | `{ accessToken, expiresIn }` |
| POST | /auth/logout | PROPOSED | - | 204 |
| GET | /me | BP | - | `User` incl. `permissions`, `lots` |
| GET | /auth/providers | PROPOSED | - | `{ social: [{id:"google",enabled:false}], passwordReset: bool }` |
| POST | /auth/social/:provider/start | PROPOSED | `{ redirectUri }` | `{ authorizationUrl }` |
| POST | /auth/forgot-password | PROPOSED | `{ identifier }` | 202 (always, no account disclosure) |

```js
/** @typedef {{id:string,name:string,email?:string,phone?:string,role:'SUPER_ADMIN'|'PARKING_OWNER'|'MANAGER'|'ATTENDANT'|'CASHIER',
 *   status:'ACTIVE'|'DISABLED',organizationId:string,organizationName:string,permissions:string[],
 *   lots:{id:string,name:string,timezone:string}[],lastLoginAt?:string}} User */
```

## 3. Parking service (`parkingService.js`: lots + slots)

| Method | Path | Source | Notes |
|---|---|---|---|
| GET | /lots | BP | accessible lots |
| GET | /lots/:lotId | PROPOSED | detail + capacity summary |
| POST / PATCH | /lots, /lots/:lotId | PROPOSED | `lots.manage` |
| GET | /lots/:lotId/slots | BP | query: `status`, `vehicleType`, `zone`, `q` |
| POST | /lots/:lotId/slots | SP | bulk create `{ prefix, from, to, vehicleType, zone }` |
| PATCH | /slots/:id | BP | `{ status?, vehicleType?, zone?, reason? }` (reason required for OUT_OF_SERVICE) |

```js
/** @typedef {{id:string,lotId:string,slotNumber:string,zone?:string,vehicleType:'CAR'|'MOTORCYCLE'|'TRUCK'|'ANY',
 *   status:'AVAILABLE'|'OCCUPIED'|'OUT_OF_SERVICE',outOfServiceReason?:string,version:number,
 *   currentSession?:{id:string,ticketNumber:string,plateNumber:string}}} Slot */   // currentSession only if permitted
```

## 4. Vehicle service (`vehicleService.js`)

| Method | Path | Source | Notes |
|---|---|---|---|
| GET | /vehicles?q=&page= | PROPOSED | search by plate/phone |
| GET | /vehicles/:id | PROPOSED | |
| GET | /vehicles/:id/sessions | PROPOSED | history |

Vehicle registration happens inside the entry request (BP: backend creates vehicle + session in one transaction). The Vehicles module also offers a standalone "register vehicle" via `POST /vehicles` (PROPOSED) for pre-registration.

```js
/** @typedef {{id:string,plateNumber:string,displayPlate:string,vehicleType:'CAR'|'MOTORCYCLE'|'TRUCK'|'OTHER',ownerName?:string,ownerPhone?:string,visits?:number}} Vehicle */
```

## 5. Session service (`sessionService.js`)

| Method | Path | Source | Request | Response |
|---|---|---|---|---|
| POST | /parking-sessions | BP | `{ lotId, slotId, plateNumber, vehicleType, customerPhone?, ownerName?, entryPhotoUrl }` | 201 `Session` (min: `id, ticketNumber, status, entryTime, slot`) |
| GET | /parking-sessions/active | BP | `lotId`, `q`, `vehicleType`, `attendantId` | list |
| GET | /parking-sessions | PROPOSED | history filters: `from,to,lotId,q,slot,attendantId,status,paymentStatus,vehicleType` | list |
| GET | /parking-sessions/search | BP | `q`, `by=ticket|plate|phone|slot|qr`, `lotId` | `{ items: Session[] }` |
| GET | /parking-sessions/:id | BP | - | `SessionDetail` |
| POST | /parking-sessions/:id/checkout | BP | `{ exitPhotoUrl }` | `Checkout` (below) |
| POST | /parking-sessions/:id/complete | BP | `{ reason }` (exceptional) | `Session` |
| POST | /parking-sessions/:id/cancel | PROPOSED | `{ reason }` | `Session` |
| GET | /parking-sessions/:id/receipt | PROPOSED | - | `Receipt` |

```js
/** @typedef {{id:string,ticketNumber:string,status:'ACTIVE'|'EXIT_PENDING'|'PAYMENT_PENDING'|'PAYMENT_FAILED'|'DISPUTED'|'COMPLETED'|'CANCELLED',
 *   lotId:string,lotName:string,vehicle:Vehicle,slot:{id:string,slotNumber:string},
 *   entryTime:string,exitTime?:string,durationMinutes?:number,amountDue?:number,currency:'RWF',
 *   entryPhoto?:PhotoRef,exitPhoto?:PhotoRef,createdBy:{id:string,name:string},closedBy?:{id:string,name:string},
 *   allowedActions:('CHECKOUT'|'PAY'|'COMPLETE'|'CANCEL'|'DISPUTE')[],
 *   payments?:Payment[],receiptId?:string,serverTime:string}} SessionDetail */
/** @typedef {{key:string,url:string,capturedAt:string,uploadedBy?:string,contentType:string,bytes:number}} PhotoRef */
/** @typedef {{session:SessionDetail /* the updated session (status EXIT_PENDING) */,entryTime:string,exitTime:string,durationMinutes:number,
 *   pricingRule:{id:string,name:string,vehicleType:string},
 *   breakdown:{code:string,label:string,detail?:string,amount:number}[],   // render as-is
 *   total:number,currency:'RWF',billedUnits?:number,gracePeriodApplied?:boolean,dailyMaxApplied?:boolean,
 *   enabledPaymentMethods:('CASH'|'MTN_MOMO'|'AIRTEL_MONEY'|'CARD'|'BANK')[]}} Checkout */
```
`SessionDetail` (GET /parking-sessions/:id) also includes `checkout?: Checkout` (without the nested `session`) and `payments: Payment[]` newest first, so a page reload mid-checkout can rebuild the fee screen and the payment state from the server alone. `POST .../checkout` is idempotent: calling it again on an EXIT_PENDING session re-returns the stored checkout.

`serverTime` on every session response lets `useServerClock` compute offset so live timers never use the device clock as truth.

## 6. Payment service (`paymentService.js`)

| Method | Path | Source | Request | Response |
|---|---|---|---|---|
| POST | /parking-sessions/:id/payments | BP | `{ method, amount, phone? (mobile money), amountReceived? (cash) }` + `Idempotency-Key` | 201 `Payment` (`PENDING` for mobile money; `SUCCESS` only for authorised cash) |
| GET | /payments/:id | BP | - | `Payment` |
| GET | /payments | PROPOSED | `from,to,lotId,method,status,q,page` | list |
| POST | /payments/:id/void | PROPOSED | `{ reason }` | `Payment` |
| POST | /payments/provider/callback | BP | **server-to-server only; never called by the frontend** | - |
| GET | /payments/queue | PROPOSED | `lotId` | `{items: SessionDetail[]}` for sessions in EXIT_PENDING / PAYMENT_PENDING / PAYMENT_FAILED (cashier queue) |

`amount` in the request is echoed back for the server to verify equals `amountDue`; the server rejects a mismatch. The UI never sets or alters the figure; it passes the value it displayed from `Checkout.total`.

```js
/** @typedef {{id:string,sessionId:string,ticketNumber?:string,amount:number,currency:'RWF',method:'CASH'|'MTN_MOMO'|'AIRTEL_MONEY'|'CARD'|'BANK',
 *   status:'PENDING'|'SUCCESS'|'FAILED'|'CANCELLED'|'REFUNDED',transactionReference:string,providerReference?:string,
 *   maskedPhone?:string,initiatedBy?:{id:string,name:string},confirmedBy?:{id:string,name:string},
 *   failureReason?:string,createdAt:string,paidAt?:string,expiresAt?:string}} Payment */
```

## 7. Receipt service (`receiptService.js`)

| Method | Path | Source |
|---|---|---|
| GET | /receipts?from&to&lotId&q&page | PROPOSED |
| GET | /receipts/:id | PROPOSED |
| POST | /receipts/:id/reprint | PROPOSED (audit event) |
| POST | /receipts/:id/send | PROPOSED (only if `capabilities.notifications`) |

```js
/** @typedef {{id:string,receiptNumber:string,ticketNumber:string,sessionId:string,lotName:string,organizationName:string,
 *   vehicle:{plateNumber:string,vehicleType:string},slotNumber:string,entryTime:string,exitTime:string,durationMinutes:number,
 *   breakdown:{label:string,amount:number}[],total:number,currency:'RWF',
 *   payment:{method:string,transactionReference:string,paidAt:string,confirmedBy?:string},issuedAt:string,reprintCount:number}} Receipt */
```

## 8. Pricing service (`pricingService.js`)

| Method | Path | Source |
|---|---|---|
| GET | /pricing-rules?lotId&vehicleType&status | PROPOSED (BP has POST) |
| POST | /pricing-rules | BP |
| PATCH | /pricing-rules/:id | PROPOSED |
| POST | /pricing-rules/preview | PROPOSED: server-side sample billing so the UI never calculates: `{ ...rule, sampleMinutes }` -> `{ breakdown, total }` |

```js
/** @typedef {{id:string,lotId:string,vehicleType:string,gracePeriodMinutes:number,firstBlockMinutes:number,firstBlockPrice:number,
 *   additionalBlockMinutes:number,additionalBlockPrice:number,dailyMaxPrice?:number,effectiveFrom:string,effectiveTo?:string,
 *   status:'ACTIVE'|'INACTIVE',updatedBy?:{id:string,name:string},updatedAt?:string}} PricingRule */
```

## 9. Report service (`reportService.js`) and dashboard

| Method | Path | Source |
|---|---|---|
| GET | /dashboard/summary?lotId&from&to | PROPOSED (BP: `/reports/daily` can back it) |
| GET | /reports/daily?lotId&date | BP |
| GET | /reports/revenue?lotId&from&to&groupBy=day|method | BP |
| GET | /reports/occupancy?lotId&from&to | PROPOSED |
| GET | /reports/attendants?lotId&from&to | PROPOSED |
| GET | /reports/sessions?lotId&from&to | PROPOSED |

Dashboard payload separates `confirmedRevenue` from `pendingAmount` and `failedCount`; the UI never sums them. Every report response echoes `{ from, to, lotId, currency, generatedAt, basis: 'CONFIRMED' }`.

## 10. Staff, audit, notifications, settings, organizations, uploads

| Service | Method | Path | Source |
|---|---|---|---|
| staff | GET/POST | /staff | PROPOSED |
| staff | GET/PATCH | /staff/:id (role, lots, status+reason) | PROPOSED |
| staff | POST | /staff/:id/reset-password | PROPOSED |
| audit | GET | /audit-logs?from&to&actorId&action&entityType&q&page | PROPOSED |
| notification | GET | /notifications | PROPOSED |
| notification | PATCH | /notifications/:id/read, `/notifications/read-all` | PROPOSED |
| notification | GET/PUT | /me/notification-preferences | PROPOSED |
| settings | GET | /settings/policy | PROPOSED: `{ requireCustomerPhone, requirePhotos, allowPhotoException, longSessionMinutes, currency, timezone, capabilities }` |
| settings | GET | /settings/payment-methods | PROPOSED: methods + `enabled` + `status` (no credentials, ever) |
| settings | PATCH | /settings/organization | PROPOSED |
| organizations | GET/POST/PATCH | /organizations (SUPER_ADMIN) | PROPOSED |
| upload | POST | /uploads/vehicle-photo | BP: multipart `file`, `captureType=ENTRY|EXIT`, `lotId` -> `PhotoRef` |
| photo | GET | `PhotoRef.url` fetched through the authenticated client as blob | BP 15.1 |

## 11. Integration switch (how mock becomes real)

1. `.env`: `VITE_USE_MOCKS=false`, `VITE_API_BASE_URL=https://api.example.com/api/v1`.
2. Contract tests live in `src/services/__tests__/`. They call `installMocks()` today; to validate a real staging API, remove that call (or guard it with `env.useMocks`) and point `VITE_API_BASE_URL` at staging. The assertions are written against the contract, not against mock internals.
3. Any field-name differences are fixed in **one** place: the matching function in `src/services/*Service.js` (and `asList` in `api.js` for list envelopes), not in components.
4. Endpoint renames: `services/endpoints.js`.
5. Delete `src/mocks/` when no longer needed; nothing else imports it.
