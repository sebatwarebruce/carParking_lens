import { api, asList, clean } from './api.js';
import { EP } from './endpoints.js';

const idem = (key) => (key ? { headers: { 'Idempotency-Key': key } } : {});

export const sessionService = {
  /** Entry. The server sets entryTime + ticketNumber. */
  async create(body, idempotencyKey) { return (await api.post(EP.sessions.root, body, idem(idempotencyKey))).data; },
  async listActive(params = {}) { return asList((await api.get(EP.sessions.active, { params: clean(params) })).data); },
  async list(params = {}) { return asList((await api.get(EP.sessions.root, { params: clean(params) })).data); },
  async search(params) { return asList((await api.get(EP.sessions.search, { params: clean(params) })).data); },
  async get(id) { return (await api.get(EP.sessions.one(id))).data; },
  /** Records exit time on the server and returns the priced Checkout. The client never calculates the fee. */
  async checkout(id, body, idempotencyKey) { return (await api.post(EP.sessions.checkout(id), body, idem(idempotencyKey))).data; },
  async complete(id, body) { return (await api.post(EP.sessions.complete(id), body)).data; },
  async cancel(id, body) { return (await api.post(EP.sessions.cancel(id), body)).data; },
  async receiptFor(id) { return (await api.get(EP.sessions.receipt(id))).data; },
};
