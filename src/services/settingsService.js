import { api, asList } from './api.js';
import { EP } from './endpoints.js';

export const settingsService = {
  /** { requireCustomerPhone, requirePhotos, allowPhotoException, longSessionMinutes, currency, timezone, capabilities } */
  async policy() { return (await api.get(EP.settings.policy)).data; },
  /** Status only. Provider credentials are never exposed to the browser. */
  async paymentMethods() { return (await api.get(EP.settings.paymentMethods)).data; },
  async organization() { return (await api.get(EP.settings.organization)).data; },
  async updateOrganization(body) { return (await api.patch(EP.settings.organization, body)).data; },
  async listOrganizations() { return asList((await api.get(EP.organizations.list)).data); },
  async createOrganization(body) { return (await api.post(EP.organizations.list, body)).data; },
  async updateOrganizationById(id, body) { return (await api.patch(EP.organizations.one(id), body)).data; },
};
