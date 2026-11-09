import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cloudflare Pages: `npm run build` -> `dist/`. History fallback is provided
// by public/_redirects (/* -> /index.html 200).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
