import { useQuery } from '@tanstack/react-query';
import { parkingService } from '@/services/parkingService.js';

export const slotKeys = { all: ['slots'], list: (lotId, f) => ['slots', lotId, f] };
export const useSlots = (lotId, filters = {}, options = {}) =>
  useQuery({ queryKey: slotKeys.list(lotId, filters), queryFn: () => parkingService.listSlots(lotId, filters), enabled: !!lotId, staleTime: 5_000, gcTime: 60_000, refetchInterval: 15_000, ...options });
