# USER_ROLES_AND_PERMISSIONS

**The backend is the final authority.** The UI renders from the `permissions: string[]` returned by `GET /me`. The role->permission table below is (a) the default used by the mock server and (b) the planning baseline to confirm with the product owner [Q-17]. Frontend guards are UX only.

## Permission keys

`dashboard.view`, `platform.manage`, `lots.view`, `lots.manage`, `slots.view`, `slots.manage`, `vehicles.view`, `vehicles.manage`, `sessions.view`, `sessions.create`, `sessions.checkout`, `sessions.override`, `payments.view`, `payments.collect`, `payments.confirmCash`, `payments.void`, `receipts.view`, `receipts.reprint`, `pricing.view`, `pricing.manage`, `reports.view`, `reports.export`, `staff.view`, `staff.manage`, `audit.view`, `settings.view`, `settings.manage`, `notifications.view`

## Default matrix (mock baseline)

| Permission | SUPER_ADMIN | OWNER | MANAGER | ATTENDANT | CASHIER |
|---|:-:|:-:|:-:|:-:|:-:|
| dashboard.view | Y (platform) | Y | Y | Y (ops) | Y (cashier) |
| platform.manage | Y | | | | |
| lots.view | | Y | Y | Y (assigned) | Y (assigned) |
| lots.manage | | Y | | | |
| slots.view | | Y | Y | Y | |
| slots.manage (status, reason) | | Y | Y | | |
| vehicles.view / manage | | Y / Y | Y / Y | Y / Y | |
| sessions.view | | Y | Y | Y | Y |
| sessions.create (entry) | | | Y | Y | |
| sessions.checkout (exit) | | | Y | Y | |
| sessions.override (cancel/manual complete) | | Y | Y | | |
| payments.view | | Y | Y | Y (own lot) | Y |
| payments.collect (initiate) | | | Y | Y | Y |
| payments.confirmCash | | | Y | | Y |
| payments.void | | Y | Y | | |
| receipts.view | | Y | Y | Y | Y |
| receipts.reprint | | Y | Y | | Y |
| pricing.view / manage | | Y / Y | Y / | | |
| reports.view / export | Y / | Y / Y | Y / Y | | |
| staff.view / manage | Y / Y (platform users) | Y / Y | Y / | | |
| audit.view | Y | Y | Y | | |
| settings.view / manage | Y / Y | Y / Y | Y / | | |
| notifications.view | Y | Y | Y | Y | Y |

Design note: the pilot may run with one attendant who also handles cash. That is a **permission grant** (`payments.confirmCash` on the attendant), not a UI change. When an attendant lacks it, checkout shows "Send to cashier" and the session appears in the cashier queue.

## Experience per role

### SUPER_ADMIN (separate `PlatformShell`)
- Landing: `/platform` platform overview (organizations, active orgs, platform health placeholders sourced from API, support).
- Nav: Organizations, Platform users, Audit log, Platform settings, Profile.
- Restricted: all lot-level operational screens. No vehicle entry/exit, no payments.

### PARKING_OWNER
- Landing: `/dashboard` (full KPI set, revenue charts, alerts).
- Nav: Dashboard, Live spaces, Sessions, Payments, Receipts, Reports, Pricing, Locations, Staff, Audit log, Settings.
- Cannot: platform admin, create entries by default.

### MANAGER
- Landing: `/dashboard` (same KPIs; staff oversight widgets).
- Nav: Dashboard, Live spaces, Entry, Exit, Sessions, Payments, Receipts, Reports, Pricing (view), Staff (view), Audit log, Settings (view).
- Handles DISPUTED sessions, overrides, slot out-of-service.

### ATTENDANT
- Landing: `/home` big **Vehicle entry** and **Vehicle exit** actions + available/occupied counters + active sessions + recent activity.
- Mobile dock: Home, Spaces, **Entry** (centre, raised), **Exit**, More (Sessions, Receipts, Profile, Help).
- Cannot: pricing, staff, reports, audit, settings, slot status change.

### CASHIER
- Landing: `/cashier` payment queue (EXIT_PENDING / PAYMENT_PENDING / PAYMENT_FAILED), pending payments, today's confirmed cash, recent receipts.
- Nav: Cashier home, Payments, Receipts, Transactions history, Profile.
- Cannot: entry/exit capture, slot or pricing changes.

## Frontend enforcement points

1. `RequirePermission` on routes. 2. `can()` filtering in `navConfig`. 3. `<Can permission>` wrapper for buttons/sections (renders nothing, or a disabled-with-reason control where discoverability matters). 4. 403 responses surface `ForbiddenState`: "You don't have permission to do this. Contact your manager if you think this is a mistake." (UX copy).

## Lot scoping

`user.lots` lists assigned lots. `LotContext.activeLot` is sent as `lotId` on lot-scoped calls. A lot the user is not assigned never appears in the switcher; direct URL access still depends on the backend returning 403/404.
