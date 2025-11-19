import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for both development and production
//
// We explicitly set the `base` option so that assets resolve correctly
// when the app is served from a subpath (e.g. GitHub Pages).  The
// `VITE_BASE` environment variable can override this value, but if
// unspecified we default to the repository name.  Avoid leaking
// sensitive data by not injecting API keys into the client bundle.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Set the base path for the application.  When deploying to GitHub
    // Pages the site is served from `/Thanit-Rachkul/`, so we set that
    // as the default.  Users can override this with VITE_BASE in
    // .env if hosting elsewhere.
    base: env.VITE_BASE || '/Thanit-Rachkul/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // Expose only the variables that are safe for the client.  In
    // particular, do not expose the Gemini API key here – the
    // front‑end should communicate with the backend (see
    // components/ChatMode.tsx) which holds the key.
    define: {
      // Provide a sensible default for the backend URL so that the app
      // continues to function even if VITE_BACKEND_URL is not defined at
      // build time (e.g. on GitHub Pages).  This should point to your
      // deployed backend on Render or Cloud Run.  Users can override
      // VITE_BACKEND_URL in their own .env.local file for local development.
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || 'https://thanit-rachkul.onrender.com'),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
