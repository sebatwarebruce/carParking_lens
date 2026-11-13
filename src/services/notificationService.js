import { api, asList } from './api.js';
import { EP } from './endpoints.js';

export const notificationService = {
  async list() { return asList((await api.get(EP.notifications.list)).data); },
  async markRead(id) { await api.patch(EP.notifications.read(id)); },
  async markAllRead() { await api.patch(EP.notifications.readAll); },
  async getPrefs() { return (await api.get(EP.notifications.prefs)).data; },
  async savePrefs(body) { return (await api.put(EP.notifications.prefs, body)).data; },
};
