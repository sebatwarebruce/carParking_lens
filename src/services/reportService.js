import { api, clean } from './api.js';
import { EP } from './endpoints.js';

export const reportService = {
  async dashboard(params) { return (await api.get(EP.reports.dashboard, { params: clean(params) })).data; },
  async daily(params) { return (await api.get(EP.reports.daily, { params: clean(params) })).data; },
  async revenue(params) { return (await api.get(EP.reports.revenue, { params: clean(params) })).data; },
  async occupancy(params) { return (await api.get(EP.reports.occupancy, { params: clean(params) })).data; },
  async attendants(params) { return (await api.get(EP.reports.attendants, { params: clean(params) })).data; },
  async sessions(params) { return (await api.get(EP.reports.sessions, { params: clean(params) })).data; },
};
