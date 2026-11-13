import { api, asList, clean } from './api.js';
import { EP } from './endpoints.js';

/** Read-only: audit records are generated and signed by the backend. */
export const auditService = {
  async list(params = {}) { return asList((await api.get(EP.audit, { params: clean(params) })).data); },
};
