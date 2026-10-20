import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site from /vehicle-purchase-calculator/, so every asset path starts there.
export default defineConfig({
  base: '/vehicle-purchase-calculator/',
  plugins: [react()],
  test: { include: ['src/**/*.test.ts'] }
});
