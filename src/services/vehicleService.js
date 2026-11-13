import { api, asList, clean } from './api.js';
import { EP } from './endpoints.js';

export const vehicleService = {
  async list(params = {}) { return asList((await api.get(EP.vehicles.list, { params: clean(params) })).data); },
  async get(id) { return (await api.get(EP.vehicles.one(id))).data; },
  async sessions(id, params = {}) { return asList((await api.get(EP.vehicles.sessions(id), { params: clean(params) })).data); },
  async register(body) { return (await api.post(EP.vehicles.list, body)).data; },
};
