import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cloudflare Pages (Git integration): `npm run build` -> `dist/`. No
// public/_redirects is shipped: Pages provides SPA history fallback for
// React Router automatically when no top-level 404.html exists. This project
// must NOT be deployed via `wrangler deploy` (Workers); Pages builds and
// serves dist/ directly from the connected repo.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
