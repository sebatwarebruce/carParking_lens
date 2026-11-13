import { api, asList, clean } from './api.js';
import { EP } from './endpoints.js';

export const staffService = {
  async list(params = {}) { return asList((await api.get(EP.staff.list, { params: clean(params) })).data); },
  async get(id) { return (await api.get(EP.staff.one(id))).data; },
  async create(body) { return (await api.post(EP.staff.list, body)).data; },
  /** body: { role?, lotIds?, status?, reason? } */
  async update(id, body) { return (await api.patch(EP.staff.one(id), body)).data; },
  async resetPassword(id) { await api.post(EP.staff.reset(id)); },
};
