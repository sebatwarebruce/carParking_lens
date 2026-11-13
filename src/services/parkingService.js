import { api, clean } from './api.js';
import { EP } from './endpoints.js';

export const parkingService = {
  async listLots() { return (await api.get(EP.lots.list)).data; },
  async getLot(id) { return (await api.get(EP.lots.one(id))).data; },
  async createLot(body) { return (await api.post(EP.lots.list, body)).data; },
  async updateLot(id, body) { return (await api.patch(EP.lots.one(id), body)).data; },
  async listSlots(lotId, filters = {}) { return (await api.get(EP.lots.slots(lotId), { params: clean(filters) })).data; },
  async createSlots(lotId, body) { return (await api.post(EP.lots.slots(lotId), body)).data; },
  /** body: { status?, vehicleType?, zone?, reason? } reason is required for OUT_OF_SERVICE */
  async updateSlot(id, body) { return (await api.patch(EP.slots.one(id), body)).data; },
};
