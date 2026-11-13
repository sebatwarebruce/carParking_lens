import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { env } from '@/app/config/env.js';
import AppProviders from '@/app/providers/AppProviders.jsx';
import App from './App.jsx';

async function bootstrap() {
  // The mock backend is a separate chunk, loaded only in demo mode and never in a real-backend build.
  if (env.useMocks) { const { installMocks } = await import('@/mocks/install.js'); installMocks(); }
  createRoot(document.getElementById('root')).render(<StrictMode><AppProviders><App /></AppProviders></StrictMode>);
}
bootstrap();
