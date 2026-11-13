// The ONLY file that reads import.meta.env. All values are public (bundled into the browser).
const raw = import.meta.env;

export const env = Object.freeze({
  apiBaseUrl: (raw.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),
  useMocks: String(raw.VITE_USE_MOCKS ?? 'true') === 'true',
  mockLatencyMs: Number(raw.VITE_MOCK_LATENCY_MS ?? 350),
  defaultTimezone: raw.VITE_DEFAULT_TIMEZONE || 'Africa/Kigali',
  defaultCurrency: raw.VITE_DEFAULT_CURRENCY || 'RWF',
  supportContact: raw.VITE_SUPPORT_CONTACT || '',
  isDev: !!raw.DEV,
});
