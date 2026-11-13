import { api, clean } from './api.js';
import { EP } from './endpoints.js';

export const pricingService = {
  async list(params = {}) { return (await api.get(EP.pricing.list, { params: clean(params) })).data; },
  async create(body) { return (await api.post(EP.pricing.list, body)).data; },
  async update(id, body) { return (await api.patch(EP.pricing.one(id), body)).data; },
  /** Server-side sample billing so the UI never calculates fees itself. */
  async preview(body) { return (await api.post(EP.pricing.preview, body)).data; },
};
