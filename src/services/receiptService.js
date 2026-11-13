import { api, asList, clean } from './api.js';
import { EP } from './endpoints.js';

export const receiptService = {
  async list(params = {}) { return asList((await api.get(EP.receipts.list, { params: clean(params) })).data); },
  async get(id) { return (await api.get(EP.receipts.one(id))).data; },
  async reprint(id) { return (await api.post(EP.receipts.reprint(id))).data; },
};
