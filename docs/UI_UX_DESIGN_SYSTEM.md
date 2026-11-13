# UI_UX_DESIGN_SYSTEM

## 0. Design plan (reviewed against the brief)

**Subject:** a phone-first tool used outdoors by parking attendants, and a monitoring console for owners. **Primary job:** make entry/exit fast and make money/status unambiguous.

**Concept: "The Lens".** The Dark Neon Lens direction is expressed through one memorable motif, the camera aperture ring, because the product's signature action is photographing a vehicle. The ring appears on the logo mark, the raised centre Entry button in the mobile dock, the camera viewfinder, and the attendant home's Entry action. Everything else stays quiet: matte near-black surfaces, cream text, one burnt-orange accent, hairline borders. Neon is limited to a soft ambient glow behind the page header and a rim light on the Lens ring.

**Review against defaults I avoided:** no all-caps tracked eyebrow labels, no numbered section markers, no gradient wash on every card, no identical-card grid for everything (slot grid, session list, receipts and tables each have their own structure), no arrows appended to buttons, no `·`-joined meta strings (labelled rows instead). The cream+terracotta-serif and black+acid-accent clusters are avoided by pairing a grotesque display face with a *dark-first* system, using cream as **text and a full light theme** rather than a decorative page wash, and keeping orange rare.

## 1. Colour tokens (semantic, themeable)

Initial palette from the master prompt: `#101010 #171717 #F5EBD8 #EDE1CB #C65D25 #E87932 #252525 #A7A29B #38332F`.

| Token | Dark (default) | Cream theme | Use |
|---|---|---|---|
| `--bg` | `#101010` | `#F5EBD8` | page |
| `--bg-raised` | `#171717` | `#EDE1CB` | rails, docks, sheets |
| `--surface` | `#1D1D1D` | `#FBF5E8` | cards |
| `--surface-2` | `#252525` | `#EFE4CE` | inputs, hover |
| `--border` | `#38332F` | `#D6C7AA` | hairlines |
| `--text` | `#F5EBD8` | `#171717` | primary text |
| `--text-muted` | `#A7A29B` | `#5C564E` | secondary text |
| `--accent` | `#C65D25` | `#C65D25` | fills (buttons, active pill) |
| `--on-accent` | `#101010` | `#101010` | text on accent fill (4.5:1) |
| `--accent-text` | `#E87932` | `#9A4416` | accent text/icons on surface (>=4.5:1) |
| `--glow` | `rgba(232,121,50,.22)` | `rgba(198,93,37,.14)` | ambient lens glow |
| `--success` | `#63C183` | `#1E7A43` | Available, Confirmed |
| `--warning` | `#E6B24F` | `#8A5A00` | Pending |
| `--danger` | `#F0766B` | `#B42318` | Failed, Occupied emphasis |
| `--info` | `#6DB5E8` | `#0B5C8F` | Info |

Contrast checks were done on the pairs above (all text pairs >= 4.5:1; large text/graphics >= 3:1). Status always = **icon + text + colour**.

## 2. Typography

| Role | Face | Spec |
|---|---|---|
| Display / headings / KPI numerals | Bricolage Grotesque (variable, self-hosted via fontsource) | 600-700, tight tracking, tabular numerals for money |
| Body / UI | Inter Variable | 16 px body on mobile, 14 px dense tables on desktop |
| Identifiers (plates, tickets, references) | JetBrains Mono Variable | only for these data identifiers, so they read as codes |

Scale (rem): `text-xs .75 / sm .875 / base 1 / lg 1.125 / xl 1.375 / 2xl 1.75 / 3xl 2.25 / 4xl 3`. Sentence case everywhere. Line length <= 70ch.

## 3. Spacing, radii, elevation

- 4/8 px scale (Tailwind default). Page gutters 16 px mobile / 24 tablet / 32 desktop. Max content width 1280 px.
- Radii: `--r-sm 10px` (inputs, badges), `--r-md 16px` (cards, buttons), `--r-lg 24px` (sheets, dock), full for pills/Lens. Three values only.
- Elevation: `flat` (border only), `raised` (subtle two-sided soft shadow, neumorphic, used on dock/primary controls), `inset` (pressed/active), `overlay` (dialogs). Neumorphic shadows are *always* paired with a 1 px border and kept contrast-safe.

## 4. Layout grids

- Mobile (<640): single column, bottom dock 72 px + safe-area; sticky action bar only above the dock.
- Tablet (640-1023): collapsed icon rail (72 px) + content; slot grid 5-7 columns; 2-column forms where readable.
- Desktop (>=1024): 264 px sidebar + topbar + content; dashboards 12-col grid; DataTable full.

