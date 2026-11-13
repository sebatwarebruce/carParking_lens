import { api } from './api.js';
import { EP } from './endpoints.js';
import { tokenStore } from './tokenStore.js';

export const authService = {
  async login({ identifier, password }) {
    const { data } = await api.post(EP.auth.login, { identifier, password });
    tokenStore.set(data.accessToken);
    return data;
  },
  /** Used on app start: the refresh cookie (if any) restores the session. */
  async restore() {
    const { data } = await api.post(EP.auth.refresh);
    tokenStore.set(data.accessToken);
    return data;
  },
  async me() { return (await api.get(EP.me)).data; },
  async logout() {
    try { await api.post(EP.auth.logout); } finally { tokenStore.clear(); }
  },
  async providers() { return (await api.get(EP.auth.providers)).data; },
  async startSocial(provider, redirectUri) { return (await api.post(EP.auth.social(provider), { redirectUri })).data; },
  async forgotPassword(identifier) { await api.post(EP.auth.forgot, { identifier }); },
};
