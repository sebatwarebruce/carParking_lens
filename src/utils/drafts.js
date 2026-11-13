// Safe draft recovery: TEXT fields of the entry form only, in sessionStorage. Never photos, payments or tokens.
// A draft is NOT an entry: nothing is official until the server confirms.
const KEY = 'pw-entry-draft';
export const loadDraft = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
export const saveDraft = (d) => { try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ } };
export const clearDrafts = () => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } };
