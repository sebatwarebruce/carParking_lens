import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import ThemeProvider from './ThemeProvider.jsx';
import NetworkProvider from './NetworkProvider.jsx';
import ToastProvider from './ToastProvider.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { LotProvider } from '@/context/LotContext.jsx';
import ErrorBoundary from '@/components/feedback/ErrorBoundary.jsx';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (count, err) => err?.retryable !== false && err?.kind !== 'auth' && err?.kind !== 'forbidden' && err?.kind !== 'notFound' && err?.kind !== 'validation' && count < 2,
    },
    mutations: { retry: false },
  },
});

export default function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <NetworkProvider>
              <ToastProvider>
                <AuthProvider>
                  <LotProvider>{children}</LotProvider>
                </AuthProvider>
              </ToastProvider>
            </NetworkProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
