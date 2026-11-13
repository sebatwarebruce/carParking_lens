import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService.js';
import { TERMINAL_PAYMENT } from '@/constants/statuses.js';

export const paymentKeys = { queue: (p) => ['payments', 'queue', p], list: (p) => ['payments', 'list', p], one: (id) => ['payments', 'one', id] };

export const usePaymentQueue = (params) => useQuery({ queryKey: paymentKeys.queue(params), queryFn: () => paymentService.queue(params), refetchInterval: 10_000, staleTime: 0, enabled: !!params.lotId });
export const usePaymentHistory = (params) => useQuery({ queryKey: paymentKeys.list(params), queryFn: () => paymentService.list(params), placeholderData: keepPreviousData, staleTime: 15_000 });

/** Polls every 2.5 s while the payment is PENDING, and stops on any terminal status. Status always comes from the server. */
export const usePaymentStatus = (id) => useQuery({
  queryKey: paymentKeys.one(id), queryFn: () => paymentService.get(id), enabled: !!id, staleTime: 0, gcTime: 30_000,
  refetchInterval: (q) => (q.state.data && TERMINAL_PAYMENT.includes(q.state.data.status) ? false : 2_500),
});
