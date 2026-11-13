import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetworkProvider from '@/app/providers/NetworkProvider.jsx';
import ToastProvider from '@/app/providers/ToastProvider.jsx';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { LotProvider } from '@/context/LotContext.jsx';

export function renderApp(ui, { route = '/' } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}><NetworkProvider><ToastProvider><AuthProvider><LotProvider><MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter></LotProvider></AuthProvider></ToastProvider></NetworkProvider></QueryClientProvider>,
  );
}
