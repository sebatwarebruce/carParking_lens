// MOCK DATABASE. In-memory only: it resets on reload and is NEVER the source of truth for anything real.
import { buildSeed } from './seed.js';

export const controls = {
  networkDown: false,
  forceSlotConflictNext: false,
  failNextUpload: false,
  momoOutcome: 'success', // success | fail
  momoDelaySeconds: 7,
  minDemoMinutes: 95, // makes fees non-zero for fresh demo entries (mock-only time acceleration)
};

export let db = buildSeed();
export const resetDb = () => { db = buildSeed(); };
export const tokens = new Map(); // access token -> userId
export const refreshSessions = new Set();
export const attempts = { count: 0, until: 0 };
