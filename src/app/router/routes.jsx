import { createBrowserRouter } from 'react-router-dom';
import AppShell from '@/layouts/AppShell.jsx';
import AuthLayout from '@/layouts/AuthLayout.jsx';
import { RequireAuth, RequirePermission, RoleHome } from './guards.jsx';
import { P } from '@/constants/permissions.js';
import { SkeletonRows } from '@/components/ui/Skeleton.jsx';

/** Every page is code-split. Permissions here are UX guards only; the API is the security boundary. */
const lazyPage = (loader, guard) => ({
  lazy: async () => {
    const Page = (await loader()).default;
    const Component = guard ? () => <RequirePermission {...guard}><Page /></RequirePermission> : Page;
    return { Component };
  },
  HydrateFallback: () => <SkeletonRows rows={3} />,
});

export const router = createBrowserRouter([
  { element: <AuthLayout />, children: [{ path: '/login', ...lazyPage(() => import('@/features/auth/pages/LoginPage.jsx')) }] },
  {
    element: <RequireAuth />,
    children: [{
      element: <AppShell />,
      children: [
        { index: true, element: <RoleHome /> },
        { path: 'home', ...lazyPage(() => import('@/features/dashboard/pages/AttendantHome.jsx'), { perm: P.DASHBOARD_VIEW }) },
        { path: 'dashboard', ...lazyPage(() => import('@/features/dashboard/pages/DashboardPage.jsx'), { perm: P.DASHBOARD_VIEW }) },
        { path: 'cashier', ...lazyPage(() => import('@/features/dashboard/pages/CashierHome.jsx'), { perm: P.PAYMENTS_VIEW }) },
        { path: 'platform', ...lazyPage(() => import('@/features/dashboard/pages/PlatformHome.jsx'), { perm: P.PLATFORM_MANAGE }) },
        { path: 'spaces', ...lazyPage(() => import('@/features/parking-slots/pages/SpacesPage.jsx'), { perm: P.SLOTS_VIEW }) },
        { path: 'entry', ...lazyPage(() => import('@/features/vehicle-entry/pages/VehicleEntryPage.jsx'), { perm: P.SESSIONS_CREATE }) },
        { path: 'exit', ...lazyPage(() => import('@/features/vehicle-exit/pages/VehicleExitPage.jsx'), { perm: P.SESSIONS_CHECKOUT }) },
        { path: 'exit/:sessionId', ...lazyPage(() => import('@/features/vehicle-exit/pages/CheckoutPage.jsx'), { anyOf: [P.SESSIONS_CHECKOUT, P.PAYMENTS_COLLECT] }) },
        { path: 'sessions', ...lazyPage(() => import('@/features/parking-sessions/pages/ActiveSessionsPage.jsx'), { perm: P.SESSIONS_VIEW }) },
        { path: 'sessions/:id', ...lazyPage(() => import('@/features/parking-sessions/pages/SessionDetailPage.jsx'), { perm: P.SESSIONS_VIEW }) },
        { path: 'history', ...lazyPage(() => import('@/features/parking-sessions/pages/HistoryPage.jsx'), { perm: P.SESSIONS_VIEW }) },
        { path: 'payments', ...lazyPage(() => import('@/features/payments/pages/PaymentsPage.jsx'), { perm: P.PAYMENTS_VIEW }) },
        { path: 'receipts', ...lazyPage(() => import('@/features/receipts/pages/ReceiptsPage.jsx'), { perm: P.RECEIPTS_VIEW }) },
        { path: 'receipts/:id', ...lazyPage(() => import('@/features/receipts/pages/ReceiptPage.jsx'), { perm: P.RECEIPTS_VIEW }) },
        { path: 'vehicles', ...lazyPage(() => import('@/features/vehicles/pages/VehiclesPage.jsx'), { perm: P.VEHICLES_VIEW }) },
        { path: 'locations', ...lazyPage(() => import('@/features/parking-lots/pages/LocationsPage.jsx'), { perm: P.LOTS_VIEW }) },
        { path: 'pricing', ...lazyPage(() => import('@/features/pricing/pages/PricingPage.jsx'), { perm: P.PRICING_VIEW }) },
        { path: 'reports', ...lazyPage(() => import('@/features/reports/pages/ReportsPage.jsx'), { perm: P.REPORTS_VIEW }) },
        { path: 'staff', ...lazyPage(() => import('@/features/staff/pages/StaffPage.jsx'), { perm: P.STAFF_VIEW }) },
        { path: 'organizations', ...lazyPage(() => import('@/features/organizations/pages/OrganizationsPage.jsx'), { perm: P.PLATFORM_MANAGE }) },
        { path: 'audit', ...lazyPage(() => import('@/features/audit-logs/pages/AuditPage.jsx'), { perm: P.AUDIT_VIEW }) },
        { path: 'notifications', ...lazyPage(() => import('@/features/notifications/pages/NotificationsPage.jsx'), { perm: P.NOTIFICATIONS_VIEW }) },
        { path: 'settings', ...lazyPage(() => import('@/features/settings/pages/SettingsPage.jsx'), { perm: P.SETTINGS_VIEW }) },
        { path: 'profile', ...lazyPage(() => import('@/features/settings/pages/ProfilePage.jsx')) },
        { path: 'help', ...lazyPage(() => import('@/features/settings/pages/HelpPage.jsx')) },
        { path: 's/:ticket', ...lazyPage(() => import('@/features/auth/pages/TicketLookupRedirect.jsx')) },
        { path: '*', ...lazyPage(() => import('@/features/auth/pages/NotFoundPage.jsx')) },
      ],
    }],
  },
]);
