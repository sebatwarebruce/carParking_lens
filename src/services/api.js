import axios from 'axios';
import { env } from '@/app/config/env.js';
import { tokenStore } from './tokenStore.js';
import { normalizeError } from './errors.js';
import { serverClock } from './clock.js';

/** The single HTTP client. Components never import axios directly. */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20000,
  withCredentials: true, // httpOnly refresh cookie
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = axios
      .post(`${env.apiBaseUrl}/auth/refresh`, null, { withCredentials: true, adapter: api.defaults.adapter })
      .then((r) => { tokenStore.set(r.data.accessToken); return r.data.accessToken; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/providers', '/auth/forgot-password'];

api.interceptors.response.use(
  (res) => {
    const serverDate = res.headers?.['x-server-time'] || res.headers?.date;
    if (serverDate) serverClock.sync(serverDate);
    return res;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    if (status === 401 && original && !original._retry && !NO_REFRESH.some((p) => original.url?.startsWith(p)) && code !== 'INVALID_CREDENTIALS') {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        tokenStore.clear();
        tokenStore.notifyExpired();
        throw normalizeError(error);
      }
    }
    throw normalizeError(error);
  },
);

/** Unwraps list responses: accepts { items, page, pageSize, total } (contract) or a bare array. */
export const asList = (data) => (Array.isArray(data) ? { items: data, page: 1, pageSize: data.length, total: data.length } : data);

/** Removes empty filter values so they are not sent as `?q=`. */
export const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null && v !== 'ALL'));
