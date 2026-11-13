# OPEN_QUESTIONS

Every item below is a product-owner decision. The frontend has a safe default so work is not blocked; nothing here is silently invented into the contract.

| ID | Question | Source | Safe default in the frontend | Criticality |
|---|---|---|---|---|
| Q-01 | Which social login providers (Google, Apple, other) will the backend enable, if any? | MP 8-A vs BP/UX | Social buttons render from `GET /auth/providers`; shown disabled with "Not available yet" if none. Password login always works. | Medium |
| Q-02 | Is customer phone mandatory at entry? | BP FR-004, UX 17 | `policy.requireCustomerPhone = true` (from server settings; mock default true) | Medium |
| Q-03 | Are entry/exit photos mandatory? Is there an exception path and who may use it? | UX 17 | Photos required; "Continue without photo" exists only when `policy.allowPhotoException` and user has `session.photoException` permission, and requires a reason | High |
| Q-04 | Session/token strategy (httpOnly refresh cookie vs bearer-only)? CSRF handling? | BP 17 | Bearer in memory + `withCredentials` refresh call; 401 handling centralised | High |
| Q-05 | Exact slot-release rule (payment-only, or also authorised exception)? | BP 2.4, UX 17, SP 11 | UI reflects server state only | High |
| Q-06 | Pricing: rounding method, overnight handling, discounts, adjustments? `quote` vs `checkout` flow? | UX 7.13, SP 11 | Pricing form per BP fields; breakdown renders server line items generically | High |
| Q-07 | Which payment providers are enabled at launch (MoMo, Airtel, cash only)? | UX 17, SP 9 | Methods come from `GET /settings/payment-methods`; mock enables CASH + MTN_MOMO + AIRTEL_MONEY | High |
| Q-08 | Ticket/receipt delivery channels (SMS, WhatsApp, email)? | UX 17 | Share uses `navigator.share` / copy link only; "Send via SMS" appears only if `capabilities.notifications.sms` | Low |
| Q-09 | Is there a public customer ticket/receipt link? | UX 3 | Public route `/t/:ticketNumber` shows a read-only ticket status stub, behind `capabilities.publicTickets` | Low |
| Q-10 | Do `OTHER` vehicles need slot types? | BP App. B | `ANY` slots only | Low |
| Q-11 | Offline support level? | UX 17, BP 2.3 | Offline banner + disabled actions + local draft recovery of the *entry form text fields only* (never photos, never payments) | High |
| Q-12 | Photo retention and who can view/download photos? | UX 11, BP FR-019 | No download button; photos load through authenticated blob fetch; retention UI is a read-only placeholder | High |
| Q-13 | Final brand name/logo? | UX 1 | Working name "ParkWise"; isolated in `constants/brand.js` | Low |
| Q-14 | Pilot: one lot or multiple at launch? | SP 11 | Lot switcher appears only when user has >1 lot | Low |
| Q-15 | Languages (English only? Kinyarwanda/French)? | UX 9 | English strings in `constants/messages.js` so extraction to i18n is mechanical | Medium |
| Q-16 | Long-session alert threshold? | UX 7.6, BP 4.1 | Threshold from `GET /settings/policy.longSessionMinutes`; no alert if absent | Low |
| Q-17 | Manager permission scope for payment corrections / voids? | UX 3, BP 5 | Permission keys exist; granted per USER_ROLES_AND_PERMISSIONS.md and always re-checked by backend | High |
| Q-18 | Plate format validation (Rwandan `RAD 123 A` only?) | UX 7.4 | Loose validation: 2-12 alphanumerics/spaces/dashes, uppercase display only | Low |
| Q-19 | When the fee is 0 (grace period), who may complete the session and does it still produce a receipt? | built-in gap | UI offers "Complete session (no fee)" via `POST /parking-sessions/:id/complete` to anyone with `sessions.checkout`; mock creates no receipt | Medium |
| Q-20 | Should the browser keep an offline queue for photos/entries? | UX 17 | No. Entry/exit/payment actions are disabled offline; only text-field drafts persist (sessionStorage) | Medium |
| Q-21 | Is the theme preference (dark/cream) allowed in `localStorage`? It stores no business data. | MP 11 | Stored under `pw-theme` as a UI preference only | Low |
