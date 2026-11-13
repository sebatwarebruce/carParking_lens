import { api, asList, clean } from './api.js';
import { EP } from './endpoints.js';

export const paymentService = {
  /**
   * body: { method, amount, phone?, amountReceived? }. `amount` is the Checkout.total the user saw;
   * the server verifies it. Success is NEVER assumed from this call for mobile money.
   */
  async create(sessionId, body, idempotencyKey) {
    return (await api.post(EP.sessions.payments(sessionId), body, { headers: { 'Idempotency-Key': idempotencyKey } })).data;
  },
  async get(id) { return (await api.get(EP.payments.one(id))).data; },
  async list(params = {}) { return asList((await api.get(EP.payments.list, { params: clean(params) })).data); },
  async queue(params = {}) { return asList((await api.get(EP.payments.queue, { params: clean(params) })).data); },
  async void(id, reason) { return (await api.post(EP.payments.void(id), { reason })).data; },
};
