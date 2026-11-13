import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
    env: { VITE_USE_MOCKS: 'true', VITE_MOCK_LATENCY_MS: '0', VITE_API_BASE_URL: '/api/v1' },
  },
});