## 5. Navigation

- **MobileDock** (neumorphic): 4 slots + raised centre Lens button. Attendant: Home, Spaces, **Entry (Lens)**, Exit, More. Others get role-appropriate 4 + More; "More" opens a grouped sheet (Sheet with spring open/close). Targets >= 48 px, label always visible, no hover-only affordances.
- **Active state** (subtle): `layoutId` shared background pill at ~10% accent, icon switches to `--accent-text`, label weight 600, a 2 px accent underline dot. No glow, no colour flood. Inactive remains clearly different by weight + colour + the pill.
- **Sidebar/Rail**: same active treatment; groups follow UX section 5 (Home, Parking operations, Transactions, Records, Management, Insights, Administration).

## 6. Icon registry (Lucide, `constants/icons.js`)

Size 20 (nav/actions) and 16 (inline), stroke 1.75, always `aria-hidden` when paired with a label.

| Concept | Icon | Concept | Icon |
|---|---|---|---|
| Dashboard | `LayoutDashboard` | Entry | `LogIn` / Lens `Aperture` |
| Spaces / slots | `ParkingSquare` | Exit | `LogOut` |
| Sessions | `Timer` | Receipt | `ReceiptText` |
| Payments | `Wallet` | Cash | `Banknote` |
| Mobile money | `Smartphone` | Reports | `ChartNoAxesColumn` |
| Pricing | `Tags` | Staff | `UsersRound` |
| Audit | `ScrollText` | Settings | `Settings2` |
| Notifications | `Bell` | Locations | `MapPinned` |
| Car / Motorcycle / Truck / Other | `Car` / `Bike` / `Truck` / `CircleHelp` | Camera | `Camera` |
| Available / Occupied / Out of service | `CircleCheck` / `CarFront` / `Wrench` | Pending / Failed / Confirmed | `Hourglass` / `CircleX` / `BadgeCheck` |
| Roles | Super admin `ShieldCheck`, Owner `Crown`, Manager `ClipboardCheck`, Attendant `Contact`, Cashier `HandCoins` | Offline | `WifiOff` |

## 7. Component inventory (all implemented in `components/`)

Button (primary, secondary, ghost, danger, icon, loading), Input/Textarea/Select/Switch, Field (label, hint, error), PlateInput, PhoneInput, VehicleTypePicker, Card (flat/raised), KPI card, Badge/StatusBadge, Tabs/Segmented, Dialog + ConfirmDialog (reason field), Sheet, Toast, Alert, Skeleton, EmptyState, ErrorState, ForbiddenState, OfflineBanner, DataTable (responsive -> cards), Pagination, FilterBar, SecurePhoto, QrTicket, ElapsedTimer, MoneyText, Timestamp, CameraCapture, ChartCard (Recharts with text summaries), Stepper.

## 8. Motion rules

- Library: `motion` with local Motion-Primitives-style helpers (`AnimatedBackground` active pill, `Disclosure`, `CountUp`, `Reveal` used once per page).
- Micro-interactions that answer a user action: button press scale .97, dialog/sheet spring, toast slide, input focus ring ease, slot select ring, camera shutter flash (150 ms), row hover tint, theme change colour transition.
- Non-user-triggered motion: only the Lens ring idle pulse on the Entry action (2% scale, slow) and skeleton shimmer.
- **Payment states are never animated in a way that implies success**: pending = static hourglass + polling text; success only after server confirmation, with a single 200 ms fade.
- `prefers-reduced-motion`: `MotionConfig reducedMotion="user"` + CSS `@media` kills transitions/shimmer.

## 9. States (every data view)

Loading skeleton, empty, no-results, validation, API error (with Retry and request id), offline, permission denied, session expired, saving/uploading, success, pending, failed. Implemented once in `QueryState` and `StatusPanel`, reused everywhere.

## 10. Accessibility checklist

Semantic landmarks (`header/nav/main`), skip link, visible 2 px focus ring (`--accent-text` offset), labels for all inputs, `aria-live` for toasts/payment status, dialogs trap focus and close on Escape, tables have captions/headers, touch targets >= 44 px, colour never sole indicator, `lang`, reduced motion, text resize to 200%.

## 11. Copy rules

Verbs state the action ("Confirm vehicle entry", "Request payment", "Save pricing rule") and the same name is used in toasts. Errors say what happened and what to do next. All microcopy is centralised in `constants/messages.js`, using the UX guide wording.
