import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { sessionService } from '@/services/sessionService.js';

// Query-key factories: never inline key strings in components.
export const sessionKeys = {
  all: ['sessions'],
  active: (p) => ['sessions', 'active', p],
  list: (p) => ['sessions', 'list', p],
  search: (p) => ['sessions', 'search', p],
  detail: (id) => ['sessions', 'detail', id],
};

export const useActiveSessions = (params, options = {}) =>
  useQuery({ queryKey: sessionKeys.active(params), queryFn: () => sessionService.listActive(params), staleTime: 5_000, refetchInterval: 20_000, enabled: !!params.lotId || params.lotId === undefined, ...options });

export const useSessionHistory = (params) =>
  useQuery({ queryKey: sessionKeys.list(params), queryFn: () => sessionService.list(params), placeholderData: keepPreviousData, staleTime: 30_000 });

export const useSessionSearch = (params, enabled) =>
  useQuery({ queryKey: sessionKeys.search(params), queryFn: () => sessionService.search(params), enabled, staleTime: 0 });

// Financial/stateful: never trusted stale. `refetchInterval` can be passed by callers (e.g. while a payment is pending).
export const useSession = (id, options = {}) =>
  useQuery({ queryKey: sessionKeys.detail(id), queryFn: () => sessionService.get(id), staleTime: 0, gcTime: 30_000, enabled: !!id, ...options });
