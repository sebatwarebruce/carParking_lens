import { api } from '@/services/api.js';
import { createMockAdapter } from './server.js';
import { controls, resetDb } from './db.js';

/** Dynamically imported from main.jsx only when VITE_USE_MOCKS=true, so it is absent from real builds. */
export function installMocks() {
  api.defaults.adapter = createMockAdapter();
  if (typeof window !== 'undefined') window.__parkwiseMock = { controls, resetDb };
  return { controls, resetDb };
}
export { controls };
