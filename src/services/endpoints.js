// Every backend path in one file. Source labels (BP/SP/PROPOSED) are documented in docs/API_INTEGRATION_CONTRACTS.md.
export const EP = {
  auth: { login: '/auth/login', refresh: '/auth/refresh', logout: '/auth/logout', providers: '/auth/providers', social: (p) => `/auth/social/${p}/start`, forgot: '/auth/forgot-password' },
  me: '/me',
  lots: { list: '/lots', one: (id) => `/lots/${id}`, slots: (id) => `/lots/${id}/slots` },
  slots: { one: (id) => `/slots/${id}` },
  vehicles: { list: '/vehicles', one: (id) => `/vehicles/${id}`, sessions: (id) => `/vehicles/${id}/sessions` },
  sessions: {
    root: '/parking-sessions', active: '/parking-sessions/active', search: '/parking-sessions/search',
    one: (id) => `/parking-sessions/${id}`, checkout: (id) => `/parking-sessions/${id}/checkout`,
    payments: (id) => `/parking-sessions/${id}/payments`, complete: (id) => `/parking-sessions/${id}/complete`,
    cancel: (id) => `/parking-sessions/${id}/cancel`, receipt: (id) => `/parking-sessions/${id}/receipt`,
  },
  payments: { list: '/payments', one: (id) => `/payments/${id}`, void: (id) => `/payments/${id}/void`, queue: '/payments/queue' },
  receipts: { list: '/receipts', one: (id) => `/receipts/${id}`, reprint: (id) => `/receipts/${id}/reprint` },
  pricing: { list: '/pricing-rules', one: (id) => `/pricing-rules/${id}`, preview: '/pricing-rules/preview' },
  reports: { dashboard: '/dashboard/summary', daily: '/reports/daily', revenue: '/reports/revenue', occupancy: '/reports/occupancy', attendants: '/reports/attendants', sessions: '/reports/sessions' },
  staff: { list: '/staff', one: (id) => `/staff/${id}`, reset: (id) => `/staff/${id}/reset-password` },
  audit: '/audit-logs',
  notifications: { list: '/notifications', read: (id) => `/notifications/${id}/read`, readAll: '/notifications/read-all', prefs: '/me/notification-preferences' },
  settings: { policy: '/settings/policy', paymentMethods: '/settings/payment-methods', organization: '/settings/organization' },
  organizations: { list: '/organizations', one: (id) => `/organizations/${id}` },
  uploads: { vehiclePhoto: '/uploads/vehicle-photo' },
};
