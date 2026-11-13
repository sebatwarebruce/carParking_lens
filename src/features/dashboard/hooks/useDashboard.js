import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService.js';

export const dashboardKeys = { summary: (p) => ['dashboard', 'summary', p] };
export const useDashboard = (params, enabled = true) =>
  useQuery({ queryKey: dashboardKeys.summary(params), queryFn: () => reportService.dashboard(params), refetchInterval: 30_000, staleTime: 10_000, enabled });
