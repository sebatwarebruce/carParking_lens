# FRONTEND_FOLDER_STRUCTURE

```
parking-frontend/
|-- docs/                         architecture deliverables
|-- public/                       favicon, PWA icons (generated), robots
|-- scripts/                      build-time guards (check-env), icon generation
|-- e2e/                          Playwright specs
|-- src/
|   |-- main.jsx                  bootstrap (mock install -> render)
|   |-- App.jsx                   router + global overlays only
|   |-- app/
|   |   |-- config/env.js         single reader of import.meta.env, validated
|   |   |-- providers/            AppProviders, ThemeProvider, NetworkProvider, ToastProvider
|   |   `-- router/               routes.jsx, guards (RequireAuth, RequirePermission, RoleHome)
|   |-- assets/                   logo svg
|   |-- components/
|   |   |-- ui/                   Button, Input, Select, Card, Badge, Dialog, Sheet, Tabs, Skeleton, Switch ...
|   |   |-- motion/               Motion-Primitives-style helpers (AnimatedBackground, Disclosure, CountUp)
|   |   |-- forms/                Field, PlateInput, PhoneInput, VehicleTypePicker, MoneyText
|   |   |-- tables/               DataTable (responsive -> cards), Pagination, FilterBar
|   |   |-- feedback/             QueryState, EmptyState, ErrorState, Alert, OfflineBanner, ForbiddenState
|   |   |-- navigation/           Sidebar, MobileDock, MoreSheet, Topbar, LotSwitcher, UserMenu
|   |   `-- common/               StatusBadge, SecurePhoto, QrTicket, Timestamp, ElapsedTimer, ConfirmDialog
|   |-- features/                 one folder per bounded feature
|   |   |-- auth/                 pages/, components/, hooks/
|   |   |-- dashboard/            owner, attendant, cashier dashboards
|   |   |-- organizations/        super-admin organization management
|   |   |-- parking-lots/
|   |   |-- parking-slots/        slot grid, filters, detail sheet
|   |   |-- vehicles/
|   |   |-- parking-sessions/     active list, detail, history
|   |   |-- vehicle-entry/        wizard, camera, ticket success
|   |   |-- vehicle-exit/         lookup, QR scan, checkout review
|   |   |-- payments/             method picker, pending/success/failed panels, history, cashier queue
|   |   |-- receipts/             receipt view, list, PDF/print/share
|   |   |-- pricing/
|   |   |-- reports/
|   |   |-- staff/
|   |   |-- audit-logs/
|   |   |-- notifications/
|   |   `-- settings/             org, locations, payments config, notifications, profile, help
|   |   (each feature: components/ hooks/ pages/ index.js)
|   |-- layouts/                  AppShell, AuthLayout
|   |-- hooks/                    useDebounce, useNow, useUrlState, useMediaQuery, useGuardedMutation
|   |-- context/                  AuthContext, LotContext
|   |-- services/                 api.js, endpoints.js, errors.js, authService.js, parkingService.js (lots+slots),
|   |                             vehicleService.js, sessionService.js, paymentService.js, receiptService.js,
|   |                             pricingService.js, reportService.js, staffService.js, auditService.js,
|   |                             notificationService.js, settingsService.js, uploadService.js
|   |-- mocks/                    install.js, server.js (axios adapter), db.js, seed.js, pricingEngine.js,
|   |                             handlers/*.js         <- ONLY place with fake business logic
|   |-- schemas/                  zod: auth, vehicleEntry, payment, pricing, staff, slot
|   |   |-- utils/                    format.js (money/date/plate/phone), image.js, csv.js, pdf.js, ids.js
|   |-- constants/                roles, permissions, statuses, vehicleTypes, messages, icons, brand, nav
|   `-- styles/                   index.css (tokens + themes + Tailwind), print.css
|-- .env.example
|-- vite.config.js
|-- vitest.config.js
`-- README.md
```

## Directory responsibilities

| Directory | Responsibility | May import from | Must not import |
|---|---|---|---|
| `app/` | Wiring: env, providers, routes | everything | - |
| `components/ui` | Presentational primitives, no data | `utils`, `constants` | `services`, `features` |
| `components/common`, `forms`, `tables`, `feedback`, `navigation` | Reusable composites | `ui`, `hooks`, `context`, `constants` | `features` |
| `features/*` | One feature's pages, components, hooks | `components`, `services`, `hooks`, `schemas`, other features' **index.js** only | `mocks`, other features' internals |
| `layouts/` | Page chrome | `components/navigation` | `services` (except via context) |
| `services/` | HTTP contract | `axios`, `utils/ids`, `app/config` | React, `mocks` (static), components |
| `mocks/` | Fake backend | `constants`, `utils/ids` | components, hooks |
| `schemas/` | Zod validation | `constants` | everything else |
| `constants/` | Enums, labels, permission keys | nothing | everything else |

## Feature-folder convention

```
features/vehicle-entry/
  components/   EntryStepper.jsx, SlotPicker.jsx, ReviewCard.jsx, TicketSuccess.jsx
  hooks/        useCreateEntry.js
  pages/        VehicleEntryPage.jsx
  index.js      public exports (pages for router, hooks used elsewhere)
```
